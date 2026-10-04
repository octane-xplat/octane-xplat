import { Application, Utils } from '@nativescript/core'
import type { HapticPattern, HapticPreset, Haptics, HapticsCapabilities } from './types'

declare const XplatPulsarBridge: any
declare const com: any

const presetNames: Record<HapticPreset, string> = {
	selection: 'SystemSelection',
	'impact-light': 'SystemImpactLight',
	'impact-medium': 'SystemImpactMedium',
	'impact-heavy': 'SystemImpactHeavy',
	success: 'Success',
	warning: 'Warning',
	error: 'Error',
}

export const createHaptics = (): Haptics => {
	const android = Boolean(Application.android)
	const context = android
		? // `Utils.android` is a {} stub in the pinned Windows core build.
			(Application.android.foregroundActivity ?? (Utils.android as any).getApplicationContext())
		: undefined

	let disposed = false
	let realtimeActive = false
	const sdk = android ? new com.swmansion.pulsar.Pulsar(context) : undefined
	// Kotlin's default parameter does not emit a zero-argument JVM overload,
	// so NativeScript reflection needs the strategy argument explicitly.
	const realtime = android
		? sdk.getRealtimeComposer(
				com.swmansion.pulsar.types.RealtimeComposerStrategy.ENVELOPE_WITH_DISCRETE_PRIMITIVES,
			)
		: undefined

	// Instance class on iOS (Swift @objcMembers) — call via an
	// instance; it stays undefined when the plugin bridge isn't linked.
	const bridge = android
		? undefined
		: typeof XplatPulsarBridge !== 'undefined'
			? new XplatPulsarBridge()
			: undefined

	const supported = android
		? sdk.hapticSupport().name() !== 'NO_SUPPORT'
		: Boolean(bridge?.isSupported?.())

	const stop = () => {
		if (disposed) {
			return
		}

		if (realtimeActive) {
			if (android) {
				realtime.stop()
			} else {
				bridge?.stopRealtime()
			}
		}

		if (android) {
			sdk.stopHaptics()
		} else {
			bridge?.stop()
		}

		realtimeActive = false
	}

	return {
		capabilities: (): HapticsCapabilities => ({
			supported,
			presets: supported,
			patterns: supported,
			realtime: supported,
		}),
		play: (preset) => {
			if (!supported || disposed) {
				return false
			}

			if (android) {
				sdk.getPresets().getByName(presetNames[preset])?.play()
			} else {
				bridge.playPreset(presetNames[preset])
			}

			return true
		},
		playPattern: (pattern: HapticPattern) => {
			if (!supported || disposed) {
				return false
			}

			if (android) {
				const amplitude = new java.util.ArrayList()
				for (const point of pattern.points) {
					amplitude.add(new com.swmansion.pulsar.types.ValuePoint(point.at, point.intensity))
				}

				const frequency = new java.util.ArrayList()
				for (const point of pattern.points) {
					frequency.add(new com.swmansion.pulsar.types.ValuePoint(point.at, point.sharpness ?? 0.5))
				}

				const data = new com.swmansion.pulsar.types.PatternData(
					new com.swmansion.pulsar.types.ContinuousPattern(amplitude, frequency),
					new java.util.ArrayList(),
				)

				const composer = sdk.getPatternComposer()
				composer.parsePattern(data)
				composer.play()
			} else {
				bridge.playPattern(JSON.stringify(pattern))
			}

			return true
		},
		startRealtime: (intensity = 0, sharpness = 0.5) => {
			if (supported && !disposed) {
				if (android) {
					realtime.set(intensity, sharpness)
				} else {
					bridge.startRealtime(intensity, sharpness)
				}

				realtimeActive = true
			}

			return {
				update: (nextIntensity, nextSharpness = sharpness) => {
					if (!realtimeActive || disposed) {
						return
					}

					if (android) {
						realtime.set(nextIntensity, nextSharpness)
					} else {
						bridge.setRealtime(nextIntensity, nextSharpness)
					}
				},
				stop,
			}
		},
		stop,
		dispose: () => {
			stop()
			disposed = true
		},
	}
}
