import { parseMotionValue, compatibleMotionValues } from './value-codec'
import type { MotionData } from './value-codec'
import { useRef, useLayoutEffect, useContext } from 'octane'
import { interpolate, mix } from 'motion-dom'
import { clock } from './clock'
import { ConfigContext, useReducedMotion } from './config.tsrx'
import { controllers } from './components.tsrx'
import { MotionValue, type MotionValueEvents } from './value'
import type { AnimationControls, AnimationResult } from './engine'
import type { Target, Transition, TransitionInput } from './types'

/** Create an owned number or validated string value that writes without rerendering. */
export function useMotionValue(initial: number): MotionValue<number>
export function useMotionValue(initial: string): MotionValue<string>
export function useMotionValue<T extends MotionData>(initial: T): MotionValue<T>
export function useMotionValue<T extends MotionData>(initial: T): MotionValue<T> {
  const ref = useRef<MotionValue<T> | null>(null)

  if (!ref.current) {
    ref.current = new MotionValue<T>(initial, clock)
  }

  const value = ref.current

  useLayoutEffect(() => () => value.destroy(), [])
  return value
}

/** Subscribe to a value event; subscriptions follow value/callback replacement. */
export function useMotionValueEvent<T extends MotionData, K extends keyof MotionValueEvents<T>>(
  value: MotionValue<T>,
  event: K,
  callback: MotionValueEvents<T>[K],
): void {
  useLayoutEffect(() => value.on(event, callback), [value, event, callback])
}

/** Derive a typed number/string value without rerendering the host. */
export function useTransform(
  source: MotionValue<number>,
  input: number[],
  output: number[],
  options?: { clamp?: boolean },
): MotionValue<number>

export function useTransform(
  source: MotionValue<number>,
  input: number[],
  output: string[],
  options?: { clamp?: boolean },
): MotionValue<string>

export function useTransform<R extends MotionData>(
  source: MotionValue<number>,
  input: number[],
  output: R[],
  options?: { clamp?: boolean },
): MotionValue<R>

/** Derive a value from a unary mapper. */
export function useTransform<T extends MotionData, R extends MotionData>(
  source: MotionValue<T>,
  transform: (value: T) => R,
): MotionValue<R>

/** Derive a value from multiple sources; geometry revisions can be explicit dependencies. */
export function useTransform<T extends MotionData, R extends MotionData>(
  source: MotionValue<T>[],
  transform: (values: T[]) => R,
): MotionValue<R>

export function useTransform<T extends MotionData, R extends MotionData>(
  source: MotionValue<T> | MotionValue<T>[],
  input: number[] | ((value: T) => R) | ((values: T[]) => R),
  output?: R[],
  options?: { clamp?: boolean },
): MotionValue<R> {
  const sources = Array.isArray(source) ? source : [source]

  if (Array.isArray(input) && (!output || input.length !== output.length || input.length < 2)) {
    throw new Error('motion: transform ranges must have matching lengths >= 2')
  }

  // The overload ties array/unary input to its callback. TS cannot retain that
  // relationship after combining the overload implementations.
  const mapper = typeof input === 'function' ? (input as (value: T | T[]) => R) : undefined
  const range = Array.isArray(input)
    ? interpolate(input, output!, {
        ...options,
        mixer(from, to) {
          const a = parseMotionValue(from),
            b = parseMotionValue(to)

          compatibleMotionValues(a, b)

          const blend = mix(a.numbers, b.numbers)

          // Public range overloads widen their numeric/string output category. The
          // serializer preserves that category; TypeScript cannot express the codec relation.
          return (progress) => b.serialize(blend(progress)) as R
        },
      })
    : undefined

  const read = (): R => {
    if (mapper) {
      return mapper(Array.isArray(source) ? sources.map((value) => value.get()) : source.get())
    }

    const value = sources[0].get()

    if (typeof value !== 'number') {
      throw new Error('motion: range transforms require a numeric source')
    }

    return range!(value)
  }

  const value = useMotionValue<R>(read())

  value.markDerived()

  const previous = useRef<MotionValue<T>[]>(sources)

  if (
    previous.current.length !== sources.length ||
    previous.current.some((value, i) => value !== sources[i])
  ) {
    previous.current = sources
  }

  useLayoutEffect(() => {
    const update = () => value.updateDerived(read())
    const off = sources.map((source) => source.on('change', update))

    update()
    return () => off.forEach((unsubscribe) => unsubscribe())
  }, [previous.current, input, output, options?.clamp])

  return value
}

