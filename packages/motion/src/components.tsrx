import { useRef, useLayoutEffect, useContext } from 'octane'
import { View, HStack, Pressable } from '@octane-xplat/ui'
import { ConfigContext, useReducedMotion } from './config.tsrx'
import { PresenceContext } from './presence.tsrx'
import type { PresenceMember } from './presence-state'
import { attachDrag, validateDrag } from './drag'
import { clock } from './clock'
import { attachHost } from './host'
import type { GestureKind, HostAdapter } from './host-types'
import { Controller, keys, defaults, validateTarget } from './controller'
import { validateTransitionInput } from './engine'
import { MotionValue } from './value'
import type { MotionKey, MotionProps, MotionViewProps, MotionRowProps, MotionPressableProps, Target } from './types'

/** host node → its motion controller; powers `useAnimate` scope lookup. */
export const controllers = new WeakMap<object, Controller>()

const GESTURE_PROPS: Record<GestureKind, { target: 'whileTap' | 'whileFocus'; transition: 'whileTapTransition' | 'whileFocusTransition' }> = {
	press: { target: 'whileTap', transition: 'whileTapTransition' },
	focus: { target: 'whileFocus', transition: 'whileFocusTransition' },
}

function useMotion(props: MotionProps & { bind?: ((host: any) => void) | { current: any } }) {
	for (const name of ['layout', 'layoutId', 'variants', 'whileHover', 'whileInView']) {
		if (name in props) throw new Error(`motion: ${name} is outside the supported subset`)
	}

	validateDrag(props)
	const presence = useContext(PresenceContext)
	if (props.exit && !presence) throw new Error('motion: exit requires a mounted Presence boundary')
	const config = useContext(ConfigContext)
	const systemReduced = useReducedMotion()
	const reduced = config.reducedMotion === 'always' || (config.reducedMotion === 'user' && systemReduced)
	const transition = props.transition ?? config.transition ?? {}
	validateTransitionInput(transition)
	validateTarget(props.animate)
	validateTarget(props.exit)
	validateTarget(props.whileTap)
	validateTarget(props.whileFocus)
	if (props.initial !== false) validateTarget(props.initial)
	if (props.whileTapTransition) validateTransitionInput(props.whileTapTransition)
	if (props.whileFocusTransition) validateTransitionInput(props.whileFocusTransition)
	const latest = useRef(props)
	latest.current = props
	const state = useRef<{
		controller: Controller
		host?: any
		adapter?: HostAdapter
		initialized: boolean
		gestureOff?: () => void
		dragOff?: () => void
		preGesture?: Record<GestureKind, Target | undefined>
	} | null>(null)
	if (!state.current) state.current = { controller: new Controller(clock), initialized: false, preGesture: { press: undefined, focus: undefined } }
	const current = state.current
	const style: Record<string, unknown> = {}
	const bindings: [MotionKey, number | MotionValue][] = []
	for (const [key, value] of Object.entries(props.style ?? {})) {
		if (keys.includes(key as MotionKey)) {
			if (!(value instanceof MotionValue) && (typeof value !== 'number' || !Number.isFinite(value))) throw new Error(`motion: invalid style ${key}`)
			if (value instanceof MotionValue && (props.animate?.[key as MotionKey] !== undefined || props.exit?.[key as MotionKey] !== undefined || (props.initial && props.initial[key as MotionKey] !== undefined))) throw new Error(`motion: ${key} has both an animate target and a MotionValue writer`)
			bindings.push([key as MotionKey, value as number | MotionValue])
		} else {
			if (value instanceof MotionValue || ['transform', 'translateX', 'translateY', 'animation', 'transition'].includes(key)) throw new Error(`motion: unsupported or conflicting style ${key}`)
			style[key] = value
		}
	}

	const previous = useRef(bindings)
	const boundKeys = useRef<MotionKey[]>([])
	const firstBinding = useRef(true)
	const firstAnimation = useRef(true)
	if (previous.current.length !== bindings.length || previous.current.some(([key, value], i) => key !== bindings[i][0] || value !== bindings[i][1])) previous.current = bindings
	current.controller.onUpdate = (snapshot) => latest.current.onUpdate?.(snapshot)

	const gesture = (kind: GestureKind, phase: 'start' | 'end') => {
		const shape = GESTURE_PROPS[kind]
		const target = latest.current[shape.target]
		if (!target) return
		const gestureTransition = latest.current[shape.transition] ?? playback.current.transition
		if (phase === 'start') {
			// Snapshot the gesture's keys so release returns to where they were.
			const snapshot = current.controller.snapshot()
			const rest: Target = {}
			for (const key of Object.keys(target) as MotionKey[]) rest[key] = snapshot[key]
			current.preGesture![kind] = rest
			void current.controller.animate(target, gestureTransition, playback.current.reduced)
		} else {
			const snap = current.preGesture![kind] ?? {}
			current.preGesture![kind] = undefined
			// The declarative animate prop wins over the pre-gesture snapshot.
			const rest: Target = {}
			for (const key of Object.keys(target) as MotionKey[]) rest[key] = latest.current.animate?.[key] ?? snap[key] ?? defaults[key]
			void current.controller.animate(rest, gestureTransition, playback.current.reduced)
		}
	}

	const bind = useRef<(host: any) => void>(() => {})
	bind.current = (host) => {
		if (!host) return
		if (current.host !== host) {
			current.gestureOff?.()
			current.dragOff?.()
			current.gestureOff = undefined
			current.adapter?.restore()
			current.host = host
			current.adapter = attachHost(host)
			if (!current.initialized) {
				const baseline = current.adapter.read()
				for (const [key, value] of previous.current) baseline[key] = value instanceof MotionValue ? value.get() : value
				current.controller.seed(baseline)
				current.controller.seed(props.initial === false ? props.animate ?? {} : props.initial ?? {})
				current.initialized = true
			}

			current.controller.attach(current.adapter)
			controllers.set(host, current.controller)
			configureDrag()
			if (current.adapter.gesture) {
				const offs = (['press', 'focus'] as const)
					.map((kind) => current.adapter!.gesture!(kind, { start: () => gesture(kind, 'start'), end: () => gesture(kind, 'end') }))
					.filter((off): off is () => void => typeof off === 'function')
				current.gestureOff = () => offs.forEach((off) => off())
			}
		}

		current.controller.flush()
		const userBind = latest.current.bind
		if (typeof userBind === 'function') {
			userBind(host)
		} else if (userBind) {
			;(userBind as { current: any }).current = host
		}
	}

	const playback = useRef({ transition, reduced })
	playback.current = { transition, reduced }
	const returning = useRef<Target | null>(null)
	const member = useRef<PresenceMember | null>(null)
	if (!member.current) member.current = {
		exit() {
			const snapshot = current.controller.snapshot()
			returning.current ??= {}
			for (const key of Object.keys(latest.current.exit ?? {}) as MotionKey[]) {
				if (!(key in returning.current)) returning.current[key] = snapshot[key]
			}

			return current.controller.animate(latest.current.exit ?? {}, playback.current.transition, playback.current.reduced)
		},
		enter() {
			const target = { ...returning.current, ...latest.current.animate }
			returning.current = null
			void current.controller.animate(target, playback.current.transition, playback.current.reduced).then((result) => {
				if (result === 'finished' && current.host && presence?.present) latest.current.onAnimationComplete?.()
			})
		},
	}

	useLayoutEffect(() => presence?.register(member.current!), [presence])
	const stableBind = useRef((host: any) => bind.current(host)).current
	useLayoutEffect(() => () => { current.dragOff?.(); current.gestureOff?.(); current.controller.destroy(); current.host = undefined; current.adapter = undefined }, [])
	useLayoutEffect(() => {
		const off: (() => void)[] = []
		for (const key of boundKeys.current) if (!previous.current.some(([next]) => key === next)) current.controller.set(key, defaults[key])
		boundKeys.current = previous.current.map(([key]) => key)
		for (const [key, value] of previous.current) {
			if (!firstBinding.current) current.controller.set(key, value instanceof MotionValue ? value.get() : value)
			if (value instanceof MotionValue) off.push(value.on('change', (next) => current.controller.set(key, next)))
		}

		firstBinding.current = false
		return () => off.forEach((unsubscribe) => unsubscribe())
	}, [previous.current])

	const configureDrag = () => {
		current.dragOff?.()
		current.dragOff = undefined
		if (!current.adapter) return
		current.dragOff = attachDrag(current.adapter, current.controller, latest.current, (axis) => {
			const binding = previous.current.find(([key]) => key === axis)?.[1]
			return binding instanceof MotionValue ? binding : current.controller.value(axis)
		}, () => playback.current.reduced, () => latest.current)
	}

	useLayoutEffect(() => {
		configureDrag()
	}, [props.drag, JSON.stringify(props.dragConstraints), props.dragElastic, props.dragMomentum, previous.current])

	useLayoutEffect(() => {
		let active = true
		const skip = firstAnimation.current && props.initial === false
		firstAnimation.current = false
		if (presence && !presence.present) presence.restart(member.current!)
		else if (props.animate && !skip) {
			latest.current.onAnimationStart?.(props.animate)
			void current.controller.animate(props.animate, transition, reduced).then((result) => {
				if (active && result === 'finished') latest.current.onAnimationComplete?.()
			})
		}

		return () => { active = false; current.controller.stop() }
	}, [JSON.stringify(props.animate), JSON.stringify(props.exit), JSON.stringify(transition), reduced])

	const { drag, dragConstraints, dragElastic, dragMomentum, onDragStart, onDrag, onDragEnd, initial, exit, animate, transition: ignoredTransition, whileTap, whileTapTransition, whileFocus, whileFocusTransition, onAnimationStart, onAnimationComplete, onUpdate, style: ignoredStyle, bind: ignoredBind, ...rest } = props
	return { ...rest, style, bind: stableBind }
}

function MotionLeaf(props: MotionProps & { component?: any }) @{
	const Component = props.component
	<Component {...useMotion(props)}>{props.children}</Component>
}

/** Wrap any component that accepts `bind`/`style`/`children` — the portable
 *  equivalent of upstream's `motion.<tag>` host factory. Compiled components
 *  take (props, slotState, extra) — the factory forwards them into MotionLeaf,
 *  whose dynamic <Component> tag renders the wrapped leaf. */
export function createMotion<P extends Record<string, unknown>>(Component: (props: P) => any) {
	return function MotionCreated(props: P & MotionProps, __s?: any, __extra?: any) {
		return (MotionLeaf as any)({ ...props, component: Component }, __s, __extra)
	}
}

/** Animated View preserving the shared primitive's layout and accessibility. */
export function MotionView(props: MotionViewProps) @{
	<View {...useMotion(props)}>{props.children}</View>
}

/** Animated horizontal stack. */
export function MotionRow(props: MotionRowProps) @{
	<HStack {...useMotion(props)}>{props.children}</HStack>
}

/** Animated Pressable preserving its input callbacks and disabled state. */
export function MotionPressable(props: MotionPressableProps) @{
	<Pressable {...useMotion(props)}>{props.children}</Pressable>
}
