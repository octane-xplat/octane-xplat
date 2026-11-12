import { createPressController, type PressController, type PressOptions } from './press'
import { createScope } from 'octane/signals'
import { gestureController, type GestureController } from './controller'
import { gestureLeaves, gestureRelation } from './composition'
import type {
  ActivationEvent,
  CancelReason,
  Contact,
  GestureInput,
  GesturePhase,
  GestureSample,
  GestureSession,
  InteractionTarget,
  PanGesture,
  PanGestureOptions,
  PanSample,
  PinchGesture,
  PinchSample,
  Point,
  Positions,
} from './types'

/** A host supplies logical window coordinates. Up excludes the lifted contacts. */
export interface InputFrame {
  readonly type: 'down' | 'move' | 'up' | 'cancel'
  readonly time: number
  readonly contacts: readonly InputContact[]
  readonly changed: InputContact
  /** Deepest host first. Hit testing is performed only on first down. */
  readonly hitPath: readonly object[]
  /** Editable/hosted native manipulation owns the sequence before app recognition. */
  readonly nativeOwned?: boolean
  /** Native semantic activation is retained; an ancestor drag can still observe. */
  readonly nativePressOwned?: boolean
  /** Managed manipulation may recognize here; ancestor drags and presses may not. */
  readonly nativeBoundary?: object
  readonly cancelReason?: CancelReason
  /** Native contact lifetime, such as MotionEvent.downTime; not an app-visible session ID. */
  readonly cohort?: string
  /** Android may deliver target-split pointer subsets through different hosts. */
  readonly partialContacts?: boolean
}

export interface InputContact {
  readonly id: string
  readonly kind: Contact['kind']
  readonly window: Point
  readonly screen: Point | null
}

export interface GestureSpace {
  readonly target: InteractionTarget
  local(point: Point): Point | null
  /** Capture the inverse transform now; future host movement cannot change it. */
  freeze(): ((point: Point) => Point) | null
}

export interface GestureScheduler {
  frame(callback: () => void): () => void
  /** Optional native main-loop clock for managed press holds. */
  delay?(callback: () => void, milliseconds: number): () => void
  error(error: unknown): void
  /** Cancel incompatible native work before lifecycle callbacks. False rejects the claim. */
  claim?(host: object): boolean
}

interface Attachment {
  readonly host: object
  readonly input: GestureInput
  readonly space: GestureSpace
  readonly controllers: readonly GestureController[]
}

interface PressAttachment {
  readonly observeOnly: boolean
  readonly host: object
  readonly controller: PressController
  readonly space: GestureSpace
}

interface Run {
  readonly attachment: Attachment
  readonly controller: GestureController
  readonly handle: PanGesture | PinchGesture
  readonly options: PanGestureOptions | null
  readonly min: number
  readonly max: number
  phase: GesturePhase
  projection: ((point: Point) => Point) | null
  start: Point
  startPosition: Positions | null
  startSpan: number
  last: PanSample | PinchSample | null
  previous: Point
  previousTime: number
  velocity: Point | null
  velocityAt: number
  pending: PanSample | PinchSample | null
  readonly session: GestureSession
}

let ownerId = 0
const point = (p: Point): Point => Object.freeze({ x: p.x, y: p.y })
const span = (contacts: readonly InputContact[]) =>
  contacts.length < 2
    ? 0
    : Math.hypot(
        contacts[0].window.x - contacts[1].window.x,
        contacts[0].window.y - contacts[1].window.y,
      )

