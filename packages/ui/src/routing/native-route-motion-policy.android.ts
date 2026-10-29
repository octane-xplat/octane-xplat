import { Application } from '@nativescript/core'

/** @internal The system animator-duration setting is available on supported APIs. */
export function readNativeReducedMotion(): boolean {
	try {
		const api = (globalThis as any).android
		if (api.os.Build.VERSION.SDK_INT >= 26) {
			return !api.animation.ValueAnimator.areAnimatorsEnabled()
		}

		const context = Application.android?.context
		return (
			!!context &&
			api.provider.Settings.Global.getFloat(
				context.getContentResolver(),
				api.provider.Settings.Global.ANIMATOR_DURATION_SCALE,
				1,
			) === 0
		)
	} catch {
		return false
	}
}
