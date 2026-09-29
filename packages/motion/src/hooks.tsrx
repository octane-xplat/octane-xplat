import { useRef, useLayoutEffect } from 'octane'
import { interpolate } from 'motion-dom'
import { clock } from './clock'
import { MotionValue, type MotionValueEvents } from './value'
import type { Transition } from './types'

/** Create an owned numeric value that writes to bound hosts without rendering. */
export function useMotionValue(initial: number): MotionValue {
	const ref = useRef<MotionValue | null>(null)
	if (!ref.current) ref.current = new MotionValue(initial, clock)
	const value = ref.current
	useLayoutEffect(() => () => value.destroy(), [])
	return value
}

/** Subscribe to a value event; subscriptions follow value/callback replacement. */
export function useMotionValueEvent<K extends keyof MotionValueEvents>(value: MotionValue, event: K, callback: MotionValueEvents[K]): void {
	useLayoutEffect(() => value.on(event, callback), [value, event, callback])
}

/** Derive a numeric value using a range map, unary transform, or multi-input transform. */
export function useTransform(source: MotionValue, input: number[], output: number[], options?: { clamp?: boolean }): MotionValue
export function useTransform(source: MotionValue, transform: (value: number) => number): MotionValue
export function useTransform(source: MotionValue[], transform: (values: number[]) => number): MotionValue
export function useTransform(source: MotionValue | MotionValue[], input: number[] | ((value: any) => number), output?: number[], options?: { clamp?: boolean }): MotionValue {
	const sources = Array.isArray(source) ? source : [source]
	if (Array.isArray(input) && (!output || input.length !== output.length || input.length < 2)) throw new Error('motion: transform ranges must have matching lengths >= 2')
	const transform: (value: any) => number = typeof input === 'function' ? input : interpolate(input, output!, options)
	const read = () => transform(Array.isArray(source) ? sources.map((value) => value.get()) : source.get())
	const value = useMotionValue(read())
	// A source array may be freshly allocated; compare its members, not its identity.
	const previous = useRef<MotionValue[]>(sources)
	if (previous.current.length !== sources.length || previous.current.some((value, i) => value !== sources[i])) previous.current = sources
	useLayoutEffect(() => {
		const update = () => value.set(read())
		const off = sources.map((source) => source.on('change', update))
		update()
		return () => off.forEach((unsubscribe) => unsubscribe())
	}, [previous.current, input, output, options?.clamp])

	return value
}

/** A spring value: set animates; jump snaps. A source value is followed directly. */
export function useSpring(source: number | MotionValue, options: Omit<Transition, 'type' | 'duration' | 'ease' | 'delay'> = {}): MotionValue {
	const value = useMotionValue(source instanceof MotionValue ? source.get() : source)
	useLayoutEffect(() => {
		const follow = (target: number) => { value.animate(target, { ...options, type: 'spring' }) }
		const detach = value.attach(follow)
		const unsubscribe = source instanceof MotionValue ? source.on('change', follow) : undefined
		if (source instanceof MotionValue && source.get() !== value.get()) follow(source.get())
		return () => { unsubscribe?.(); detach() }
	}, [source instanceof MotionValue ? source : null, JSON.stringify(options)])

	return value
}
