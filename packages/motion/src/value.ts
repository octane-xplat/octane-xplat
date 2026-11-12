import {
  parseMotionValue,
  compatibleMotionValues,
  MotionTargetError,
  type MotionData,
} from './value-codec'
import type { MotionProperty, ParsedValue, ValueReferences } from './value-codec'
import { runValueAnimation } from './value-playback'
import type { Clock } from './clock-types.js'
import type { Transition } from './types.js'
import {
  runAnimation,
  validateTransition,
  type AnimationControls,
  type AnimationResult,
} from './engine.js'

/** Events supported by subscribed animation values. */
export interface MotionValueEvents<T extends MotionData = number> {
  /** Subscribe to value changes. */
  change: (value: T) => void
  /** Fires before playback starts; listeners may stop, destroy, or replace it. */
  animationStart: () => void
  /** Fires when the current animation finishes successfully. */
  animationComplete: () => void
  /** Fires when an animation is interrupted. */
  animationCancel: () => void
  /** Release listeners and bindings. */
  destroy: () => void
}

/** Number or validated string value with subscriptions independent of Octane renders. */
export class MotionValue<T extends MotionData = number> {
  private current: T
  private previous: T
  private velocity = 0
  private slotVelocities: number[] = []
  private updated: number
  private controls?: AnimationControls
  private generation = 0
  private listeners = new Map<keyof MotionValueEvents, Set<Function>>()
  private passive?: { set(value: T): void }
  private disposed = false
  private derived = false
  private bindingContexts = new Map<
    object,
    { property: MotionProperty; references: () => ValueReferences | undefined }
  >()
  /** @internal Bind measurement context without transferring value ownership. */
  bindResolution(
    owner: object,
    property: MotionProperty,
    references: () => ValueReferences | undefined,
  ): () => void {
    this.bindingContexts.set(owner, { property, references })
    return () => {
      this.bindingContexts.delete(owner)
    }
  }
  private parseSample(value: T, allowUnmeasured = false): ParsedValue {
    if (typeof value === 'number' || !this.bindingContexts.size) {
      return parseMotionValue(value)
    }
    let parsed: ParsedValue | undefined
    for (const context of this.bindingContexts.values()) {
      const refs = context.references()
      const next = parseMotionValue(
        value,
        context.property,
        allowUnmeasured && refs?.measured === false ? undefined : refs,
      )
      if (
        parsed &&
        (parsed.signature !== next.signature ||
          JSON.stringify(parsed.numbers) !== JSON.stringify(next.numbers) ||
          JSON.stringify(parsed.units) !== JSON.stringify(next.units))
      ) {
        throw new MotionTargetError(
          'conflicting-owner',
          context.property,
          value,
          'this value resolves differently on its bound hosts; use a separate value per coordinate space',
        )
      }
      parsed = next
    }
    const resolved = parsed!
    return {
      ...resolved,
      serialize(numbers) {
        const sample = resolved.serialize(numbers)
        return typeof sample === 'number' ? String(sample) + (resolved.units[0] ?? '') : sample
      },
    }
  }
  constructor(
    initial: T,
    private clock: Clock,
  ) {
    this.assert(initial)
    this.current = this.previous = initial
    this.updated = clock.now()
  }
  private assert(value: T) {
    if (typeof value === 'string') {
      parseMotionValue(value)
    } else if (!Number.isFinite(value)) {
      throw new Error('motion: values must be finite numbers')
    }
  }
  /** Read the current sample. */
  /** @internal Narrow drag bindings to logical numeric channels. */
  isNumeric(): this is this & MotionValue<number> {
    return typeof this.current === 'number'
  }
  /** @internal Derived handles have one owning mapper. */
  markDerived(): void {
    this.derived = true
  }
  /** @internal Publish a mapper sample. */
  updateDerived(value: T): void {
    this.assert(value)
    this.write(value)
  }
  private assertWritable(): void {
    if (this.derived) {
      throw new MotionTargetError(
        'conflicting-owner',
        '',
        this.current,
        'derived values are read-only',
      )
    }
  }
  get(): T {
    return this.current
  }
  /** Read the previous sample. */
  getPrevious(): T {
    return this.previous
  }
  /** Velocity in units per second; stale samples have zero velocity. */
  getVelocity(): number {
    return this.clock.now() - this.updated > 30 ? 0 : this.velocity
  }
  /** Set immediately, or animate when this is a useSpring value. */
  set(value: T): void {
    this.assertWritable()
    this.assert(value)
    if (this.disposed) {
      return
    }

    if (this.passive) {
      this.passive.set(value)
    } else {
      this.stop()
      this.write(value)
    }
  }
  /** Snap and stop current playback, resetting velocity. */
  jump(value: T): void {
    this.assertWritable()
    this.assert(value)
    this.stop()
    this.write(value)
    this.velocity = 0
    this.slotVelocities = []
  }
  /** Subscribe without causing a component render. Returns an unsubscribe function. */
  on<K extends keyof MotionValueEvents<T>>(
    event: K,
    callback: MotionValueEvents<T>[K],
  ): () => void {
    let listeners = this.listeners.get(event)

    if (!listeners) {
      this.listeners.set(event, (listeners = new Set()))
    }

    listeners.add(callback)
    return () => {
      listeners.delete(callback)
    }
  }
  private emit(event: keyof MotionValueEvents, value?: T) {
    // Snapshot because subscribers may unsubscribe or add listeners while notified.
    // eslint-disable-next-line unicorn/no-useless-spread
    for (const callback of [...(this.listeners.get(event) ?? [])]) {
      callback(value)
    }
  }
  private write(value: T) {
    this.track(value)
    if (!this.disposed && value !== this.previous) {
      this.emit('change', value)
    }
  }
  /** Update position bookkeeping without emitting — platform-delegated runs
   *  track presentation state so interruption reads fresh value/velocity. */
  track(value: T): void {
    this.assert(value)
    if (this.disposed) {
      return
    }

    const now = this.clock.now()
    const elapsed = now - this.updated

    if (elapsed > 0) {
      if (typeof value === 'number' && typeof this.current === 'number') {
        this.velocity = elapsed > 30 ? 0 : ((value - this.current) * 1000) / elapsed
      } else {
        const previous = this.parseSample(this.current, true)
        const next = this.parseSample(value, true)
        const compatible =
          previous.signature === next.signature &&
          previous.units.every((unit, i) => unit === next.units[i])
        this.slotVelocities = next.numbers.map((n, i) =>
          elapsed > 30 || !compatible ? 0 : ((n - previous.numbers[i]) * 1000) / elapsed,
        )
        this.velocity = next.numbers.length === 1 ? this.slotVelocities[0] : 0
      }
    }

    this.previous = this.current
    this.current = value
    this.updated = now
  }
  /** Animate to a destination. New playback replaces old playback.
   *  `type: 'inertia'` ignores `target` — pass `value.get()` and steer with
   *  `velocity`, `power`, `timeConstant`, `min`, `max`. */
  animate(
    target: T,
    transition: Transition = {},
    clampSample?: (value: number) => number,
  ): AnimationControls {
    this.assertWritable()
    this.assert(target)
    validateTransition(transition)
    const immediate =
      (transition.type ?? 'tween') === 'tween' &&
      transition.duration === 0 &&
      !transition.delay &&
      !transition.repeat
    const from = this.parseSample(this.current)
    const to = this.parseSample(target)
    if (typeof this.current !== 'number' || typeof target !== 'number') {
      if (!immediate) {
        compatibleMotionValues(from, to)
      }
      if (
        (transition.type === 'inertia' && to.numbers.length !== 1) ||
        (to.numbers.length !== 1 && transition.velocity !== undefined)
      ) {
        throw new MotionTargetError(
          'invalid-value',
          '',
          target,
          'compound values require per-slot springs or a numeric progress value',
        )
      }
    }
    const slotVelocities = this.clock.now() - this.updated > 30 ? [] : [...this.slotVelocities]
    if (this.disposed) {
      return { finished: Promise.resolve('cancelled'), stop() {} }
    }

    const velocity = transition.velocity ?? this.getVelocity()

    // Cancellation listeners can replace playback before this call starts.
    const generation = this.generation + 1

    this.stop('replaced')
    if (this.disposed || generation !== this.generation) {
      return { finished: Promise.resolve(this.disposed ? 'cancelled' : 'replaced'), stop() {} }
    }

    let playback: AnimationControls | undefined
    let result: AnimationResult | undefined
    let resolve!: (result: AnimationResult) => void
    const finished = new Promise<AnimationResult>((done) => {
      resolve = done
    })

    const settle = (next: AnimationResult) => {
      if (result !== undefined) {
        return
      }

      result = next
      resolve(next)
    }

    // Publish cancellable ownership before calling subscribers, including the
    // synchronous change callback of a zero-duration run.
    const controls: AnimationControls = {
      finished,
      stop: (reason = 'cancelled') => {
        settle(reason)
        playback?.stop(reason)
      },
    }

    this.controls = controls
    void finished.then((result) => {
      if (generation !== this.generation || this.disposed) {
        return
      }

      this.controls = undefined
      if (result === 'finished') {
        this.emit('animationComplete')
      }
    })

    this.emit('animationStart')
    if (generation !== this.generation || this.disposed || result !== undefined) {
      return controls
    }

    const writeSample = (value: MotionData) => {
      if (generation === this.generation && !this.disposed) {
        const sample = typeof value === 'number' && clampSample ? clampSample(value) : value
        // The codec preserves the target's numeric/string representation. The
        // generic T records that representation; TypeScript cannot express it.
        this.write(sample as T)
      }
    }
    playback =
      typeof this.current === 'number' && typeof target === 'number'
        ? runAnimation(
            this.clock,
            this.current,
            target,
            { ...transition, velocity },
            writeSample,
            () => settle('finished'),
          )
        : immediate
          ? runAnimation(this.clock, 0, 1, transition, () => writeSample(to.serialize(to.numbers)))
          : runValueAnimation(
              this.clock,
              from,
              to,
              transition,
              slotVelocities.length ? slotVelocities : [velocity],
              writeSample,
            )

    if (result !== undefined) {
      playback.stop(result)
    }

    void playback.finished.then(settle)

    return controls
  }
  /** Stop playback at its current value. */
  stop(reason: 'cancelled' | 'replaced' = 'cancelled'): void {
    ++this.generation
    if (this.controls) {
      const controls = this.controls

      this.controls = undefined
      controls.stop(reason)
      this.emit('animationCancel')
    }
  }
  /** Release playback and listeners when the owning component unmounts. */
  destroy(): void {
    if (this.disposed) {
      return
    }

    this.disposed = true
    this.stop()
    this.emit('destroy')
    this.listeners.clear()
    this.bindingContexts.clear()
    this.passive = undefined
  }
  /** @internal Install the useSpring setter interception. */
  attach(setter: (value: T) => void) {
    this.passive = { set: setter }
    return (): void => {
      this.passive = undefined
      this.stop()
    }
  }
}
