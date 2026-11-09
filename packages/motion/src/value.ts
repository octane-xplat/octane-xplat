import type { Clock } from './clock-types.js'
import type { Transition } from './types.js'
import {
  runAnimation,
  validateTransition,
  type AnimationControls,
  type AnimationResult,
} from './engine.js'

/** Events supported by numeric motion values. */
export interface MotionValueEvents {
  /** Subscribe to value changes. */
  change: (value: number) => void
  /** Fires before playback starts; listeners may stop, destroy, or replace it. */
  animationStart: () => void
  /** Fires when the current animation finishes successfully. */
  animationComplete: () => void
  /** Fires when an animation is interrupted. */
  animationCancel: () => void
  /** Release listeners and bindings. */
  destroy: () => void
}

/** Numeric value with direct subscriptions; it does not subscribe Octane renders. */
export class MotionValue {
  private current: number
  private previous: number
  private velocity = 0
  private updated: number
  private controls?: AnimationControls
  private generation = 0
  private listeners = new Map<keyof MotionValueEvents, Set<Function>>()
  private passive?: (value: number) => void
  private disposed = false
  constructor(
    initial: number,
    private clock: Clock,
  ) {
    this.assert(initial)
    this.current = this.previous = initial
    this.updated = clock.now()
  }
  private assert(value: number) {
    if (!Number.isFinite(value)) {
      throw new Error('motion: values must be finite numbers')
    }
  }
  /** Read the current sample. */
  get(): number {
    return this.current
  }
  /** Read the previous sample. */
  getPrevious(): number {
    return this.previous
  }
  /** Velocity in units per second; stale samples have zero velocity. */
  getVelocity(): number {
    return this.clock.now() - this.updated > 30 ? 0 : this.velocity
  }
  /** Set immediately, or animate when this is a useSpring value. */
  set(value: number): void {
    this.assert(value)
    if (this.disposed) {
      return
    }

    if (this.passive) {
      this.passive(value)
    } else {
      this.stop()
      this.write(value)
    }
  }
  /** Snap and stop current playback, resetting velocity. */
  jump(value: number): void {
    this.assert(value)
    this.stop()
    this.write(value)
    this.velocity = 0
  }
  /** Subscribe without causing a component render. Returns an unsubscribe function. */
  on<K extends keyof MotionValueEvents>(event: K, callback: MotionValueEvents[K]): () => void {
    let listeners = this.listeners.get(event)

    if (!listeners) {
      this.listeners.set(event, (listeners = new Set()))
    }

    listeners.add(callback)
    return () => {
      listeners.delete(callback)
    }
  }
  private emit(event: keyof MotionValueEvents, value?: number) {
    // Snapshot because subscribers may unsubscribe or add listeners while notified.
    // eslint-disable-next-line unicorn/no-useless-spread
    for (const callback of [...(this.listeners.get(event) ?? [])]) {
      callback(value)
    }
  }
  private write(value: number) {
    this.track(value)
    if (!this.disposed && value !== this.previous) {
      this.emit('change', value)
    }
  }
  /** Update position bookkeeping without emitting — platform-delegated runs
   *  track presentation state so interruption reads fresh value/velocity. */
  track(value: number): void {
    this.assert(value)
    if (this.disposed) {
      return
    }

    const now = this.clock.now()
    const elapsed = now - this.updated

    if (elapsed > 0) {
      this.velocity = elapsed > 30 ? 0 : ((value - this.current) * 1000) / elapsed
    }

    this.previous = this.current
    this.current = value
    this.updated = now
  }
  /** Animate to a destination. New playback replaces old playback.
   *  `type: 'inertia'` ignores `target` — pass `value.get()` and steer with
   *  `velocity`, `power`, `timeConstant`, `min`, `max`. */
  animate(
    target: number,
    transition: Transition = {},
    clampSample?: (value: number) => number,
  ): AnimationControls {
    this.assert(target)
    validateTransition(transition)
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

    playback = runAnimation(
      this.clock,
      this.current,
      target,
      { ...transition, velocity },
      (value) => {
        if (generation === this.generation && !this.disposed) {
          this.write(clampSample ? clampSample(value) : value)
        }
      },
      () => settle('finished'),
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
    this.passive = undefined
  }
  /** @internal Install the useSpring setter interception. */
  attach(setter: (value: number) => void) {
    this.passive = setter
    return (): void => {
      this.passive = undefined
      this.stop()
    }
  }
}
