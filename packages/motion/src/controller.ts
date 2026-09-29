import { MotionValue } from './value'
import type { Clock } from './clock-types'
import type { Target, MotionKey, Transition } from './types'
import type { AnimationResult } from './engine'

export const keys: MotionKey[] = ['opacity', 'x', 'y', 'scale', 'scaleX', 'scaleY', 'rotate']
export const defaults: Required<Target> = {
	opacity: 1,
	x: 0,
	y: 0,
	scale: 1,
	scaleX: 1,
	scaleY: 1,
	rotate: 0,
}

export function validateTarget(target?: Target) {
	for (const [key, value] of Object.entries(target ?? {})) {
		if (!keys.includes(key as MotionKey) || !Number.isFinite(value)) {
			throw new Error(`motion: unsupported target ${key}; expected a finite numeric motion channel`)
		}
	}
}

export class Controller {
	readonly values = new Map<MotionKey, MotionValue>()
	private write?: (target: Target) => void
	private generation = 0
	constructor(private clock: Clock) {}
	private value(key: MotionKey) {
		let value = this.values.get(key)
		if (!value) {
			value = new MotionValue(defaults[key], this.clock)
			this.values.set(key, value)
			value.on('change', () => this.flush())
		}

		return value
	}
	attach(write: (target: Target) => void) {
		this.write = write
		this.flush()
	}
	snapshot(): Target {
		return Object.fromEntries([...this.values].map(([key, value]) => [key, value.get()]))
	}
	flush() {
		this.write?.(Object.fromEntries([...this.values].map(([key, value]) => [key, value.get()])))
	}
	set(key: MotionKey, next: number) {
		this.value(key).jump(next)
	}
	seed(target: Target) {
		validateTarget(target)
		for (const [key, value] of Object.entries(target)) {
			this.set(key as MotionKey, value)
		}
	}
	async animate(
		target: Target,
		transition: Transition,
		reduced: boolean,
	): Promise<AnimationResult> {
		validateTarget(target)
		const generation = ++this.generation
		// A new destination owns the entire declarative animation, including removed keys.
		for (const value of this.values.values()) {
			value.stop('replaced')
		}

		const jobs = Object.entries(target).map(([key, to]) => {
			const value = this.value(key as MotionKey)
			return value.animate(to, reduced && key !== 'opacity' ? { duration: 0 } : transition).finished
		})

		const results = await Promise.all(jobs)
		if (generation !== this.generation) {
			return 'replaced'
		}

		return results.every((result) => result === 'finished') ? 'finished' : 'cancelled'
	}
	stop() {
		++this.generation
		for (const value of this.values.values()) {
			value.stop()
		}
	}
	destroy() {
		this.stop()
		for (const value of this.values.values()) {
			value.destroy()
		}

		this.values.clear()
		this.write = undefined
	}
}
