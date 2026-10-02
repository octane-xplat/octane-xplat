import { MotionValue } from './value'
import type { Clock } from './clock-types'
import type { HostAdapter, DelegatedRun } from './host-types'
import type { Target, MotionKey, TransitionInput } from './types'
import { isBezierEase, isOrchestrated, resolveTransition, type AnimationResult } from './engine'

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
	/** Per-write snapshot callback (rAF-rate during delegated and JS runs). */
	onUpdate?: (snapshot: Target) => void
	private adapter?: HostAdapter
	private delegated?: { run: DelegatedRun; frame: number; trackSample: () => void }
	private generation = 0
	constructor(private clock: Clock) {}
	value(key: MotionKey) {
		let value = this.values.get(key)
		if (!value) {
			value = new MotionValue(defaults[key], this.clock)
			this.values.set(key, value)
			value.on('change', () => this.flush())
		}

		return value
	}
	attach(adapter: HostAdapter) {
		this.adapter = adapter
		this.flush()
	}
	private cancelDelegated() {
		if (!this.delegated) {
			return
		}

		this.clock.cancel(this.delegated.frame)
		this.delegated.trackSample()
		this.delegated.run.cancel()
		this.delegated = undefined
	}
	snapshot(): Target {
		return Object.fromEntries([...this.values].map(([key, value]) => [key, value.get()]))
	}
	flush() {
		const snapshot = Object.fromEntries([...this.values].map(([key, value]) => [key, value.get()]))
		this.adapter?.write(snapshot)
		this.onUpdate?.(snapshot)
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
		transition: TransitionInput,
		reduced: boolean,
	): Promise<AnimationResult> {
		validateTarget(target)
		const generation = ++this.generation
		this.cancelDelegated()
		// A new destination owns the entire declarative animation, including removed keys.
		for (const value of this.values.values()) {
			value.stop('replaced')
		}

		if (
			!reduced &&
			!isOrchestrated(transition) &&
			transition.type !== 'spring' &&
			(transition.duration ?? 0.3) > 0 &&
			(transition.repeat ?? 0) === 0 &&
			isBezierEase(transition.ease) &&
			this.adapter?.delegate
		) {
			const dest: Target = { ...this.snapshot(), ...target }
			const run = this.adapter.delegate({
				target,
				dest,
				eff: {
					opacity: dest.opacity,
					x: dest.x,
					y: dest.y,
					scaleX: (dest.scale ?? 1) * (dest.scaleX ?? 1),
					scaleY: (dest.scale ?? 1) * (dest.scaleY ?? 1),
					rotate: dest.rotate,
				},
				transition,
			})

			if (run) {
				const trackSample = () => {
					const eff = run.sample()
					for (const key of keys) {
						if (target[key] === undefined) {
							continue
						}

						let next: number | undefined
						if (key === 'scale') {
							next = (eff.scaleX ?? 1) / (dest.scaleX || 1)
						} else if (key === 'scaleX') {
							next = (eff.scaleX ?? 1) / (dest.scale || 1)
						} else if (key === 'scaleY') {
							next = (eff.scaleY ?? 1) / (dest.scale || 1)
						} else {
							next = eff[key]
						}

						if (next !== undefined && Number.isFinite(next)) {
							this.value(key).track(next)
						}
					}

					this.onUpdate?.(this.snapshot())
				}

				const entry = { run, frame: 0, trackSample }
				const tick = () => {
					if (this.delegated !== entry) {
						return
					}

					trackSample()
					entry.frame = this.clock.request(tick)
				}

				entry.frame = this.clock.request(tick)
				this.delegated = entry
				const result = await run.finished
				// Only this run cleans up its own sampler — an interrupted run must
				// not clobber the replacement's delegated state.
				if (this.delegated === entry) {
					this.clock.cancel(entry.frame)
					this.delegated = undefined
				}

				if (generation !== this.generation) {
					return 'replaced'
				}

				if (result !== 'finished') {
					return 'cancelled'
				}

				for (const key of keys) {
					if (dest[key] !== undefined) {
						this.value(key).jump(dest[key]!)
					}
				}

				return 'finished'
			}
		}

		const jobs = Object.entries(target).map(([key, to]) => {
			const value = this.value(key as MotionKey)
			return value.animate(
				to,
				reduced && key !== 'opacity'
					? { duration: 0 }
					: resolveTransition(transition, key as MotionKey),
			).finished
		})

		const results = await Promise.all(jobs)
		if (generation !== this.generation) {
			return 'replaced'
		}

		return results.every((result) => result === 'finished') ? 'finished' : 'cancelled'
	}
	stop() {
		++this.generation
		this.cancelDelegated()
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
		this.adapter = undefined
	}
}
