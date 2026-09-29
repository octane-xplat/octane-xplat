import { keyframes, spring } from 'motion-dom'
import type { Clock } from './clock-types'
import type { Transition } from './types'

/** Terminal status; cancellation never masquerades as completion. */
export type AnimationResult = 'finished' | 'cancelled' | 'replaced'
/** A cancellable animation whose finished promise always settles. */
export interface AnimationControls {
	finished: Promise<AnimationResult>
	stop(reason?: Exclude<AnimationResult, 'finished'>): void
}

export function validateTransition(t: Transition): void {
	const allowed = [
		'type',
		'duration',
		'delay',
		'ease',
		'stiffness',
		'damping',
		'mass',
		'velocity',
		'restSpeed',
		'restDelta',
	]

	for (const key of Object.keys(t)) {
		if (!allowed.includes(key)) {
			throw new Error(`motion: unsupported transition ${key}`)
		}
	}

	if (t.type !== undefined && t.type !== 'tween' && t.type !== 'spring') {
		throw new Error('motion: unsupported transition type')
	}

	for (const key of [
		'duration',
		'delay',
		'stiffness',
		'damping',
		'mass',
		'velocity',
		'restSpeed',
		'restDelta',
	] as const) {
		const value = t[key]
		if (value !== undefined && (!Number.isFinite(value) || (key !== 'velocity' && value < 0))) {
			throw new Error(`motion: invalid ${key}`)
		}
	}

	for (const key of ['mass', 'stiffness', 'damping', 'restSpeed', 'restDelta'] as const) {
		if (t[key] === 0) {
			throw new Error(`motion: ${key} must be positive`)
		}
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
		} else if (!['linear', 'easeIn', 'easeOut', 'easeInOut'].includes(t.ease)) {
			throw new Error('motion: unsupported easing')
		}
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
	const generator =
		transition.type === 'spring'
			? spring({
					keyframes: [from, to],
					stiffness: transition.stiffness ?? 100,
					damping: transition.damping ?? 10,
					mass: transition.mass ?? 1,
					velocity: transition.velocity ?? 0,
					restSpeed: transition.restSpeed,
					restDelta: transition.restDelta,
				})
			: keyframes({
					keyframes: [from, to],
					duration: duration * 1000,
					ease: transition.ease ?? 'easeInOut',
				})

	const start = clock.now() + (transition.delay ?? 0) * 1000
	const tick = () => {
		if (settled) {
			return
		}

		const elapsed = Math.max(0, clock.now() - start)
		if (clock.now() >= start) {
			const state = generator.next(elapsed)
			update(state.done ? to : state.value)
			if (state.done) {
				settle('finished')
				return
			}
		}

		if (!settled) {
			frame = clock.request(tick)
		}
	}

	if (transition.type !== 'spring' && duration === 0 && !transition.delay) {
		update(to)
		settle('finished')
	} else {
		frame = clock.request(tick)
	}

	return { finished, stop: (reason = 'cancelled') => settle(reason) }
}
