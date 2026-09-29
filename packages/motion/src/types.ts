import type { ViewProps, RowProps, PressableProps } from '@octane-xplat/ui'
import type { MotionValue } from './value'

/** Supported channels. Translation is CSS pixels/DIP; rotation is degrees. */
export type MotionKey = 'opacity' | 'x' | 'y' | 'scale' | 'scaleX' | 'scaleY' | 'rotate'
/** Absolute numeric destinations; omitted channels retain their current values. */
export type Target = Partial<Record<MotionKey, number>>
/** Tween easing, including a CSS-compatible cubic Bezier tuple. */
export type Ease = 'linear' | 'easeIn' | 'easeOut' | 'easeInOut' | [number, number, number, number]
/** Timing is seconds. Spring velocity is units per second. */
export interface Transition {
	type?: 'tween' | 'spring'
	duration?: number
	delay?: number
	ease?: Ease
	stiffness?: number
	damping?: number
	mass?: number
	velocity?: number
	restSpeed?: number
	restDelta?: number
}

/** Static platform styles plus numeric motion-value bindings. */
export type MotionStyle = Record<string, unknown> & Partial<Record<MotionKey, number | MotionValue>>
/** Supported declarative motion controls. */
export interface MotionProps {
	initial?: Target | false
	/** Destination while the nearest Presence boundary retains this host for exit. */
	exit?: Target
	animate?: Target
	transition?: Transition
	style?: MotionStyle
	onAnimationComplete?: () => void
}

/** View layout and accessibility props with motion controls. */
export type MotionViewProps = Omit<ViewProps, 'style'> & MotionProps
/** Row layout and accessibility props with motion controls. */
export type MotionRowProps = Omit<RowProps, 'style'> & MotionProps
/** Pressable interaction props with motion controls. */
export type MotionPressableProps = Omit<PressableProps, 'style'> & MotionProps
/** Inherited defaults; `user` observes the live system preference. */
export interface MotionConfigProps {
	transition?: Transition
	reducedMotion?: 'always' | 'never' | 'user'
	children?: any
}

/** Presence renders a View wrapper; use its layout props to size retained content. */
export interface PresenceProps extends ViewProps {
	present: boolean
	/** Called once after all registered exits finish, never after reversal/disposal. */
	onExitComplete?: () => void
}
