import type { UniversalComponent } from 'octane/universal'
import type {
	MotionProps,
	MotionViewProps,
	MotionRowProps,
	MotionPressableProps,
	MotionConfigProps,
	Target,
	Transition,
	TransitionInput,
} from './types.js'

import type { MotionValue, MotionValueEvents } from './value.js'
import type { AnimationControls, AnimationResult } from './engine.js'
/** Bounded motion hosts for shared xplat UI primitives; `motion.create` wraps
 *  any component that accepts `bind`/`style`/`children`. */
export declare const motion: {
	View: UniversalComponent<MotionViewProps>
	Row: UniversalComponent<MotionRowProps>
	Pressable: UniversalComponent<MotionPressableProps>
	create: <P extends Record<string, unknown>>(
		component: (props: P) => any,
	) => UniversalComponent<P & MotionProps>
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

/** Scoped imperative animation: `const [scope, animate] = useAnimate()` then
 *  `bind={scope}` on a motion host. */
export declare function useAnimate(): [
	{ current: any },
	(
		target: Target | MotionValue | object,
		transitionOrTo?: TransitionInput | number,
		transition?: Transition,
	) => Promise<AnimationResult> | AnimationControls,
]

export type { MotionValue, MotionValueEvents }
export type { AnimationControls, AnimationResult } from './engine.js'
/** Includes bounded drag props and DragInfo callback payloads on both targets. */
export type * from './types.js'

/** Retain live children through exit; removing the boundary disposes immediately. */
export declare const Presence: UniversalComponent<import('./types.js').PresenceProps>
