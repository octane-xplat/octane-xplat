import { validateTransitionInput } from './engine'
import {
  propertyKeys,
  channelKeys,
  isMotionProperty,
  isMotionChannel,
  parseMotionValue,
  compatibleMotionValues,
  MotionTargetError,
  type MotionData,
  type MotionProperty,
} from './value-codec'
import { createPropertyRun, type PropertyRun } from './property-run'
import { MotionValue } from './value'
import type { Clock } from './clock-types'
import type { HostAdapter, DelegatedRun } from './host-types'
import type { Target, ResolvedTarget, MotionKey, StyleProperty, TransitionInput } from './types'
import { isBezierEase, isOrchestrated, resolveTransition, type AnimationResult } from './engine'

export const keys: readonly MotionProperty[] = propertyKeys
export const defaults: ResolvedTarget = {
  opacity: 1,
  x: 0,
  y: 0,
  scale: 1,
  scaleX: 1,
  scaleY: 1,
  rotate: 0,
}

export function validateTarget(target?: Target): void {
  for (const [key, value] of Object.entries(target ?? {})) {
    if (!isMotionProperty(key)) {
      throw new MotionTargetError('unsupported-property', key, value, 'unsupported target property')
    }
    if (['opacity', 'scale', 'scaleX', 'scaleY'].includes(key) && typeof value !== 'number') {
      throw new MotionTargetError('invalid-value', key, value, 'expected a finite numeric channel')
    }
    parseMotionValue(value, key)
  }
  const names = Object.keys(target ?? {})
  if (
    names.includes('borderRadius') &&
    names.some((key) => key !== 'borderRadius' && key.endsWith('Radius'))
  ) {
    throw new MotionTargetError(
      'conflicting-owner',
      'borderRadius',
      target,
      'radius shorthand and longhands cannot share a target',
    )
  }
}

