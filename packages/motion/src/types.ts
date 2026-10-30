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
	/** Seconds between child entrances. */
	staggerChildren?: number
	/** Seconds before the first child entrance. */
	delayChildren?: number
	/** Orchestration timing (beforeChildren/afterChildren). */
	when?: 'beforeChildren' | 'afterChildren'
}

/** Timing is seconds. Spring velocity is units per second. */
export interface Transition extends ChildOrchestration {
	/** Animation kind (spring/tween/inertia). */
	type?: 'tween' | 'spring' | 'inertia'
	/** Tween duration; on springs this is the visual duration (combine with bounce). */
	duration?: number
	/** Seconds before the animation starts. */
	delay?: number
	/** Easing curve for tween animations. */
	ease?: Ease
	/** Additional iterations after the first leg; Infinity loops forever. */
	repeat?: number
	/** Loop direction for repeated runs. */
	repeatType?: RepeatType
	/** Seconds between repeats. */
	repeatDelay?: number
	/** Spring bounciness 0–1; pairs with duration instead of stiffness/damping. */
	bounce?: number
	/** Spring stiffness (higher = faster). */
	stiffness?: number
	/** Spring damping (lower = more oscillation). */
	damping?: number
	/** Spring mass. */
	mass?: number
	/** Initial velocity (units per second). */
	velocity?: number
	/** Speed below which the spring settles. */
	restSpeed?: number
	/** Distance below which the spring settles. */
	restDelta?: number
	/** Inertia only: how far release velocity travels (default 0.8). */
	power?: number
	/** Inertia only: decay time constant in ms (default 700). */
	timeConstant?: number
	/** Inertia only: lower bound; overshoot bounces back. */
	min?: number
	/** Inertia only: upper bound; overshoot bounces back. */
	max?: number
	/** Inertia only: stiffness of the bounce-back spring at a bound. */
	bounceStiffness?: number
	/** Inertia only: damping of the bounce-back spring at a bound. */
	bounceDamping?: number
}

/** Per-channel transition overrides, upstream form: `{x: {…}, default: {…}}`. */
export type TransitionOrchestration = ChildOrchestration & {
	/** Transition applied to properties without their own. */
	default?: Transition
	/** Timing for layout-projection animations driven by `layout`. */
	layout?: Transition
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
	/** Left-edge drag constraint (dips). */
	left?: number
	/** Right-edge constraint. */
	right?: number
	/** Top-edge constraint. */
	top?: number
	/** Bottom-edge constraint. */
	bottom?: number
}

/** Payload for drag callbacks. */
export interface DragInfo {
	/** Current pointer position (dips). */
	point: { x: number; y: number }
	/** Change since the last event. */
	delta: { x: number; y: number }
	/** Displacement from the drag origin. */
	offset: { x: number; y: number }
	/** CSS pixels/DIP per second. */
	velocity: { x: number; y: number }
	/** True when the OS cancelled the gesture. */
	cancelled: boolean
}

/** Callback receiving the host event plus DragInfo. */
export type DragCallback = (event: any, info: DragInfo) => void

/** Supported declarative motion controls. */
export interface MotionProps {
	/** Enable pointer dragging (true/axis/lock options). */
	drag?: boolean | 'x' | 'y'
	/** Numeric translation bounds; measured ref constraints are deferred. */
	dragConstraints?: DragConstraints
	/** Project release velocity into a spring destination (default true). */
	dragMomentum?: boolean
	/** Resistance beyond bounds, 0–1 (default 0.35); false = 0, true = 0.35. */
	dragElastic?: boolean | number
	/** Drag began. */
	onDragStart?: DragCallback
	/** Pointer moved mid-drag. */
	onDrag?: DragCallback
	/** Drag ended (release/cancel). */
	onDragEnd?: DragCallback
	/** Named numeric targets; array labels merge left to right. */
	variants?: Variants
	/** Passed to this host's variant resolvers; not inherited. */
	custom?: any
	/** Mount style/values; false disables enter animation. */
	initial?: AnimationDefinition | false
	/** Destination while the nearest Presence boundary retains this host for exit. */
	exit?: AnimationDefinition
	/** Target values to animate toward. */
	animate?: AnimationDefinition
	/** Timing/spring config for the animation. */
	transition?: TransitionInput
	/** Base style (may hold animated values). */
	style?: MotionStyle
	/** Target while the pointer is down (web: pointerdown; native: touch down). */
	whileTap?: AnimationDefinition
	/** Transition used during the pressed state. */
	whileTapTransition?: Transition
	/** Target while the host holds focus. */
	whileFocus?: AnimationDefinition
	/** Transition used during focus. */
	whileFocusTransition?: Transition
	/** Animate layout changes with transforms only; modes restrict the delta. */
	layout?: boolean | 'position' | 'size' | 'preserve-aspect' | 'x' | 'y'
	/** Join a shared-element transition with matching IDs in the same LayoutGroup namespace. Enables layout projection. */
	layoutId?: string
	/** Snap this container to its new layout; children animate relative to it. Enables projection. */
	layoutRoot?: boolean
	/** Relative attachment point in the parent (0 = start, 1 = end); false disables relative attachment. */
	layoutAnchor?: { x: number; y: number } | false
	/** Crossfade overlapping shared-element members. Set false to hide the outgoing member immediately. @default true */
	layoutCrossfade?: boolean
	/** When defined, layout animations only run on commits where this changed. */
	layoutDependency?: unknown
	/** Layout animation began. */
	onLayoutAnimationStart?: () => void
	/** Layout animation finished. */
	onLayoutAnimationComplete?: () => void
	/** A value animation began. */
	onAnimationStart?: (definition: AnimationDefinition) => void
	/** A value animation settled. */
	onAnimationComplete?: () => void
	/** Per-frame snapshot while any channel animates. */
	onUpdate?: (latest: Target) => void
}

/** View layout and accessibility props with motion controls. */
export type MotionViewProps = Omit<ViewProps, 'style'> & MotionProps
/** Row layout and accessibility props with motion controls. */
export type MotionRowProps = Omit<HStackProps, 'style'> & MotionProps
/** Pressable interaction props with motion controls. */
export type MotionPressableProps = Omit<PressableProps, 'style'> & MotionProps
/** Inherited defaults; `user` observes the live system preference. */
export interface MotionConfigProps {
	/** Timing/spring config for the animation. */
	transition?: TransitionInput
	/** Reduced-motion handling (follows the OS preference live). */
	reducedMotion?: 'always' | 'never' | 'user'
	/** Content the provider wraps; `unknown` accepts any renderable. */
	children?: any
}

/**
 * Namespace shared layout IDs. Layout changes are observed across every registered host.
 * @example
 * ```tsx
 * import { LayoutGroup, motion } from '@octane-xplat/motion'
 * <LayoutGroup id="tabs"><motion.View layoutId="underline" /></LayoutGroup>
 * ```
 */
export interface LayoutGroupProps {
	/** Namespace segment; nested IDs compose without separator collisions. Omit to inherit the parent namespace. */
	id?: string
	/** Inherit the parent ID namespace. `true` and `'id'` are equivalent because all layout hosts observe commits. @default true */
	inherit?: boolean | 'id'
	/** Content the provider wraps; `unknown` accepts any renderable. */
	children?: any
}

/** Presence renders a View wrapper; use its layout props to size retained content. */
export interface PresenceProps extends ViewProps {
	/** Whether the child is currently presented (exit runs on false). */
	present: boolean
	/** Called once after all registered exits finish, never after reversal/disposal. */
	onExitComplete?: () => void
}
