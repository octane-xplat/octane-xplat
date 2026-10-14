import { Application, Utils, isIOS, isAndroid } from '@nativescript/core'
import type { KeepAwakeImpl } from './keep-awake.types'
import { createTaggedKeepAwake } from './keep-awake-tags'
import { android } from '@octane-xplat/platform/android'
import { UIApplication } from '@octane-xplat/platform/ios'

export { KeepAwakeDefaultTag } from './keep-awake.types'
export type { KeepAwakeImpl, KeepAwakeOptions } from './keep-awake.types'

const tags = new Set<string>()
const windows = new Set<any>()
let listening = false
let suspended = false
function apply(enabled: boolean, activity?: any): Promise<boolean> {
	if (isIOS) {
		return new Promise((resolve) =>
			Utils.executeOnMainThread(() => {
				try {
					UIApplication.sharedApplication.idleTimerDisabled = enabled && tags.size > 0 && !suspended
					resolve(true)
				} catch {
					resolve(false)
				}
			}),
		)
	}

	if (!isAndroid) {
		return Promise.resolve(false)
	}

	// `Utils.android` is a {} stub in the pinned Windows core build; callers only
	// reach this under the isAndroid guard.
	const current =
		activity ??
		(Utils.android as any).getCurrentActivity() ??
		Application.android.foregroundActivity

	if (enabled && !current) {
		return Promise.resolve(false)
	}

	return new Promise((resolve) =>
		Utils.executeOnMainThread(() => {
			try {
				if (enabled && tags.size > 0) {
					const window = current.getWindow()
					window.addFlags(android.view.WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
					windows.add(window)
				} else {
					for (const window of windows) {
						window.clearFlags(android.view.WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
					}

					windows.clear()
				}

				resolve(true)
			} catch {
				resolve(false)
			}
		}),
	)
}

const resume = () => {
	suspended = false
	void apply(tags.size > 0)
}

const suspend = () => {
	suspended = true
	if (isIOS) {
		void apply(false)
	}
}

const destroyed = (event: any) => {
	windows.delete(event.activity.getWindow())
}

const started = (event: any) => {
	if (tags.size) {
		void apply(true, event.activity)
	}
}

function listen() {
	if (listening) {
		return
	}

	listening = true
	Application.on(Application.resumeEvent, resume)
	Application.on(Application.suspendEvent, suspend)
	if (isAndroid) {
		Application.android.on(Application.AndroidApplication.activityStartedEvent, started)
		Application.android.on(Application.AndroidApplication.activityDestroyedEvent, destroyed)
	}
}

function unlisten() {
	Application.off(Application.resumeEvent, resume)
	Application.off(Application.suspendEvent, suspend)
	if (isAndroid) {
		Application.android.off(Application.AndroidApplication.activityStartedEvent, started)
		Application.android.off(Application.AndroidApplication.activityDestroyedEvent, destroyed)
	}

	listening = false
}

const service = createTaggedKeepAwake({
	available: () => isIOS || isAndroid,
	async activate(tag) {
		listen()
		tags.add(tag)
		// Retain requests made before Android creates its first activity.
		const applied = await apply(isAndroid || !suspended)
		const awaitingActivity =
			isAndroid &&
			!((Utils.android as any).getCurrentActivity() ?? Application.android.foregroundActivity)

		if (!applied && !awaitingActivity) {
			tags.delete(tag)
			if (!tags.size) {
				unlisten()
			}
		}

		return applied || awaitingActivity
	},
	async deactivate(tag) {
		if (tags.size === 1 && !(await apply(false))) {
			return false
		}

		tags.delete(tag)
		if (!tags.size) {
			unlisten()
		}

		return true
	},
})

export const keepAwake: KeepAwakeImpl = {
	...service,
	isActivated: async () => {
		await service.isActivated()
		return isIOS ? tags.size > 0 && !suspended : windows.size > 0
	},
}
