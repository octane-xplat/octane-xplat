import type { UniversalComponent } from 'octane/universal'
import type {
	MotionViewProps,
	MotionRowProps,
	MotionPressableProps,
	MotionConfigProps,
	Transition,
} from './types'

import type { MotionValue, MotionValueEvents } from './value'
/** Bounded motion hosts for shared xplat UI primitives. */
export declare const motion: {
	View: UniversalComponent<MotionViewProps>
	Row: UniversalComponent<MotionRowProps>
	Pressable: UniversalComponent<MotionPressableProps>
}

/** Inherit transition and reduced-motion defaults within this root. */
export declare const MotionConfig: UniversalComponent<MotionConfigProps>
/** Observe the live system reduced-motion preference. */
export declare function useReducedMotion(): boolean
/** Create an owned numeric value; writes do not render components. */
export declare function useMotionValue(initial: number): MotionValue
/** Subscribe to an event until replacement or unmount. */
export declare function useMotionValueEvent<K extends keyof MotionValueEvents>(
	value: MotionValue,
	event: K,
	callback: MotionValueEvents[K],
): void

/** Derive a numeric value by mapping ranges or transforming source samples. */
export declare function useTransform(
	source: MotionValue,
	input: number[],
	output: number[],
	options?: { clamp?: boolean },
): MotionValue

export declare function useTransform(
	source: MotionValue,
	transform: (value: number) => number,
): MotionValue

export declare function useTransform(
	source: MotionValue[],
	transform: (values: number[]) => number,
): MotionValue

/** Spring toward set targets or a source MotionValue; jump snaps. */
export declare function useSpring(
	source: number | MotionValue,
	options?: Omit<Transition, 'type' | 'duration' | 'ease' | 'delay'>,
): MotionValue

export type { MotionValue, MotionValueEvents }
export type { AnimationControls, AnimationResult } from './engine'
export type * from './types'

/** Retain live children through exit; removing the boundary disposes immediately. */
export declare const Presence: UniversalComponent<import('./types').PresenceProps>
