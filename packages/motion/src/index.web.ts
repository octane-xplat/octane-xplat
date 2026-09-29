import { MotionView, MotionRow, MotionPressable } from './components.tsrx'
/** Bounded motion hosts for shared xplat UI primitives. */
export const motion = { View: MotionView, Row: MotionRow, Pressable: MotionPressable }
export { MotionConfig, useReducedMotion } from './config.tsrx'
export { useMotionValue, useTransform, useSpring, useMotionValueEvent } from './hooks.tsrx'
export type { MotionValue, MotionValueEvents } from './value'
export type { AnimationControls, AnimationResult } from './engine'
export type * from './types'
export { Presence } from './presence.tsrx'
