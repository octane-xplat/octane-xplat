import { inertia, keyframes, spring } from 'motion-dom'
import type { Clock } from './clock-types.js'
import type {
	Transition,
	TransitionInput,
	TransitionOrchestration,
	MotionKey,
	RepeatType,
} from './types.js'

/** Terminal status; cancellation never masquerades as completion. */
export type AnimationResult = 'finished' | 'cancelled' | 'replaced'
/** A cancellable animation whose finished promise always settles. */
export interface AnimationControls {
	/** Promise resolving when the animation settles. */
	finished: Promise<AnimationResult>
	stop(reason?: Exclude<AnimationResult, 'finished'>): void
}

const MOTION_KEYS: MotionKey[] = ['opacity', 'x', 'y', 'scale', 'scaleX', 'scaleY', 'rotate']

/** Platform animators take one timing curve per run — cubic-bezier only. */
const BEZIER_EASES = new Set(['linear', 'easeIn', 'easeOut', 'easeInOut'])
export function isBezierEase(ease: Transition['ease']): boolean {
	return ease === undefined || Array.isArray(ease) || BEZIER_EASES.has(ease)
}

const BEZIER_POINTS: Record<string, [number, number, number, number]> = {
	linear: [0, 0, 1, 1],
	easeIn: [0.42, 0, 1, 1],
	easeOut: [0, 0, 0.58, 1],
	easeInOut: [0.42, 0, 0.58, 1],
}

/** CSS cubic-bezier control points for a delegatable ease; tuples pass through. */
export function bezierPoints(ease: Transition['ease']): [number, number, number, number] {
	return Array.isArray(ease) ? ease : BEZIER_POINTS[ease ?? 'easeInOut']
}

export function isOrchestrated(t: TransitionInput | undefined): t is TransitionOrchestration {
	if (!t || typeof t !== 'object') {
		return false
	}

	return 'default' in t || 'layout' in t || MOTION_KEYS.some((key) => key in t)
}

export function resolveTransition(t: TransitionInput, key: MotionKey): Transition {
	return isOrchestrated(t) ? { ...t.default, ...t[key] } : t
}

export function validateTransition(t: Transition): void {
	if (t.type === 'spring' && t.ease !== undefined) {
		throw new Error('motion: physical springs do not accept ease')
	}

	const allowed = [
		'staggerChildren',
		'delayChildren',
		'when',
		'type',
		'duration',
		'delay',
		'ease',
		'repeat',
		'repeatType',
		'repeatDelay',
		'bounce',
		'stiffness',
		'damping',
		'mass',
		'velocity',
		'restSpeed',
		'restDelta',
		'power',
		'timeConstant',
		'min',
		'max',
		'bounceStiffness',
		'bounceDamping',
	]

	for (const key of Object.keys(t)) {
		if (!allowed.includes(key)) {
			throw new Error(`motion: unsupported transition ${key}`)
		}
	}

	if (t.when !== undefined && !['beforeChildren', 'afterChildren'].includes(t.when)) {
		throw new Error('motion: unsupported when')
	}

	if (t.type !== undefined && t.type !== 'tween' && t.type !== 'spring' && t.type !== 'inertia') {
		throw new Error('motion: unsupported transition type')
	}

	if (t.type === 'inertia') {
		for (const key of ['ease', 'duration', 'bounce', 'stiffness', 'damping', 'mass'] as const) {
			if (t[key] !== undefined) {
				throw new Error(`motion: inertia transitions do not accept ${key}`)
			}
		}

		if ((t.repeat ?? 0) > 0) {
			throw new Error('motion: inertia transitions do not accept repeat')
		}
	} else {
		for (const key of ['power', 'timeConstant', 'min', 'max', 'bounceStiffness', 'bounceDamping'] as const) {
			if (t[key] !== undefined) {
				throw new Error(`motion: ${key} requires an inertia transition`)
			}
		}
	}

	for (const key of [
		'staggerChildren',
		'delayChildren',
		'duration',
		'delay',
		'repeatDelay',
		'bounce',
		'stiffness',
		'damping',
		'mass',
		'velocity',
		'restSpeed',
		'restDelta',
		'power',
		'timeConstant',
		'min',
		'max',
		'bounceStiffness',
		'bounceDamping',
	] as const) {
		const value = t[key]
		if (
			value !== undefined &&
			(!Number.isFinite(value) || (key !== 'velocity' && key !== 'min' && key !== 'max' && value < 0))
		) {
			throw new Error(`motion: invalid ${key}`)
		}
	}

	if (
		t.repeat !== undefined &&
		(t.repeat < 0 || (!Number.isInteger(t.repeat) && t.repeat !== Infinity))
	) {
		throw new Error('motion: repeat must be a non-negative integer or Infinity')
	}

	if (t.repeatType !== undefined && !['loop', 'reverse', 'mirror'].includes(t.repeatType)) {
		throw new Error('motion: unsupported repeatType')
	}

	for (const key of [
		'mass',
		'stiffness',
		'damping',
		'restSpeed',
		'restDelta',
		'timeConstant',
		'bounceStiffness',
		'bounceDamping',
	] as const) {
		if (t[key] === 0) {
			throw new Error(`motion: ${key} must be positive`)
		}
	}

	if (t.min !== undefined && t.max !== undefined && t.min > t.max) {
		throw new Error('motion: min must be less than or equal to max')
	}

	if (t.ease !== undefined) {
		if (Array.isArray(t.ease)) {
			if (
				t.ease.length !== 4 ||
				!t.ease.every(Number.isFinite) ||
				t.ease[0] < 0 ||
				t.ease[0] > 1 ||
				t.ease[2] < 0 ||
				t.ease[2] > 1
			) {
				throw new Error('motion: invalid cubic Bezier')
			}
		} else if (
			![
				'linear',
				'easeIn',
				'easeOut',
				'easeInOut',
				'circIn',
				'circOut',
				'circInOut',
				'backIn',
				'backOut',
				'backInOut',
				'anticipate',
			].includes(t.ease)
		) {
			throw new Error('motion: unsupported easing')
		}
	}
}

