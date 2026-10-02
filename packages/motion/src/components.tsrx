import { createContext, useRef, useLayoutEffect, useContext } from 'octane'
import { View, HStack, Pressable } from '@octane-xplat/ui'
import { ConfigContext, useReducedMotion } from './config.tsrx'
import { PresenceContext } from './presence.tsrx'
import type { PresenceMember } from './presence-state'
import { attachDrag, validateDrag } from './drag'
import { clock } from './clock'
import { attachHost } from './host'
import type { GestureKind, HostAdapter } from './host-types'
import { Controller, keys, defaults } from './controller'
import { validateTransitionInput } from './engine'
import { VariantNode, isLabels, resolveVariant, playbackTransition } from './variants'
import { MotionValue } from './value'
import type { MotionKey, MotionProps, MotionViewProps, MotionRowProps, MotionPressableProps, Target, AnimationDefinition } from './types'

const VariantContext = createContext<VariantNode | null>(null)

/** host node → its motion controller; powers `useAnimate` scope lookup. */
export const controllers = new WeakMap<object, Controller>()

const GESTURE_PROPS: Record<GestureKind, { target: 'whileTap' | 'whileFocus'; transition: 'whileTapTransition' | 'whileFocusTransition' }> = {
	press: { target: 'whileTap', transition: 'whileTapTransition' },
	focus: { target: 'whileFocus', transition: 'whileFocusTransition' },
}

