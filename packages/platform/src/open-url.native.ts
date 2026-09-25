// Outbound links and app settings — native leaf. Settings use the public
// per-app settings route on each platform, not private iOS prefs URLs.
import { Application, Utils } from '@nativescript/core'
import type { Capability, OpenSettingsImpl } from './types'

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
			const activity = Utils.android.getCurrentActivity()

			if (!activity) {
				return false
			}

			const intent = new android.content.Intent(
				(android.provider.Settings as any).ACTION_APPLICATION_DETAILS_SETTINGS,
			)

			intent.setData(android.net.Uri.parse(`package:${Utils.android.getPackageName()}`))
			activity.startActivity(intent)
			return true
		}
	} catch {
		return false
	}

	return false
}

export const openSettings: Capability<OpenSettingsImpl> = {
	supported: true,
	async ensure() {
		return 'granted'
	},
	impl: { open: openSettingsPage },
}
