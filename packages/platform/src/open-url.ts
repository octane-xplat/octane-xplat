// Outbound links and app settings — native leaf. Settings use the public
// per-app settings route on each platform, not private iOS prefs URLs.
import { Application, Utils } from '@nativescript/core'
import type { Service } from '@octane-xplat/lib/capability'
import type { OpenSettingsImpl } from './types'
import { android } from '@octane-xplat/platform/android'

/** Open a URL with the platform handler. */
export function openUrl(url: string): boolean {
	return Utils.openUrl(url)
}

function openSettingsPage(): boolean {
	try {
		if (Application.ios) {
			const settingsUrl = (globalThis as any).UIApplicationOpenSettingsURLString ?? 'app-settings:'
			return Utils.openUrl(settingsUrl)
		}

		if (Application.android) {
			// `Utils.android` is a {} stub in the pinned Windows core build.
			const androidUtils = Utils.android as any
			const activity = androidUtils.getCurrentActivity()

			if (!activity) {
				return false
			}

			const intent = new android.content.Intent(
				(android.provider.Settings as any).ACTION_APPLICATION_DETAILS_SETTINGS,
			)

			intent.setData(android.net.Uri.parse(`package:${androidUtils.getPackageName()}`))
			activity.startActivity(intent)
			return true
		}
	} catch {
		return false
	}

	return false
}

/** Open the app's system settings page. */
export const openSettings: Service<OpenSettingsImpl> = {
	supported: true,
	isAvailable: async () => true,
	open: openSettingsPage,
}
