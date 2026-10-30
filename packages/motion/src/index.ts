import { MotionView, MotionRow, MotionPressable, createMotion } from './components.tsrx'
/** Bounded motion hosts for shared xplat UI primitives; `motion.create` wraps
 *  any component that accepts `ref`/`style`/`children`. */
export const motion: {
	View: any
	Row: any
	Pressable: any
	create: any
} = {
	View: MotionView,
	Row: MotionRow,
	Pressable: MotionPressable,
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