/** A spring value: set animates; jump snaps. A source value is followed directly. */
export function useSpring(
  source: number | MotionValue,
  options: Omit<Transition, 'type' | 'duration' | 'ease' | 'delay'> = {},
): MotionValue {
  const value = useMotionValue(source instanceof MotionValue ? source.get() : source)

  useLayoutEffect(() => {
    const follow = (target: number) => {
      value.animate(target, { ...options, type: 'spring' })
    }

    const detach = value.attach(follow)
    const unsubscribe = source instanceof MotionValue ? source.on('change', follow) : undefined

    if (source instanceof MotionValue && source.get() !== value.get()) {
      follow(source.get())
    }

    return () => {
      unsubscribe?.()
      detach()
    }
  }, [source instanceof MotionValue ? source : null, JSON.stringify(options)])

  return value
}

/** Scoped imperative animation: `const [scope, animate] = useAnimate()` then
 *  `ref={scope}` on a motion host. `animate(target, transition)` drives that
 *  host; `animate(value, to, transition)` drives a MotionValue directly. */
/** Retained host ref for scoped imperative playback. */
export type AnimateScope = { current: any }
/** Scoped target playback or direct MotionValue playback. */
export type ScopedAnimate = {
  (target: Target, transition?: TransitionInput): Promise<AnimationResult>
  <T extends MotionData>(value: MotionValue<T>, to: T, transition?: Transition): AnimationControls
  (host: object, target: Target, transition?: TransitionInput): Promise<AnimationResult>
}

/** Host ref and its scoped animate function. */
export type UseAnimateResult = [AnimateScope, ScopedAnimate]

export function useAnimate(): UseAnimateResult {
  const scope = useRef<any>(null)
  const config = useContext(ConfigContext)
  const systemReduced = useReducedMotion()
  const reducedRef = useRef(
    config.reducedMotion === 'always' || (config.reducedMotion === 'user' && systemReduced),
  )

  reducedRef.current =
    config.reducedMotion === 'always' || (config.reducedMotion === 'user' && systemReduced)

  function play(target: Target, transition?: TransitionInput): Promise<AnimationResult>
  function play<T extends MotionData>(
    value: MotionValue<T>,
    to: T,
    transition?: Transition,
  ): AnimationControls

  function play(
    host: object,
    target: Target,
    transition?: TransitionInput,
  ): Promise<AnimationResult>

  function play(
    target: any,
    transitionOrTo?: any,
    transition?: any,
  ): Promise<AnimationResult> | AnimationControls {
    if (target instanceof MotionValue) {
      return target.animate(transitionOrTo, transition)
    }

    // A registered host node targets that element's controller; a plain
    // channel target drives the scope's host.
    const controller =
      target && typeof target === 'object' && controllers.has(target)
        ? controllers.get(target)!
        : scope.current
          ? controllers.get(scope.current)
          : undefined

    if (!controller) {
      return Promise.resolve('cancelled' as const)
    }

    const destination = controllers.has(target) ? (transitionOrTo ?? {}) : target
    const spec = controllers.has(target) ? (transition ?? {}) : (transitionOrTo ?? {})

    return controller.animate(destination, spec, reducedRef.current)
  }

  const animate = useRef<ScopedAnimate>(play).current

  return [scope, animate]
}
