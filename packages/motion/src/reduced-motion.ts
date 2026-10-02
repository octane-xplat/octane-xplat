import { Application, Device, Utils } from '@nativescript/core'

export function readReducedMotion(): boolean {
	const platform = globalThis as any
	if (Application.ios) {
		return Boolean(platform.UIAccessibilityIsReduceMotionEnabled?.())
	}

	if (!platform.android) {
		return false
	}

	if (
		Number(Device.sdkVersion) >= 26 &&
		platform.android.animation?.ValueAnimator?.areAnimatorsEnabled?.() === false
	) {
		return true
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

// iOS posts a notification on preference change; Android has no event, so it
// polls only while subscribed (also catches developer-setting changes) and
// refreshes on resume.
export function observeReducedMotion(notify: () => void): () => void {
	if (Application.ios) {
		const name = (globalThis as any).UIAccessibilityReduceMotionStatusDidChangeNotification
		const observer = Application.ios.addNotificationObserver(name, notify)
		return () => Application.ios.removeNotificationObserver(observer, name)
	}

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
