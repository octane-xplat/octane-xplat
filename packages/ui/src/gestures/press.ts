import type { GestureSpace, InputContact, InputFrame } from './owner'
import type {
  ActivationEvent,
  GestureSample,
  GestureSession,
  InteractionTarget,
  Positions,
} from './types'

export interface PressOptions {
  /** Private visual observer: never becomes a semantic activation target. */
  readonly observeOnly?: boolean
  readonly enabled?: boolean
  readonly slop: number | null
  /** Null uses the host's semantic long-press event; web supplies its hold interval. */
  readonly longPressDelay?: number | null
  onPress?(event: ActivationEvent): void
  onDoublePress?(): void
  onLongPress?(): void
  onPressIn?(sample?: GestureSample): void
  onPressOut?(sample?: GestureSample): void
}

export interface PressContext {
  readonly space: GestureSpace
  call(callback: (() => void) | undefined): void
  schedule(callback: () => void, delay: number): () => void
  /** Claim semantic hold ownership before its action; cancel competing work. */
  claim(): boolean
  contains(point: InputContact['window']): boolean
}

interface PressRun {
  readonly sequenceId: string
  readonly target: InteractionTarget
  readonly start: InputContact['window']
  readonly startPosition: Positions
  readonly slop: number | null
  readonly session: GestureSession
  phase: 'pressed' | 'released' | 'activated' | 'long-pressed' | 'cancelled'
  sample: GestureSample | null
  entered: boolean
  doubled: boolean
  cancelTimer: (() => void) | null
}

let nextController = 0

