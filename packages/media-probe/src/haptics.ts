import { Application, Utils } from '@nativescript/core'
import { java } from '@octane-xplat/platform/android'

declare const XplatPulsarBridge: any
declare const com: any

// `Utils.android` is a {} stub in the pinned Windows core build; callers only
// reach this under the Application.android guard.
// The Kotlin bridge cached one Pulsar per context in a WeakHashMap. Preset
// playback needs an activity — PresetsWrapper casts the Pulsar context to
// Activity — so the map keys the foreground activity when one exists, falling
// back to the application context.
const pulsars = new WeakMap<object, any>()
const pulsar = () => {
	const context =
		Application.android.foregroundActivity ?? (Utils.android as any).getApplicationContext()
	let instance = pulsars.get(context)
	if (!instance) {
		instance = new com.swmansion.pulsar.Pulsar(context)
		pulsars.set(context, instance)
	}
	return instance
}

export const playPreset = () => {
	if (Application.android) {
		const instance = pulsar()
		const support = instance.hapticSupport()
		if (
			support.compareTo(com.swmansion.pulsar.types.CompatibilityMode.STANDARD_SUPPORT) >= 0
		) {
			// pulsar-android 1.3.0 names this preset SystemNotificationSuccess;
			// the Kotlin bridge's "Success" never resolved in the name table.
			instance.getPresets().getByName('SystemNotificationSuccess')?.play()
		}
	} else {
		XplatPulsarBridge.playPreset()
	}
}

export const playCustomPattern = () => {
	if (Application.android) {
		const types = com.swmansion.pulsar.types
		const amplitude = new java.util.ArrayList()
		amplitude.add(new types.ValuePoint(0, 0))
		amplitude.add(new types.ValuePoint(90, 0.8))
		amplitude.add(new types.ValuePoint(220, 0))

		const frequency = new java.util.ArrayList()
		frequency.add(new types.ValuePoint(0, 0.4))
		frequency.add(new types.ValuePoint(220, 0.8))

		const discrete = new java.util.ArrayList()
		discrete.add(new types.ConfigPoint(35, 1, 0.6))

		const composer = pulsar().getPatternComposer()
		composer.parsePattern(
			new types.PatternData(new types.ContinuousPattern(amplitude, frequency), discrete),
		)
		composer.play()
	} else {
		XplatPulsarBridge.playCustomPattern()
	}
}

export const setRealtime = (value: number) => {
	if (Application.android) {
		// Kotlin's default parameter emits no zero-arg JVM overload; null selects
		// the constructor-computed realtimeComposerStrategy, matching the Kotlin
		// bridge's getRealtimeComposer() call.
		pulsar().getRealtimeComposer(null).set(value, 0.55)
	} else {
		XplatPulsarBridge.setRealtime(value, 0.55)
	}
}

export const stopRealtime = () => {
	if (Application.android) {
		pulsar().getRealtimeComposer(null).stop()
	} else {
		XplatPulsarBridge.stopRealtime()
	}
}
