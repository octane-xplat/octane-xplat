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

			const pulses: number[] = []
			let cursor = 0
			for (const point of pattern.points) {
				pulses.push(
					Math.max(0, point.at - cursor),
					Math.round(10 + Math.max(0, Math.min(1, point.intensity)) * 40),
				)

				cursor = point.at + 10
			}

			return navigator.vibrate(pulses)
		},
		startRealtime: () => ({ update: () => {}, stop }),
		stop,
		dispose: () => {
			disposed = true
			stop()
		},
	}
}
