import type { View, HStack, Pressable } from '@octane-xplat/ui'
import type { MotionValue } from './value.js'

type ViewProps = Parameters<typeof View>[0]
type HStackProps = Parameters<typeof HStack>[0]
type PressableProps = Parameters<typeof Pressable>[0]

/** Supported channels. Translation is CSS pixels/DIP; rotation is degrees. */
export type MotionKey = 'opacity' | 'x' | 'y' | 'scale' | 'scaleX' | 'scaleY' | 'rotate'
/** Absolute numeric destinations; omitted channels retain their current values. */
export type Target = Partial<Record<MotionKey, number>>
/** Tween easing, including a CSS-compatible cubic Bezier tuple. */
export type Ease =
	| 'linear'
	| 'easeIn'
	| 'easeOut'
	| 'easeInOut'
	| 'circIn'
	| 'circOut'
	| 'circInOut'
	| 'backIn'
	| 'backOut'
	| 'backInOut'
	| 'anticipate'
	| [number, number, number, number]

/** How repeated legs play: restart, alternate direction, or alternate
 *  direction with inverted easing (identical to reverse for two keyframes). */
export type RepeatType = 'loop' | 'reverse' | 'mirror'
/** Numeric tree timing in seconds, applied to inherited animate labels. */
export interface ChildOrchestration {
	staggerChildren?: number
	delayChildren?: number
	when?: 'beforeChildren' | 'afterChildren'
}

/** Timing is seconds. Spring velocity is units per second. */
export interface Transition extends ChildOrchestration {
	type?: 'tween' | 'spring'
	/** Tween duration; on springs this is the visual duration (combine with bounce). */
	duration?: number
	delay?: number
	ease?: Ease
	/** Additional iterations after the first leg; Infinity loops forever. */
	repeat?: number
	repeatType?: RepeatType
	repeatDelay?: number
	/** Spring bounciness 0–1; pairs with duration instead of stiffness/damping. */
	bounce?: number
	stiffness?: number
	damping?: number
	mass?: number
	velocity?: number
	restSpeed?: number
	restDelta?: number
}

/** Per-channel transition overrides, upstream form: `{x: {…}, default: {…}}`. */
export type TransitionOrchestration = ChildOrchestration & {
	default?: Transition
} & Partial<Record<MotionKey, Transition>>

/** A flat transition or per-channel overrides. */
export type TransitionInput = Transition | TransitionOrchestration

/** Labels resolve against this host's variants, in array order. */
export type VariantLabels = string | string[]
/** An inline numeric target or labels resolved by the host. */
export type AnimationDefinition = Target | VariantLabels
/** A numeric variant destination with an optional run transition override. */
export type VariantTarget = Target & { transition?: TransitionInput }
/** Host-local definitions; pure resolvers receive this host's custom value. */
export type Variants = Record<string, VariantTarget | ((custom: any) => VariantTarget)>

/** Static platform styles plus numeric motion-value bindings. */
export type MotionStyle = Record<string, unknown> & Partial<Record<MotionKey, number | MotionValue>>
/** Translation limits in CSS pixels/DIP. Omitted edges are unbounded. */
export interface DragConstraints {
	left?: number
	right?: number
	top?: number
	bottom?: number
}

export interface DragInfo {
	point: { x: number; y: number }
	delta: { x: number; y: number }
	offset: { x: number; y: number }
	/** CSS pixels/DIP per second. */
	velocity: { x: number; y: number }
	cancelled: boolean
}

export type DragCallback = (event: any, info: DragInfo) => void

/** Supported declarative motion controls. */
export interface MotionProps {
	drag?: boolean | 'x' | 'y'
	/** Numeric translation bounds; measured ref constraints are deferred. */
	dragConstraints?: DragConstraints
	/** Project release velocity into a spring destination (default true). */
	dragMomentum?: boolean
	/** Resistance beyond bounds, 0–1 (default 0.35); false = 0, true = 0.35. */
	dragElastic?: boolean | number
	onDragStart?: DragCallback
	onDrag?: DragCallback
	onDragEnd?: DragCallback
	/** Named numeric targets; array labels merge left to right. */
	variants?: Variants
	/** Passed to this host's variant resolvers; not inherited. */
	custom?: any
	initial?: AnimationDefinition | false
	/** Destination while the nearest Presence boundary retains this host for exit. */
	exit?: AnimationDefinition
	animate?: AnimationDefinition
	transition?: TransitionInput
	style?: MotionStyle
	/** Target while the pointer is down (web: pointerdown; native: touch down). */
	whileTap?: AnimationDefinition
	whileTapTransition?: Transition
	/** Target while the host holds focus. */
	whileFocus?: AnimationDefinition
	whileFocusTransition?: Transition
	onAnimationStart?: (definition: AnimationDefinition) => void
	onAnimationComplete?: () => void
	/** Per-frame snapshot while any channel animates. */
	onUpdate?: (latest: Target) => void
	/** Host node reference: callback or ref object (`useAnimate` scope). */
	bind?: ((host: any) => void) | { current: any }
}

/** View layout and accessibility props with motion controls. */
export type MotionViewProps = Omit<ViewProps, 'style' | 'bind'> & MotionProps
/** Row layout and accessibility props with motion controls. */
export type MotionRowProps = Omit<HStackProps, 'style' | 'bind'> & MotionProps
/** Pressable interaction props with motion controls. */
export type MotionPressableProps = Omit<PressableProps, 'style' | 'bind'> & MotionProps
/** Inherited defaults; `user` observes the live system preference. */
export interface MotionConfigProps {
	transition?: TransitionInput
	reducedMotion?: 'always' | 'never' | 'user'
	children?: any
}

/** Presence renders a View wrapper; use its layout props to size retained content. */
export interface PresenceProps extends ViewProps {
	present: boolean
	/** Called once after all registered exits finish, never after reversal/disposal. */
	onExitComplete?: () => void
}
