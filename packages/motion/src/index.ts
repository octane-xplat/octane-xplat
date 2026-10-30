import { MotionView, MotionRow, MotionPressable, createMotion } from './components.tsrx'
/** Bounded motion hosts for shared xplat UI primitives; `motion.create` wraps
 *  any component that accepts `ref`/`style`/`children`. */
export const motion: {
	/** Motion-enabled View element. */
	View: typeof MotionView
	/** Motion-enabled Row element. */
	Row: typeof MotionRow
	/** Motion-enabled Pressable element. */
	Pressable: typeof MotionPressable
	/** Wrap a component so its props accept motion values. */
	create: typeof createMotion
} = {
	/** Motion-enabled View element. */
	View: MotionView,
	/** Motion-enabled Row element. */
	Row: MotionRow,
	/** Motion-enabled Pressable element. */
	Pressable: MotionPressable,
	/** Wrap a component so its props accept motion values. */
	create: createMotion,
}

export { MotionConfig, useReducedMotion } from './config.tsrx'
export {
	useMotionValue,
	useTransform,
	useSpring,
	useMotionValueEvent,
	useAnimate,
} from './hooks.tsrx'

export type { MotionValue, MotionValueEvents } from './value'
export type { AnimationControls, AnimationResult } from './engine'
export type * from './types'
export { Presence } from './presence.tsrx'

export type { TextMorphProps, TextMorphRun, TextMorphCancel } from './text-morph/props'

export { LayoutGroup } from './projection/group.tsrx'
