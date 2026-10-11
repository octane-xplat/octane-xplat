import type { HapticPattern, HapticPreset, Haptics, HapticsCapabilities } from './types'

const patterns: Record<HapticPreset, number[]> = {
	selection: [8],
	'impact-light': [12],
	'impact-medium': [20],
	'impact-heavy': [30],
	success: [10, 35, 18],
	warning: [18, 40, 18],
	error: [30, 45, 30],
}

export const createHaptics = (): Haptics => {
	let disposed = false
	let realtimeTimer: ReturnType<typeof setInterval> | undefined
	const supported = typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function'

	const stop = () => {
		if (realtimeTimer !== undefined) {
			clearInterval(realtimeTimer)
		}

		realtimeTimer = undefined
		if (supported) {
			navigator.vibrate(0)
		}
	}

	return {
		capabilities: (): HapticsCapabilities => ({
			supported,
			presets: supported,
			patterns: supported,
			realtime: false,
			...(supported
				? {}
				: {
						reason: 'Web Vibration API is unavailable; iOS Safari does not expose it.',
					}),
		}),
		play: (preset) => !disposed && supported && navigator.vibrate(patterns[preset]),
		playPattern: (pattern: HapticPattern) => {
			if (disposed || !supported) {
				return false
			}

			// Vibration patterns are [vibrate, pause, ...] — lead with a
			// zero-length buzz so each gap lands in a pause slot, advance the
			// cursor by the emitted pulse length, and clip to the authored
			// duration envelope.
			const duration = Number.isFinite(pattern.duration)
				? Math.max(0, pattern.duration)
				: null

			const pulses: number[] = []
			let cursor = 0
			for (const point of pattern.points) {
				if (!Number.isFinite(point.at)) {
					continue
				}

				const at = Math.max(0, point.at)
				if (duration !== null && at >= duration) {
					continue
				}

				const intensity = Number.isFinite(point.intensity)
					? Math.max(0, Math.min(1, point.intensity))
					: 0

				let pulse = Math.round(10 + intensity * 40)
				if (duration !== null) {
					pulse = Math.min(pulse, Math.max(0, Math.round(duration - at)))
				}

				if (pulse <= 0) {
					continue
				}

				if (pulses.length === 0) {
					pulses.push(0)
				}

				pulses.push(Math.max(0, Math.round(at - cursor)), pulse)
				cursor = at + pulse
			}

			return pulses.length > 0 && navigator.vibrate(pulses)
		},
		startRealtime: () => ({ update: () => {}, stop }),
		stop,
		dispose: () => {
			disposed = true
			stop()
		},
	}
}