/** A semantic participant of the root owner, not an independent input recognizer. */
export function createPressController(options: PressOptions, context: PressContext) {
  const id = ++nextController
  let sequence = 0,
    disposed = false

  let run: PressRun | null = null

  function validate(next: PressOptions) {
    if (next.slop !== null && (!Number.isFinite(next.slop) || next.slop < 0)) {
      throw new Error('Press slop must be finite and nonnegative')
    }

    if (
      next.longPressDelay != null &&
      (!Number.isFinite(next.longPressDelay) || next.longPressDelay < 0)
    ) {
      throw new Error('Long press delay must be finite and nonnegative')
    }
  }

  validate(options)

  const enabled = () => !disposed && options.enabled !== false

  function positions(contact: InputContact): Positions {
    const local = context.space.local(contact.window)

    return Object.freeze({
      local: local ? Object.freeze({ ...local }) : null,
      window: Object.freeze({ x: contact.window.x, y: contact.window.y }),
      screen: contact.screen ? Object.freeze({ x: contact.screen.x, y: contact.screen.y }) : null,
    })
  }

  function sample(current: PressRun, frame: InputFrame): GestureSample {
    return Object.freeze({
      sequenceId: current.sequenceId,
      time: frame.time,
      target: current.target,
      currentTarget: context.space.target,
      position: positions(frame.contacts[0] ?? frame.changed),
      startPosition: current.startPosition,
      contacts: Object.freeze(
        frame.contacts.map((contact) =>
          Object.freeze({ id: contact.id, kind: contact.kind, position: positions(contact) }),
        ),
      ),
      pointerCount: frame.contacts.length,
      session: current.session,
    })
  }

  function out(current: PressRun) {
    current.cancelTimer?.()
    current.cancelTimer = null
    if (!current.entered) {
      return
    }

    current.entered = false
    context.call(() => options.onPressOut?.(current.sample ?? undefined))
  }

  function cancel() {
    if (!run || run.phase === 'cancelled') {
      return
    }

    if (run.phase === 'activated') {
      run.doubled = true
      return
    }

    run.phase = 'cancelled'
    out(run)
  }

  function longPress(source: ActivationEvent['source']): boolean {
    if (!enabled() || !options.onLongPress) {
      return false
    }

    if (source === 'pointer') {
      const current = run

      if (!current || current.phase !== 'pressed' || !context.claim()) {
        return false
      }

      if (!enabled() || run !== current || current.phase !== 'pressed') {
        return false
      }

      current.phase = 'long-pressed'
      current.cancelTimer?.()
      current.cancelTimer = null
    }

    context.call(options.onLongPress)
    return true
  }

  return {
    get pressed() {
      return Boolean(run?.entered)
    },
    commit(next: PressOptions) {
      validate(next)
      options = next
      if (options.enabled === false) {
        cancel()
      }
    },
    begin(frame: InputFrame, sequenceId: string, target: InteractionTarget) {
      cancel()
      run = null
      if (
        disposed ||
        options.enabled === false ||
        frame.nativeOwned ||
        frame.contacts.length !== 1
      ) {
        return
      }

      const first = frame.contacts[0],
        startPosition = positions(first)

      if (!startPosition.local || !context.contains(first.window)) {
        return
      }

      const current: PressRun = {
        sequenceId,
        target,
        start: Object.freeze({ x: first.window.x, y: first.window.y }),
        startPosition,
        slop: options.slop,
        session: Object.freeze({
          id: `press:${id}:${++sequence}`,
          cancel() {
            if (run === current && (current.phase === 'pressed' || current.phase === 'released')) {
              cancel()
            }
          },
        }),
        phase: 'pressed',
        sample: null,
        entered: true,
        doubled: false,
        cancelTimer: null,
      }

      run = current
      current.sample = sample(current, frame)
      if (options.onLongPress && options.longPressDelay != null) {
        current.cancelTimer = context.schedule(() => {
          if (run === current && current.phase === 'pressed') {
            longPress('pointer')
          }
        }, options.longPressDelay)
      }

      context.call(() => options.onPressIn?.(current.sample ?? undefined))
    },
    update(frame: InputFrame) {
      const current = run

      if (!current || (current.phase !== 'pressed' && current.phase !== 'long-pressed')) {
        return
      }

      current.sample = sample(current, frame)
      if (options.enabled === false || frame.type === 'cancel' || frame.contacts.length > 1) {
        cancel()
        return
      }

      const contact = frame.contacts[0] ?? frame.changed

      if (
        (current.slop !== null &&
          Math.hypot(contact.window.x - current.start.x, contact.window.y - current.start.y) >
            current.slop) ||
        !context.contains(contact.window)
      ) {
        cancel()
        return
      }

      current.sample = sample(current, frame)
      if (frame.type === 'up' && frame.contacts.length === 0) {
        current.phase = current.phase === 'long-pressed' ? 'cancelled' : 'released'
        out(current)
      }
    },
    activate(
      source: ActivationEvent['source'],
      preventDefault: () => void = () => {},
      kind: 'press' | 'double' = 'press',
    ): boolean {
      if (!enabled() || (kind === 'press' ? !options.onPress : !options.onDoublePress)) {
        return false
      }

      const current = run

      if (source === 'pointer') {
        if (!current || !current.sample) {
          return false
        }

        if (
          kind === 'press'
            ? current.phase !== 'released'
            : current.doubled || (current.phase !== 'released' && current.phase !== 'activated')
        ) {
          return false
        }

        current.phase = 'activated'
        if (kind === 'double') {
          current.doubled = true
        }
      }

      if (kind === 'double') {
        if (!options.onDoublePress) {
          return false
        }

        context.call(options.onDoublePress)
        return true
      }

      if (!options.onPress) {
        return false
      }

      const event: ActivationEvent = Object.freeze({
        source,
        target: source === 'pointer' && current ? current.target : context.space.target,
        currentTarget: context.space.target,
        pointer: source === 'pointer' && current ? current.sample : null,
        preventDefault,
      })

      context.call(() => options.onPress?.(event))
      return true
    },
    longPress,
    cancel,
    dispose() {
      if (disposed) {
        return
      }

      disposed = true
      cancel()
    },
  }
}

export type PressController = ReturnType<typeof createPressController>
