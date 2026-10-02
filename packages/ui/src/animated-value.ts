import type { AnimatedValue } from './props'

/** Host scheduling and writes stay outside the shared UI animation contract. */
export interface AnimationHost {
	now(): number
	request(callback: () => void): number
	cancel(id: number): void
	write(view: any, value: number): void
	reducedMotion?(): boolean
}

export function createAnimatedValue(
	initial: number,
	host: AnimationHost,
): AnimatedValue & { dispose(): void } {
	let current = initial
	let view: any = null
	let frame = 0
	let generation = 0
	let disposed = false
	const apply = (value: number) => {
		current = value
		if (view) {
			host.write(view, value)
		}
	}

	const stop = () => {
		generation++
		host.cancel(frame)
		frame = 0
	}

	const run = (target: number, step: (elapsed: number) => number | null) => {
		stop()
		if (disposed) {
			return
		}

		if (host.reducedMotion?.()) {
			apply(target)
			return
		}

		const token = generation
		const start = host.now()
		const tick = () => {
			if (disposed || token !== generation) {
				return
			}

			frame = 0
			const value = host.reducedMotion?.() ? null : step(Math.max(0, host.now() - start))
			apply(value === null ? target : value)
			if (value !== null && !disposed && token === generation) {
				frame = host.request(tick)
			}
		}

		frame = host.request(tick)
	}

	return {
		get value() {
			return current
		},
		ref(el) {
			if (disposed) {
				return
			}

			view = el
			if (view) {
				host.write(view, current)
			} else {
				stop()
			}
		},
		to(target, opts) {
			const duration = opts?.duration ?? 300
			if (!Number.isFinite(target) || !Number.isFinite(duration) || duration < 0) {
				throw new Error('useAnimation: invalid target or duration')
			}

			const from = current
			if (duration === 0) {
				stop()
				if (!disposed) {
					apply(target)
				}

				return
			}

			run(target, (elapsed) =>
				elapsed >= duration ? null : from + ((target - from) * elapsed) / duration,
			)
		},
		spring(target, opts) {
			const damping = opts?.damping ?? 14
			const stiffness = opts?.stiffness ?? 120
			if (
				!Number.isFinite(target) ||
				!Number.isFinite(damping) ||
				!Number.isFinite(stiffness) ||
				damping <= 0 ||
				stiffness <= 0
			) {
				throw new Error('useAnimation: invalid spring parameters')
			}

			// Exact unit-mass damped spring solution. Elapsed time, rather than
			// frame count, keeps settlement stable when the main run loop stalls.
			const from = current - target
			const decay = damping / 2
			const discriminant = stiffness - decay * decay
			run(target, (elapsed) => {
				const t = elapsed / 1000
				let x: number, velocity: number
				if (Math.abs(discriminant) < 1e-8) {
					const envelope = Math.exp(-decay * t)
					x = from * (1 + decay * t) * envelope
					velocity = -from * decay * decay * t * envelope
				} else if (discriminant > 0) {
					const frequency = Math.sqrt(discriminant)
					const envelope = Math.exp(-decay * t)
					x =
						from *
						envelope *
						(Math.cos(frequency * t) + (decay / frequency) * Math.sin(frequency * t))

					velocity = ((-from * envelope * stiffness) / frequency) * Math.sin(frequency * t)
				} else {
					const frequency = Math.sqrt(-discriminant)
					// Separate decaying exponentials avoid cosh overflow after suspension.
					const a = (1 + decay / frequency) / 2
					const b = (1 - decay / frequency) / 2
					const slow = Math.exp((-decay + frequency) * t)
					const fast = Math.exp((-decay - frequency) * t)
					x = from * (a * slow + b * fast)
					velocity = from * (a * (-decay + frequency) * slow + b * (-decay - frequency) * fast)
				}

				return Math.abs(velocity) < 0.5 && Math.abs(x) < 0.5 ? null : target + x
			})
		},
		stop,
		dispose() {
			stop()
			disposed = true
			view = null
		},
	}
}
