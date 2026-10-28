import { Utils } from '@nativescript/core'
import { Windows } from '@octane-xplat/platform/windows'
import type { Service } from '@octane-xplat/lib/capability'
import type { OpenSettingsImpl } from './types'

/** Hand an outbound URL to the NativeScript Windows launcher. */
export function openUrl(url: string): boolean {
	return Utils.openUrl(url)
}

function packageFamily(): string | null {
	try {
		return Windows?.ApplicationModel?.Package?.Current?.Id?.FamilyName || null
	} catch {
		// Unpackaged desktop apps have no per-package settings page.
		return null
	}
}

/** Opens this packaged app's Windows Settings page; unavailable without identity. */
export const openSettings: Service<OpenSettingsImpl> = {
	get supported() {
		return packageFamily() !== null
	},
	isAvailable: async () => packageFamily() !== null,
	open() {
		const family = packageFamily()
		if (!family) {
			return false
		}
		try {
			return openUrl(`ms-settings:appsfeatures-app?PFN=${encodeURIComponent(family)}`)
		} catch {
			return false
		}
	},
}