function useMotion(props: MotionProps & Pick<MotionViewProps, 'ref'>) {
	for (const name of ['layout', 'layoutId', 'inherit', 'whileHover', 'whileInView', 'whileDrag']) {
		if (name in props) throw new Error(`motion: ${name} is outside the supported subset`)
	}

	validateDrag(props)

	const parentVariant = useContext(VariantContext)
	const inherits = props.animate === undefined && parentVariant !== null
	const initialDefinition = props.initial ?? parentVariant?.initial
	const animateDefinition = props.animate ?? parentVariant?.animate
	const resolve = (definition: AnimationDefinition | false | undefined, source: MotionProps = props) => {
		const resolved = resolveVariant(definition, source.variants, source.custom)
		for (const key of keys) {
			if (resolved.target[key] !== undefined && source.style?.[key] instanceof MotionValue) throw new Error(`motion: ${key} has both an animate target and a MotionValue writer`)
		}

		return resolved
	}

	const resolvedAnimate = resolve(animateDefinition)
	const resolvedInitial = resolve(initialDefinition)
	const resolvedExit = resolve(props.exit)
	const presence = useContext(PresenceContext)
	if (props.exit && !presence) throw new Error('motion: exit requires a mounted Presence boundary')
	const config = useContext(ConfigContext)
	const systemReduced = useReducedMotion()
	const reduced = config.reducedMotion === 'always' || (config.reducedMotion === 'user' && systemReduced)
	const transition = props.transition ?? config.transition ?? {}
	validateTransitionInput(transition)
	resolve(props.whileTap)
	resolve(props.whileFocus)
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
			if (value instanceof MotionValue && (resolvedAnimate.target[key as MotionKey] !== undefined || resolvedExit.target[key as MotionKey] !== undefined || (resolvedInitial.target[key as MotionKey] !== undefined))) throw new Error(`motion: ${key} has both an animate target and a MotionValue writer`)
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
	const inheritedRun = useRef<{ label: string; resolved: string } | null>(null)
	if (previous.current.length !== bindings.length || previous.current.some(([key, value], i) => key !== bindings[i][0] || value !== bindings[i][1])) previous.current = bindings
	current.controller.onUpdate = (snapshot) => latest.current.onUpdate?.(snapshot)

	const gesture = (kind: GestureKind, phase: 'start' | 'end') => {
		const shape = GESTURE_PROPS[kind]
		const definition = latest.current[shape.target]
		if (!definition) return
		const { target, transition: override } = resolve(definition, latest.current)
		const gestureTransition = playbackTransition(override ?? latest.current[shape.transition] ?? playback.current.transition)
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
			for (const key of Object.keys(target) as MotionKey[]) rest[key] = resolve(latest.current.animate ?? parentVariant?.animate, latest.current).target[key] ?? snap[key] ?? defaults[key]
			void current.controller.animate(rest, gestureTransition, playback.current.reduced)
		}
	}

	const ref = useRef<(host: any) => void>(() => {})
	ref.current = (host) => {
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
				current.controller.seed(initialDefinition === false ? resolvedAnimate.target : resolvedInitial.target)
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
	}

	const playback = useRef({ transition, reduced })
	playback.current = { transition, reduced }
	const nodeRef = useRef<VariantNode | null>(null)
	if (!nodeRef.current) nodeRef.current = new VariantNode()
	const node = nodeRef.current
	node.initial = initialDefinition === false || isLabels(initialDefinition) ? initialDefinition : undefined
	node.animate = isLabels(animateDefinition) ? animateDefinition : undefined
	node.resolve = (definition) => {
		const resolved = resolve(definition, latest.current)
		return { target: resolved.target, transition: resolved.transition ?? playback.current.transition }
	}

	node.stopOwn = () => current.controller.stop()
	node.play = async (definition, target, timing) => {
		latest.current.onAnimationStart?.(definition)
		const result = await current.controller.animate(target, timing, playback.current.reduced)
		if (result === 'finished' && current.host) latest.current.onAnimationComplete?.()
		return result
	}

	useLayoutEffect(() => inherits ? parentVariant!.register(node) : undefined, [inherits, parentVariant])
	const returning = useRef<Target | null>(null)
	const member = useRef<PresenceMember | null>(null)
	if (!member.current) member.current = {
		exit() {
			node.cancelPending()
			const snapshot = current.controller.snapshot()
			returning.current ??= {}
			const resolved = resolve(latest.current.exit, latest.current)
			for (const key of Object.keys(resolved.target) as MotionKey[]) {
				if (!(key in returning.current)) returning.current[key] = snapshot[key]
			}

			return current.controller.animate(resolved.target, playbackTransition(resolved.transition ?? playback.current.transition), playback.current.reduced)
		},
		enter() {
			const resolved = resolve(latest.current.animate ?? parentVariant?.animate, latest.current)
			const target = { ...returning.current, ...resolved.target }
			returning.current = null
			void current.controller.animate(target, playbackTransition(resolved.transition ?? playback.current.transition), playback.current.reduced).then((result) => {
				if (result === 'finished' && current.host && presence?.present) latest.current.onAnimationComplete?.()
			})
		},
	}

	useLayoutEffect(() => presence?.register(member.current!), [presence])
	const hostRef = useRef((host: any) => ref.current(host)).current
	useLayoutEffect(() => () => { node.stop(); current.dragOff?.(); current.gestureOff?.(); current.controller.destroy(); current.host = undefined; current.adapter = undefined }, [])
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
		const skip = firstAnimation.current && initialDefinition === false
		firstAnimation.current = false
		if (presence && !presence.present) presence.restart(member.current!)
		else if (animateDefinition !== undefined && !skip) {
			if (!inherits) void node.run(animateDefinition)
			else {
				const label = JSON.stringify(animateDefinition)
				const resolved = JSON.stringify({ resolvedAnimate, transition, reduced })
				const previousRun = inheritedRun.current
				if (previousRun?.label === label && previousRun.resolved !== resolved) {
					const parentTiming = parentVariant!.resolve(animateDefinition).transition
					void node.run(animateDefinition, (parentTiming.delayChildren ?? 0) + [...parentVariant!.children].indexOf(node) * (parentTiming.staggerChildren ?? 0))
				}

				inheritedRun.current = { label, resolved }
			}
		}

		return () => { if (!inherits) node.stop() }
	}, [JSON.stringify(resolvedAnimate), JSON.stringify(resolvedExit), JSON.stringify(animateDefinition), JSON.stringify(transition), reduced, inherits])

	const { drag, dragConstraints, dragElastic, dragMomentum, onDragStart, onDrag, onDragEnd, variants, custom, initial, exit, animate, transition: ignoredTransition, whileTap, whileTapTransition, whileFocus, whileFocusTransition, onAnimationStart, onAnimationComplete, onUpdate, style: ignoredStyle, ref: ignoredRef, ...rest } = props
	return { hostProps: { ...rest, style, ref: [hostRef, props.ref] }, node }
}

function MotionLeaf(props: MotionProps & { component?: any }) @{
	const Component = props.component
	const { hostProps, node } = useMotion(props)

	<VariantContext value={node}><Component {...hostProps}>{props.children}</Component></VariantContext>
}

/** Wrap any component that accepts `ref`/`style`/`children` — the portable
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
	const { hostProps, node } = useMotion(props)

	<VariantContext value={node}><View {...hostProps}>{props.children}</View></VariantContext>
}

/** Animated horizontal stack. */
export function MotionRow(props: MotionRowProps) @{
	const { hostProps, node } = useMotion(props)

	<VariantContext value={node}><HStack {...hostProps}>{props.children}</HStack></VariantContext>
}

/** Animated Pressable preserving its input callbacks and disabled state. */
export function MotionPressable(props: MotionPressableProps) @{
	const { hostProps, node } = useMotion(props)

	<VariantContext value={node}><Pressable {...hostProps}>{props.children}</Pressable></VariantContext>
}
