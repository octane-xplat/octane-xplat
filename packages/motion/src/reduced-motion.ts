import { Application, Utils } from '@nativescript/core'

export function readReducedMotion(): boolean {
	const platform = globalThis as any
	if (Application.ios) {
		return Boolean(platform.UIAccessibilityIsReduceMotionEnabled?.())
	}

	const context = Utils.android.getApplicationContext()
	return (
		platform.android.provider.Settings.Global.getFloat(
			context.getContentResolver(),
			'animator_duration_scale',
			1,
		) === 0
	)
}

// Poll only while subscribed; this also detects Android developer-setting changes
// without owning a Java ContentObserver class. Resume refreshes immediately.
export function observeReducedMotion(notify: () => void): () => void {
	let previous = readReducedMotion()
	const check = () => {
		const next = readReducedMotion()
		if (next !== previous) {
			previous = next
			notify()
		}
	}

	const timer = setInterval(check, 500)
	Application.on(Application.resumeEvent, check)
	return () => {
		clearInterval(timer)
		Application.off(Application.resumeEvent, check)
	}
}