export class Controller {
  readonly values: Map<MotionKey, MotionValue> = new Map<MotionKey, MotionValue>()
  /** Per-write snapshot callback (rAF-rate during delegated and JS runs). */
  onUpdate?: (snapshot: ResolvedTarget) => void
  onError?: (error: MotionTargetError) => void
  private styleValues = new Map<StyleProperty, MotionValue<MotionData>>()
  private authored = new Map<MotionProperty, MotionData>()
  private referenceOff?: () => void
  private referenceKey = ''
  private relativeRuns = new Map<MotionProperty, PropertyRun>()
  private adapter?: HostAdapter
  private delegated?: { run: DelegatedRun; frame: number; trackSample: () => void }
  private generation = 0
  private disposed = false
  private pendingSeeds = new Map<MotionProperty, MotionData>()
  private waiting?: { id: number; finish(result: AnimationResult | 'ready'): void }
  private cancelWaiting(reason: AnimationResult): void {
    const waiting = this.waiting
    this.waiting = undefined
    if (waiting) {
      this.clock.cancel(waiting.id)
      waiting.finish(reason)
    }
  }
  private waitForMeasurement(): Promise<AnimationResult | 'ready'> {
    this.cancelWaiting('replaced')
    return new Promise((done) => {
      const id = this.clock.request(() => {
        this.waiting = undefined
        done('ready')
      })
      this.waiting = { id, finish: done }
    })
  }
  private applyPendingSeeds(): void {
    // Snapshot pending seeds: layout callbacks can change this collection.
    // eslint-disable-next-line unicorn/no-useless-spread
    for (const [key, value] of [...this.pendingSeeds]) {
      try {
        this.set(key, value)
      } catch (error) {
        if (!(error instanceof MotionTargetError)) {
          throw error
        }
        this.pendingSeeds.delete(key)
        this.authored.delete(key)
        this.reportError(error)
      }
    }
  }
  private reportError(error: MotionTargetError): void {
    if (this.onError) {
      this.onError(error)
    } else {
      console.error(error)
    }
  }
  constructor(private clock: Clock) {}
  value(key: MotionKey): MotionValue {
    let value = this.values.get(key)

    if (!value) {
      value = new MotionValue(defaults[key] ?? 0, this.clock)
      this.values.set(key, value)
      value.on('change', () => this.flush())
    }

    return value
  }
  attach(adapter: HostAdapter): void {
    if (this.disposed) {
      return
    }
    this.referenceOff?.()
    this.adapter = adapter
    this.referenceKey = JSON.stringify(adapter.styles?.references())
    this.referenceOff = adapter.styles?.observe?.(() => this.rebaseReferences())
    this.flush()
  }
  private cancelDelegated() {
    if (!this.delegated) {
      return
    }

    this.clock.cancel(this.delegated.frame)
    this.delegated.trackSample()
    this.delegated.run.cancel()
    this.delegated = undefined
  }
  snapshot(): ResolvedTarget {
    return Object.fromEntries(
      [...this.values, ...this.styleValues].map(([key, value]) => [key, value.get()]),
    )
  }
  flush(): void {
    const snapshot = this.snapshot()

    this.adapter?.write(snapshot)
    const styles = Object.fromEntries(
      [...this.styleValues].map(([key, value]) => [key, value.get()]),
    )
    if (this.styleValues.size) {
      this.adapter?.styles?.write(styles)
    }
    this.onUpdate?.(snapshot)
  }
  private resolve(key: MotionProperty, next: MotionData): MotionData {
    if (!isMotionChannel(key)) {
      if (!this.adapter?.styles) {
        throw new MotionTargetError(
          'unsupported-platform',
          key,
          next,
          'expanded targets require a qualified host adapter',
        )
      }
      this.adapter.styles.validate?.(key)
    }
    const parsed = parseMotionValue(next, key, this.adapter?.styles?.references())
    if (isMotionChannel(key)) {
      if (!['', 'px', 'deg'].includes(parsed.units[0])) {
        throw new MotionTargetError(
          'unresolved-reference',
          key,
          next,
          'relative channels need mounted host references',
        )
      }
      return parsed.numbers[0]
    }
    return parsed.serialize(parsed.numbers)
  }
  private styleValue(key: StyleProperty, initial?: MotionData): MotionValue<MotionData> {
    let value = this.styleValues.get(key)
    if (!value) {
      const baseline = initial ?? this.adapter?.styles?.read(key)
      if (baseline === undefined) {
        throw new MotionTargetError(
          'unresolved-reference',
          key,
          baseline,
          'supply an initial value or mount a measurable host',
        )
      }
      value = new MotionValue<MotionData>(this.resolve(key, baseline), this.clock)
      value.bindResolution(this, key, () => this.adapter?.styles?.references())
      value.on('change', () => this.flush())
      this.styleValues.set(key, value)
    }
    return value
  }
  set(key: MotionProperty, next: MotionData | undefined): void {
    if (this.disposed) {
      return
    }
    if (next === undefined) {
      if (!isMotionChannel(key)) {
        this.styleValues.get(key)?.destroy()
        this.styleValues.delete(key)
        this.authored.delete(key)
        this.pendingSeeds.delete(key)
        this.relativeRuns.delete(key)
        this.adapter?.styles?.release(key)
        return
      }
      next = defaults[key] ?? 0
    }
    let resolved: MotionData
    try {
      resolved = this.resolve(key, next)
    } catch (error) {
      if (
        !(error instanceof MotionTargetError) ||
        error.code !== 'unresolved-reference' ||
        this.adapter?.styles?.references().measured !== false
      ) {
        throw error
      }
      this.pendingSeeds.set(key, next)
      this.authored.set(key, next)
      if (key === 'clipPath') {
        this.adapter.styles.write({ clipPath: next })
      }
      return
    }
    this.pendingSeeds.delete(key)
    this.authored.set(key, next)
    if (isMotionChannel(key)) {
      if (typeof resolved !== 'number') {
        throw new MotionTargetError(
          'invalid-value',
          key,
          next,
          'expected a resolved numeric channel',
        )
      }
      this.value(key).jump(resolved)
    } else {
      const existing = this.styleValues.has(key)
      this.styleValue(key, resolved).jump(resolved)
      if (!existing) {
        this.flush()
      }
    }
  }
  private rebaseReferences(): void {
    if (this.disposed) {
      return
    }
    const next = JSON.stringify(this.adapter?.styles?.references())
    if (next === this.referenceKey) {
      return
    }
    this.referenceKey = next
    this.applyPendingSeeds()
    for (const [key, authored] of this.authored) {
      if (typeof authored !== 'string' || !/%|(?:vw|vh|em|rem)\b/.test(authored)) {
        continue
      }
      try {
        const run = this.relativeRuns.get(key)
        if (run) {
          run.retarget()
        } else {
          this.set(key, authored)
        }
      } catch (error) {
        if (!(error instanceof MotionTargetError)) {
          throw error
        }
        this.relativeRuns.delete(key)
        if (isMotionChannel(key)) {
          this.values.get(key)?.stop()
        } else {
          this.styleValues.get(key)?.stop()
        }
        this.authored.delete(key)
        this.reportError(error)
      }
    }
  }
  seed(target: Target): void {
    validateTarget(target)
    for (const [key, value] of Object.entries(target)) {
      this.set(key as MotionProperty, value)
    }
  }
  async animate(
    input: Target,
    transition: TransitionInput,
    reduced: boolean,
    // Gesture hosts keep channel ownership in JS; whole-host delegation cannot
    // cancel one property without also freezing the others.
    channelsOnly = false,
  ): Promise<AnimationResult> {
    if (this.disposed) {
      return 'cancelled'
    }
    validateTransitionInput(transition)
    validateTarget(input)
    if (
      this.adapter?.styles?.references().measured === false &&
      (this.pendingSeeds.size ||
        Object.values(input).some((value) => typeof value === 'string' && value.includes('%')))
    ) {
      const readiness = await this.waitForMeasurement()
      if (readiness !== 'ready') {
        return readiness
      }
      this.applyPendingSeeds()
      if (this.adapter?.styles?.references().measured === false) {
        throw new MotionTargetError(
          'unresolved-reference',
          '',
          input,
          'relative playback needs a measured host',
        )
      }
    }
    const target: ResolvedTarget = {}
    const baselines = new Map<StyleProperty, MotionData>()
    for (const [key, authored] of Object.entries(input)) {
      if (!isMotionProperty(key)) {
        continue
      }
      const resolved = this.resolve(key, authored)
      const timing = resolveTransition(transition, key)
      if (
        typeof authored === 'string' &&
        /%|(?:vw|vh|em|rem)\b/.test(authored) &&
        ((timing.repeat ?? 0) > 0 || timing.type === 'inertia')
      ) {
        throw new MotionTargetError(
          'unsupported-property',
          key,
          authored,
          'relative repeating/inertia targets require a numeric progress driver or resolved absolute values',
        )
      }
      if (isMotionChannel(key)) {
        if (typeof resolved !== 'number') {
          throw new MotionTargetError('invalid-value', key, authored, 'expected a numeric channel')
        }
        target[key] = resolved
      } else {
        target[key] = resolved
        const baseline = this.styleValues.get(key)?.get() ?? this.adapter?.styles?.read(key)
        if (baseline === undefined) {
          throw new MotionTargetError(
            'unresolved-reference',
            key,
            baseline,
            'supply an initial value or mount a measurable host',
          )
        }
        const normalized = this.resolve(key, baseline)
        baselines.set(key, normalized)
        const from = parseMotionValue(normalized, key)
        const to = parseMotionValue(resolved, key)
        const timing = resolveTransition(transition, key)
        if (timing.duration !== 0) {
          compatibleMotionValues(from, to, key)
        }
      }
    }

    this.cancelWaiting('replaced')
    const generation = channelsOnly ? this.generation : ++this.generation

    this.cancelDelegated()
    for (const key of this.relativeRuns.keys()) {
      if (!channelsOnly && !(key in input)) {
        const displayed = this.snapshot()[key]
        if (displayed !== undefined) {
          this.authored.set(key, displayed)
        }
      }
    }
    // Ordinary declarative destinations own the whole run, including removed keys.
    if (!channelsOnly) {
      for (const value of [...this.values.values(), ...this.styleValues.values()]) {
        value.stop('replaced')
      }
      this.relativeRuns.clear()
    }

    for (const [key, authored] of Object.entries(input)) {
      if (isMotionProperty(key)) {
        this.authored.set(key, authored)
        this.relativeRuns.delete(key)
      }
    }
    const dest: ResolvedTarget = { ...this.snapshot(), ...target }
    // Effective axes cannot identify two changing logical factors. A zero
    // retained factor also hides its animated partner entirely.
    const scaleIsRecoverable =
      target.scale !== undefined
        ? target.scaleX === undefined &&
          target.scaleY === undefined &&
          ((dest.scaleX ?? 1) !== 0 || (dest.scaleY ?? 1) !== 0)
        : (target.scaleX === undefined && target.scaleY === undefined) || (dest.scale ?? 1) !== 0

    if (
      !channelsOnly &&
      (this.clock.getRate?.() ?? 1) === 1 &&
      Object.keys(input).every(
        (key) => isMotionChannel(key) && typeof input[key as keyof Target] === 'number',
      ) &&
      this.styleValues.size === 0 &&
      scaleIsRecoverable &&
      !reduced &&
      !isOrchestrated(transition) &&
      (transition.type ?? 'tween') === 'tween' &&
      (transition.duration ?? 0.3) > 0 &&
      (transition.repeat ?? 0) === 0 &&
      isBezierEase(transition.ease) &&
      this.adapter?.delegate
    ) {
      const run = this.adapter.delegate({
        target,
        dest,
        eff: {
          opacity: dest.opacity,
          x: dest.x,
          y: dest.y,
          scaleX: (dest.scale ?? 1) * (dest.scaleX ?? 1),
          scaleY: (dest.scale ?? 1) * (dest.scaleY ?? 1),
          rotate: dest.rotate,
        },
        transition,
      })

      if (run) {
        const trackSample = () => {
          const eff = run.sample()

          for (const key of channelKeys) {
            if (target[key] === undefined) {
              continue
            }

            let next: number | undefined

            if (key === 'scale') {
              next =
                (dest.scaleX ?? 1) !== 0
                  ? (eff.scaleX ?? 1) / (dest.scaleX ?? 1)
                  : (eff.scaleY ?? 1) / (dest.scaleY ?? 1)
            } else if (key === 'scaleX') {
              next = (eff.scaleX ?? 1) / (dest.scale ?? 1)
            } else if (key === 'scaleY') {
              next = (eff.scaleY ?? 1) / (dest.scale ?? 1)
            } else {
              next = eff[key]
            }

            if (next !== undefined && Number.isFinite(next)) {
              this.value(key).track(next)
            }
          }

          this.onUpdate?.(this.snapshot())
        }

        const entry = { run, frame: 0, trackSample }
        const tick = () => {
          if (this.delegated !== entry) {
            return
          }

          trackSample()
          entry.frame = this.clock.request(tick)
        }

        entry.frame = this.clock.request(tick)
        this.delegated = entry

        const result = await run.finished

        // Only this run cleans up its own sampler — an interrupted run must
        // not clobber the replacement's delegated state.
        if (this.delegated === entry) {
          this.clock.cancel(entry.frame)
          this.delegated = undefined
        }

        if (generation !== this.generation) {
          return 'replaced'
        }

        if (result !== 'finished') {
          return 'cancelled'
        }

        for (const key of channelKeys) {
          if (dest[key] !== undefined) {
            this.value(key).jump(dest[key]!)
          }
        }

        return 'finished'
      }
    }

    const jobs = Object.entries(input).map(([key, authored]) => {
      if (!isMotionProperty(key)) {
        return Promise.resolve('cancelled' as const)
      }
      const timing =
        reduced && key !== 'opacity' ? { duration: 0 } : resolveTransition(transition, key)
      const isRelative = typeof authored === 'string' && /%|(?:vw|vh|em|rem)\b/.test(authored)
      const run = isMotionChannel(key)
        ? createPropertyRun(
            this.clock,
            this.value(key),
            () => {
              const value = this.resolve(key, authored)
              if (typeof value !== 'number') {
                throw new MotionTargetError(
                  'invalid-value',
                  key,
                  authored,
                  'expected a numeric channel',
                )
              }
              return value
            },
            timing,
          )
        : createPropertyRun(
            this.clock,
            this.styleValue(key, baselines.get(key)),
            () => this.resolve(key, authored),
            timing,
          )
      if (isRelative) {
        this.relativeRuns.set(key, run)
      }
      void run.finished.then(() => {
        if (this.relativeRuns.get(key) === run) {
          this.relativeRuns.delete(key)
        }
      })
      return run.finished
    })

    const results = await Promise.all(jobs)

    if (generation !== this.generation) {
      return 'replaced'
    }

    return results.every((result) => result === 'finished') ? 'finished' : 'cancelled'
  }
  stop(): void {
    this.cancelWaiting('cancelled')
    for (const key of this.relativeRuns.keys()) {
      const displayed = this.snapshot()[key]
      if (displayed !== undefined) {
        this.authored.set(key, displayed)
      }
    }
    ++this.generation
    this.cancelDelegated()
    for (const value of [...this.values.values(), ...this.styleValues.values()]) {
      value.stop()
    }
    this.relativeRuns.clear()
  }
  destroy(): void {
    this.disposed = true
    this.stop()
    for (const value of this.values.values()) {
      value.destroy()
    }

    for (const value of this.styleValues.values()) {
      value.destroy()
    }
    this.styleValues.clear()
    this.referenceOff?.()
    this.pendingSeeds.clear()
    this.adapter?.styles?.release()
    this.values.clear()
    this.adapter = undefined
  }
}