/** One root's input state. Host adapters own event subscriptions, capture and scrolling. */
export function createGestureOwner(scheduler: GestureScheduler) {
  const identity = ++ownerId
  const publication = createScope({ scopeKey: `xplat:gesture-owner:${identity}` })
  const attachments = new Set<Attachment>()
  const presses = new Set<PressAttachment>()
  const targets = new Map<object, { target: InteractionTarget; count: number }>()
  let activePresses: PressAttachment[] = []
  let sequenceTarget: InteractionTarget | null = null
  let runs: Run[] = []
  let sequence = 0
  let session = 0
  let inSequence = false
  let multiContact = false
  let consumed = false
  let disposed = false
  let transactionDepth = 0
  const callbackErrors: unknown[] = []
  let lastFrame: InputFrame | null = null
  let cancelFrame: (() => void) | null = null

  function transaction<T>(write: () => T): T {
    transactionDepth++
    try {
      return publication.batch(write)
    } finally {
      transactionDepth--
      if (!transactionDepth) {
        const errors = callbackErrors.splice(0)

        for (const error of errors) {
          scheduler.error(error)
        }
      }
    }
  }

  function call(callback: (() => void) | undefined) {
    if (!callback) {
      return
    }

    try {
      callback()
    } catch (error) {
      callbackErrors.push(error)
    }
  }

  function publish(run: Run, sample?: PanSample | PinchSample | null) {
    const count = lastFrame?.contacts.length ?? 0

    if (run.controller.kind === 'pan') {
      if (sample && !('translation' in sample)) {
        throw new Error('Pan sample invariant')
      }

      run.controller.publish(run.phase, count, sample)
    } else {
      if (sample && !('scale' in sample)) {
        throw new Error('Pinch sample invariant')
      }

      run.controller.publish(run.phase, count, sample)
    }
  }

  function emit(run: Run, kind: 'onStart' | 'onUpdate' | 'onEnd', sample: PanSample | PinchSample) {
    if (run.controller.kind === 'pan' && 'translation' in sample) {
      call(() => run.controller.kind === 'pan' && run.controller.options[kind]?.(sample))
    } else if (run.controller.kind === 'pinch' && 'scale' in sample) {
      call(() => run.controller.kind === 'pinch' && run.controller.options[kind]?.(sample))
    }
  }

  function terminal(run: Run, outcome: 'ended' | 'cancelled', reason: CancelReason = 'system') {
    if (run.phase !== 'active' || !run.last) {
      return
    }

    // State changes first: user callbacks can cancel, disable or unmount synchronously.
    run.phase = outcome
    run.pending = null

    const sample = run.last

    publish(run, sample)
    if (outcome === 'ended') {
      emit(run, 'onEnd', sample)
    } else if (run.controller.kind === 'pan' && 'translation' in sample) {
      call(() => run.controller.kind === 'pan' && run.controller.options.onCancel?.(sample, reason))
    } else if (run.controller.kind === 'pinch' && 'scale' in sample) {
      call(
        () => run.controller.kind === 'pinch' && run.controller.options.onCancel?.(sample, reason),
      )
    }

    if (run.controller.kind === 'pan' && 'translation' in sample) {
      call(
        () =>
          run.controller.kind === 'pan' &&
          run.controller.options.onFinalize?.(
            outcome === 'ended' ? { outcome, sample } : { outcome, sample, reason },
          ),
      )
    } else if (run.controller.kind === 'pinch' && 'scale' in sample) {
      call(
        () =>
          run.controller.kind === 'pinch' &&
          run.controller.options.onFinalize?.(
            outcome === 'ended' ? { outcome, sample } : { outcome, sample, reason },
          ),
      )
    }
  }

  function invalidate(controller: GestureController, reason: CancelReason) {
    if (disposed) {
      return
    }

    transaction(() => {
      for (const run of runs.filter((run) => run.controller === controller)) {
        if (run.phase === 'active') {
          terminal(run, 'cancelled', reason)
        } else if (run.phase === 'possible' || run.phase === 'idle') {
          run.phase = 'failed'
          publish(run)
        }
      }
    })
  }

  function positions(run: Run, contact: InputContact): Positions {
    const local = run.attachment.space.local(contact.window)

    return Object.freeze({
      local: local ? point(local) : null,
      window: point(contact.window),
      screen: contact.screen ? point(contact.screen) : null,
    })
  }

  function primary(run: Run, frame: InputFrame): InputContact {
    if ((run.controller.kind === 'pinch' || run.min > 1) && frame.contacts.length >= run.min) {
      const contacts = frame.contacts.slice(0, run.max)

      return {
        id: contacts[0].id,
        kind: contacts[0].kind,
        screen: null,
        window: {
          x: contacts.reduce((sum, c) => sum + c.window.x, 0) / contacts.length,
          y: contacts.reduce((sum, c) => sum + c.window.y, 0) / contacts.length,
        },
      }
    }

    if (run.min > 1 && run.last) {
      return {
        ...frame.changed,
        window: run.last.position.window,
        screen: run.last.position.screen,
      }
    }

    return frame.contacts[0] ?? frame.changed
  }

  function measure(run: Run, frame: InputFrame): PanSample | PinchSample | null {
    const contact = primary(run, frame)
    const position = positions(run, contact)

    if (!run.startPosition) {
      if (frame.contacts.length < run.min || !run.projection) {
        return null
      }

      run.start = point(run.projection(contact.window))
      run.startPosition = position
      run.startSpan = span(frame.contacts)
      run.previous = run.start
      run.previousTime = frame.time
    }

    if (!position.local || !run.startPosition || !run.projection) {
      return null
    }

    const current = run.projection(contact.window)
    const elapsed = frame.time - run.previousTime

    if (elapsed > 0 && (current.x !== run.previous.x || current.y !== run.previous.y)) {
      run.velocity = point({
        x: ((current.x - run.previous.x) * 1000) / elapsed,
        y: ((current.y - run.previous.y) * 1000) / elapsed,
      })

      run.velocityAt = frame.time
    }

    run.previous = point(current)
    run.previousTime = frame.time

    const base: GestureSample = Object.freeze({
      sequenceId: `${identity}:${sequence}`,
      time: frame.time,
      target: sequenceTarget ?? run.attachment.space.target,
      currentTarget: run.attachment.space.target,
      position,
      startPosition: run.startPosition,
      pointerCount: frame.contacts.length,
      contacts: Object.freeze(
        frame.contacts.map((c) =>
          Object.freeze({ id: c.id, kind: c.kind, position: positions(run, c) }),
        ),
      ),
      session: run.session,
    })

    if (run.controller.kind === 'pan') {
      return Object.freeze({
        ...base,
        translation: point({ x: current.x - run.start.x, y: current.y - run.start.y }),
        velocity: frame.time - run.velocityAt <= 100 ? run.velocity : point({ x: 0, y: 0 }),
      })
    }

    const scale =
      frame.contacts.length >= 2 && run.startSpan > 0
        ? span(frame.contacts) / run.startSpan
        : run.last && 'scale' in run.last
          ? run.last.scale
          : 1

    const prior = run.last && 'scale' in run.last ? run.last : null

    return Object.freeze({
      ...base,
      scale,
      scaleVelocity:
        prior && frame.time > prior.time
          ? ((scale - prior.scale) * 1000) / (frame.time - prior.time)
          : null,
    })
  }

  function relation(a: Run, b: Run) {
    return a.attachment === b.attachment
      ? gestureRelation(a.attachment.input, a.handle, b.handle)
      : { kind: 'compete' as const, before: false }
  }

  function canActivate(run: Run) {
    for (const other of runs) {
      if (other === run) {
        continue
      }

      const rule = relation(other, run)

      if (!rule || rule.kind === 'simultaneous') {
        continue
      }

      if (other.phase === 'active') {
        return false
      }

      if (rule.kind === 'prioritize' && rule.before && other.phase === 'possible') {
        return false
      }
    }

    return true
  }

  function claimHost(host: object): boolean {
    let claimed = true

    try {
      claimed = scheduler.claim?.(host) ?? true
    } catch (error) {
      callbackErrors.push(error)
      claimed = false
    }

    return claimed
  }

  function activate(run: Run) {
    if (!claimHost(run.attachment.host)) {
      run.phase = 'failed'
      publish(run)
      return
    }

    // A native cancellation callback may synchronously detach or disable this candidate.
    if (run.phase !== 'possible' || run.controller.disposed || !run.controller.enabled()) {
      return
    }

    run.phase = 'active'
    consumed = true
    for (const press of Array.from(presses)) {
      press.controller.cancel()
    }

    // Dormant multi-contact recognizers remain idle, not superseded.
    for (const other of Array.from(runs)) {
      if (other === run || other.phase !== 'possible') {
        continue
      }

      if (relation(run, other)?.kind === 'simultaneous') {
        continue
      }

      other.phase = 'failed'
      publish(other)
    }

    publish(run, run.last)
    if (run.last) {
      emit(run, 'onStart', run.last)
    }
  }

  function updateSample(run: Run, sample: PanSample | PinchSample) {
    if (!run.handle.sample$) {
      publish(run)
      return
    }

    if (run.controller.options.samples === 'input') {
      publish(run, sample)
      return
    }

    publish(run)
    run.pending = sample
    if (!cancelFrame) {
      cancelFrame = scheduler.frame(() => {
        cancelFrame = null
        if (disposed) {
          return
        }

        transaction(() => {
          for (const current of runs) {
            if (current.pending && current.phase === 'active') {
              publish(current, current.pending)
            }

            current.pending = null
          }
        })
      })
    }
  }

  const suspensions = new Set<(host: object) => boolean>()
  const isSuspended = (host: object) => [...suspensions].some((contains) => contains(host))

  function admit(frame: InputFrame) {
    inSequence = true
    multiContact = false
    consumed = false
    sequence++
    sequenceTarget =
      frame.hitPath
        .map((host) => targets.get(host)?.target)
        .find((target) => target !== undefined) ?? null

    for (const press of Array.from(presses)) {
      press.controller.cancel()
    }

    const controlHosts = [...attachments]
      .filter((attachment) => attachment.controllers.some((controller) => controller.manipulation))
      .map((attachment) => attachment.host)

    // A drawn adjustable thumb belongs to its registered manipulation host.
    // Its semantic role must not exclude that host's own pan registration.
    const manipulation = frame.hitPath.findIndex((host) => controlHosts.includes(host))
    const boundary =
      manipulation >= 0
        ? manipulation
        : frame.hitPath.findIndex((host) => host === frame.nativeBoundary)

    const eligibleHost = (host: object) =>
      frame.hitPath.includes(host) && (boundary < 0 || frame.hitPath.indexOf(host) <= boundary)

    const eligiblePresses = [...presses]
      .filter(
        (press) =>
          !frame.nativeOwned &&
          !frame.nativePressOwned &&
          !isSuspended(press.host) &&
          eligibleHost(press.host),
      )
      .sort((a, b) => frame.hitPath.indexOf(a.host) - frame.hitPath.indexOf(b.host))

    const primary = eligiblePresses.find((press) => !press.observeOnly)

    activePresses = eligiblePresses.filter((press) => press.observeOnly || press === primary)

    const selected = [...attachments]
      .filter((a) => !frame.nativeOwned && !isSuspended(a.host) && eligibleHost(a.host))
      .sort((a, b) => frame.hitPath.indexOf(a.host) - frame.hitPath.indexOf(b.host))

    runs = selected.flatMap((attachment) =>
      attachment.controllers.map((controller) => {
        const projection = attachment.space.freeze()
        const contact = frame.changed
        const admitted =
          !controller.admission ||
          controller.admission.admit({
            local: attachment.space.local(contact.window),
            window: contact.window,
            screen: contact.screen,
          })

        const pan = controller.kind === 'pan' ? controller.options : null
        const run: Run = {
          attachment,
          controller,
          handle: controller.handle,
          options: pan
            ? { ...pan, activation: { ...pan.activation }, pointers: { ...pan.pointers } }
            : null,
          min: pan?.pointers?.min ?? (controller.kind === 'pinch' ? 2 : 1),
          max: pan?.pointers?.max ?? (controller.kind === 'pinch' ? 2 : 1),
          phase: projection && admitted ? 'idle' : 'failed',
          projection,
          start: point({ x: 0, y: 0 }),
          startPosition: null,
          startSpan: 0,
          last: null,
          previous: point({ x: 0, y: 0 }),
          previousTime: frame.time,
          velocity: null,
          velocityAt: frame.time,
          pending: null,
          session: Object.freeze({
            id: `${identity}:session:${++session}`,
            cancel: () => {
              if (disposed || run.phase !== 'active') {
                return
              }

              transaction(() => terminal(run, 'cancelled', 'programmatic'))
            },
          }),
        }

        return run
      }),
    )

    for (const press of activePresses) {
      press.controller.begin(frame, `${identity}:${sequence}`, sequenceTarget ?? press.space.target)
    }
  }

  function dispatch(frame: InputFrame): boolean {
    if (disposed) {
      return false
    }

    return transaction(() => {
      lastFrame = frame
      if (!inSequence) {
        if (frame.type !== 'down' || !frame.contacts.length) {
          return false
        }

        admit(frame)
      }

      if (frame.type !== 'down' || frame.contacts.length > 1) {
        for (const press of Array.from(activePresses)) {
          press.controller.update(frame)
        }
      }

      if (frame.contacts.length > 1) {
        multiContact = true
      }

      // Evaluate every candidate's validity before deciding winners or waiting.
      for (const run of Array.from(runs)) {
        if (run.controller.disposed || !run.controller.owner) {
          continue
        }

        publish(run)
        if (!run.controller.enabled()) {
          invalidate(run.controller, 'disabled')
          if (run.phase === 'idle') {
            run.phase = 'failed'
          }

          continue
        }

        if (frame.type === 'cancel') {
          const sample = measure(run, frame)

          if (sample) {
            run.last = sample
          }

          terminal(run, 'cancelled', frame.cancelReason ?? 'system')
          if (run.phase !== 'cancelled') {
            run.phase = 'failed'
          }

          publish(run)
          continue
        }

        if (frame.contacts.length > run.max) {
          if (run.phase === 'active') {
            const sample = measure(run, frame)

            if (sample) {
              run.last = sample
            }
          }

          terminal(run, 'cancelled', 'pointer-count')
          if (run.phase !== 'cancelled') {
            run.phase = 'failed'
          }

          publish(run)
          continue
        }

        if (run.phase === 'active' && frame.contacts.length < run.min) {
          const sample = measure(run, frame)

          if (sample) {
            run.last = sample
          }

          terminal(run, 'ended')
          continue
        }

        if (
          run.phase === 'idle' &&
          frame.contacts.length >= run.min &&
          !(multiContact && run.max === 1)
        ) {
          run.phase = 'possible'
        }

        if (run.phase !== 'possible' && run.phase !== 'active') {
          continue
        }

        const sample = measure(run, frame)

        if (!sample) {
          if (run.phase === 'active') {
            terminal(run, 'cancelled', 'coordinate-space-lost')
          } else {
            run.phase = 'failed'
            publish(run)
          }

          continue
        }

        run.last = sample
        if (run.phase === 'possible' && run.options && 'translation' in sample) {
          const { x, y } = sample.translation
          const distance = run.options.activation?.distance ?? 8,
            dominance = run.options.activation?.dominance ?? 1.2

          const opposite =
            run.options.axis === 'x'
              ? Math.abs(y) >= distance && Math.abs(y) > Math.abs(x) * dominance
              : run.options.axis === 'y'
                ? Math.abs(x) >= distance && Math.abs(x) > Math.abs(y) * dominance
                : false

          if (opposite) {
            run.phase = 'failed'
          }
        }

        publish(run)
      }

      for (const run of Array.from(runs)) {
        if (run.phase === 'possible' && run.last && canActivate(run)) {
          let ready = false

          if (run.options && 'translation' in run.last) {
            const { x, y } = run.last.translation
            const distance = run.options.activation?.distance ?? 8,
              dominance = run.options.activation?.dominance ?? 1.2

            ready =
              run.options.axis === 'both'
                ? Math.hypot(x, y) >= distance
                : run.options.axis === 'x'
                  ? Math.abs(x) >= distance && Math.abs(x) > Math.abs(y) * dominance
                  : Math.abs(y) >= distance && Math.abs(y) > Math.abs(x) * dominance
          } else if ('scale' in run.last) {
            ready = Math.abs(run.last.scale - 1) * run.startSpan >= 4
          }

          if (
            ready &&
            run.controller.admission &&
            'translation' in run.last &&
            !run.controller.admission.intent(run.last)
          ) {
            run.phase = 'failed'
            publish(run)
          } else if (ready) {
            activate(run)
          }
        }

        if (run.phase === 'active' && run.last) {
          updateSample(run, run.last)
          if (run.phase === 'active') {
            emit(run, 'onUpdate', run.last)
          }
        }
      }

      const wasConsumed = consumed

      if (frame.type === 'cancel') {
        cancelFrame?.()
        cancelFrame = null
      }

      // Cancellation can leave physical contacts down. They retain this failed
      // cohort until the final up; a new second finger cannot start a new run.
      if (!frame.contacts.length) {
        cancelFrame?.()
        cancelFrame = null
        inSequence = false
        for (const run of runs) {
          run.pending = null
          if (!run.controller.disposed) {
            run.phase = 'idle'
            publish(run)
          }
        }

        runs = []
      }

      return wasConsumed
    })
  }

  function registerTarget(host: object, target: InteractionTarget): () => void {
    if (disposed) {
      throw new Error('Cannot register on a disposed interaction owner')
    }

    const existing = targets.get(host)

    if (existing) {
      existing.count++
    } else {
      targets.set(host, { target, count: 1 })
    }

    let alive = true

    return () => {
      if (!alive) {
        return
      }

      alive = false

      const record = targets.get(host)

      if (record && --record.count === 0) {
        targets.delete(host)
      }
    }
  }

  function canonicalSpace(host: object, space: GestureSpace): GestureSpace {
    return {
      target: targets.get(host)?.target ?? space.target,
      local: (point) => space.local(point),
      freeze: () => space.freeze(),
    }
  }

  function registerPress(
    host: object,
    options: PressOptions,
    space: GestureSpace,
    contains: (point: Point) => boolean,
  ) {
    const releaseTarget = registerTarget(host, space.target)
    const ownedSpace = canonicalSpace(host, space)
    let attachment: PressAttachment
    let controller: PressController

    try {
      controller = createPressController(options, {
        space: ownedSpace,
        contains,
        call,
        schedule(callback, delay) {
          const fire = () => {
            if (!disposed) {
              transaction(callback)
            }
          }
          if (scheduler.delay) {
            return scheduler.delay(fire, delay)
          }
          const id = setTimeout(fire, delay)
          return () => clearTimeout(id)
        },
        claim() {
          if (disposed || !presses.has(attachment)) {
            return false
          }

          if (!claimHost(host)) {
            return false
          }

          consumed = true
          for (const other of Array.from(presses)) {
            if (other !== attachment) {
              other.controller.cancel()
            }
          }

          for (const run of Array.from(runs)) {
            if (run.phase === 'active') {
              terminal(run, 'cancelled', 'superseded')
            } else if (run.phase === 'possible' || run.phase === 'idle') {
              run.phase = 'failed'
              publish(run)
            }
          }

          return !disposed && presses.has(attachment)
        },
      })
    } catch (error) {
      releaseTarget()
      throw error
    }

    attachment = { host, controller, space: ownedSpace, observeOnly: options.observeOnly === true }
    presses.add(attachment)

    let alive = true

    return {
      commit(next: PressOptions) {
        if (alive && !disposed) {
          transaction(() => controller.commit(next))
        }
      },
      activate(
        source: ActivationEvent['source'],
        preventDefault?: () => void,
        kind?: 'press' | 'double',
      ) {
        return alive && !disposed && !isSuspended(host)
          ? transaction(() => controller.activate(source, preventDefault, kind))
          : false
      },
      longPress(source: ActivationEvent['source']) {
        return alive && !disposed && !isSuspended(host)
          ? transaction(() => controller.longPress(source))
          : false
      },
      get pressed() {
        return controller.pressed
      },
      dispose() {
        if (!alive) {
          return
        }

        alive = false

        const cleanup = () => {
          presses.delete(attachment)
          activePresses = activePresses.filter((press) => press !== attachment)

          try {
            controller.dispose()
          } finally {
            releaseTarget()
          }
        }

        if (disposed) {
          cleanup()
        } else {
          transaction(cleanup)
        }
      },
    }
  }

  function register(host: object, input: GestureInput, space: GestureSpace): () => void {
    if (disposed) {
      throw new Error('Cannot register on a disposed interaction owner')
    }

    const controllers = gestureLeaves(input).map(gestureController)

    if (controllers.some((controller) => controller.owner || controller.disposed)) {
      throw new Error('Gesture is already attached or disposed')
    }

    const releaseTarget = registerTarget(host, space.target)
    const attachment: Attachment = { host, input, space: canonicalSpace(host, space), controllers }
    const attached: GestureController[] = []

    try {
      for (const controller of controllers) {
        controller.attach(host, (reason) => invalidate(controller, reason))
        attached.push(controller)
      }

      attachments.add(attachment)
    } catch (error) {
      for (const controller of attached) {
        controller.detach()
      }

      releaseTarget()
      throw error
    }

    let alive = true

    return () => {
      if (!alive) {
        return
      }

      alive = false
      if (disposed) {
        releaseTarget()
        return
      }

      transaction(() => {
        attachments.delete(attachment)
        for (const controller of controllers) {
          invalidate(controller, 'detached')
          controller.detach()
        }

        releaseTarget()
      })
    }
  }

  function cancelWhere(contains: (host: object) => boolean, reason: CancelReason) {
    if (disposed) {
      return
    }

    transaction(() => {
      for (const press of Array.from(presses)) {
        if (contains(press.host)) {
          press.controller.cancel()
        }
      }

      for (const run of Array.from(runs)) {
        if (!contains(run.attachment.host)) {
          continue
        }

        if (run.phase === 'active') {
          terminal(run, 'cancelled', reason)
        } else if (run.phase === 'possible' || run.phase === 'idle') {
          run.phase = 'failed'
          publish(run)
        }
      }
    })
  }

  return {
    dispatch,
    register,
    registerPress,
    registerTarget,
    cancelWhere,
    suspendWhere(contains: (host: object) => boolean) {
      if (disposed) {
        throw new Error('Cannot suspend a disposed owner')
      }

      suspensions.add(contains)
      try {
        cancelWhere(contains, 'scope-suspended')
      } catch (error) {
        suspensions.delete(contains)
        throw error
      }

      return () => {
        suspensions.delete(contains)
      }
    },
    dispose() {
      if (disposed) {
        return
      }

      disposed = true
      try {
        transaction(() => {
          if (lastFrame) {
            lastFrame = { ...lastFrame, type: 'cancel', contacts: [] }
          }

          for (const press of Array.from(presses)) {
            press.controller.dispose()
          }

          presses.clear()
          suspensions.clear()
          activePresses = []
          for (const run of Array.from(runs)) {
            if (run.last) {
              run.last = Object.freeze({
                ...run.last,
                pointerCount: 0,
                contacts: Object.freeze([]),
              })
            }

            terminal(run, 'cancelled', 'detached')
          }

          for (const attachment of attachments) {
            for (const controller of attachment.controllers) {
              controller.detach()
            }
          }

          attachments.clear()
          runs = []
          cancelFrame?.()
          cancelFrame = null
          targets.clear()
        })
      } finally {
        publication.dispose()
      }
    },
  }
}

export type GestureOwner = ReturnType<typeof createGestureOwner>

export type PressRegistration = ReturnType<GestureOwner['registerPress']>