export function validateTransitionInput(t: TransitionInput): void {
	if (isOrchestrated(t)) {
		const { staggerChildren, delayChildren, when, ...channels } = t
		validateTransition({ staggerChildren, delayChildren, when })
		for (const [key, value] of Object.entries(channels)) {
			if (key !== 'default' && key !== 'layout' && !MOTION_KEYS.includes(key as MotionKey)) {
				throw new Error(`motion: unsupported transition ${key}`)
			}

			if (value) {
				validateTransition(value as Transition)
			}
		}
	} else {
		validateTransition(t)
	}
}

// Pure upstream generators share trajectories across platforms; host scheduling
// stays outside Motion's browser-global frame loop.
export function runAnimation(
	clock: Clock,
	from: number,
	to: number,
	transition: Transition,
	update: (value: number) => void,
	complete?: () => void,
): AnimationControls {
	validateTransition(transition)
	let frame = 0
	let settled = false
	let resolve!: (result: AnimationResult) => void
	const finished = new Promise<AnimationResult>((done) => {
		resolve = done
	})

	const settle = (result: AnimationResult) => {
		if (settled) {
			return
		}

		settled = true
		clock.cancel(frame)
		resolve(result)
		if (result === 'finished') {
			complete?.()
		}
	}

	const duration = transition.duration ?? 0.3
	const repeat = transition.repeat ?? 0
	const repeatType: RepeatType = transition.repeatType ?? 'loop'
	const repeatDelay = (transition.repeatDelay ?? 0) * 1000

	const makeGenerator = (legFrom: number, legTo: number) =>
		transition.type === 'inertia'
			? inertia({
					keyframes: [legFrom],
					velocity: transition.velocity ?? 0,
					power: transition.power,
					timeConstant: transition.timeConstant,
					min: transition.min,
					max: transition.max,
					bounceStiffness: transition.bounceStiffness,
					bounceDamping: transition.bounceDamping,
					restDelta: transition.restDelta,
					restSpeed: transition.restSpeed,
				})
			: transition.type === 'spring'
			? spring({
					keyframes: [legFrom, legTo],
					stiffness: transition.stiffness ?? 100,
					damping: transition.damping ?? 10,
					mass: transition.mass ?? 1,
					velocity: transition.velocity ?? 0,
					restSpeed: transition.restSpeed,
					restDelta: transition.restDelta,
					// Visual-duration spring spec — duration/bounce instead of
					// stiffness/damping; motion-dom takes milliseconds.
					duration: transition.duration !== undefined ? duration * 1000 : undefined,
					bounce: transition.bounce,
				})
			: keyframes({
					keyframes: [legFrom, legTo],
					duration: duration * 1000,
					ease: transition.ease ?? 'easeInOut',
				})

	let leg = 0
	let generator = makeGenerator(from, to)
	let legStart = clock.now() + (transition.delay ?? 0) * 1000
	const tick = () => {
		if (settled) {
			return
		}

		const now = clock.now()
		if (now < legStart) {
			frame = clock.request(tick)
			return
		}

		const elapsed = Math.max(0, now - legStart)
		const state = generator.next(elapsed)
		// Inertia ignores `to` — the generator's resting value is the destination.
		const legEnd =
			transition.type === 'inertia' ? state.value : repeatType === 'loop' || leg % 2 === 0 ? to : from
		update(state.done ? legEnd : state.value)
		if (state.done) {
			if (leg < repeat) {
				leg++
				// 'loop' replays the same direction; 'reverse'/'mirror' alternate
				// legs (identical for two keyframes, which is all we generate).
				const [legFrom, legTo] = repeatType === 'loop' || leg % 2 === 0 ? [from, to] : [to, from]
				generator = makeGenerator(legFrom, legTo)
				legStart = now + repeatDelay
				frame = clock.request(tick)
				return
			}

			settle('finished')
			return
		}

		if (!settled) {
			frame = clock.request(tick)
		}
	}

	if (
		transition.type !== 'spring' &&
		transition.type !== 'inertia' &&
		duration === 0 &&
		!transition.delay &&
		repeat === 0
	) {
		update(to)
		settle('finished')
	} else {
		frame = clock.request(tick)
	}

	return { finished, stop: (reason = 'cancelled') => settle(reason) }
}
