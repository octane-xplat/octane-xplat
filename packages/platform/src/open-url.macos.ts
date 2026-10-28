import { UnavailabilityError, type Service } from '@octane-xplat/lib/capability'
import type { OpenSettingsImpl } from './types'
import { host } from './appkit-host'

// Resolve through Launch Services instead of assuming an installation path or
// depending on private preference-pane URLs. Resolve the installed app on
// each request so a missing app or changing host does not become cached success.
const settingsBundleId = 'com.apple.systempreferences'
function settingsWorkspace(): any | null {
	try {
		const workspace = (globalThis as any).NSWorkspace?.sharedWorkspace
		return typeof workspace?.URLForApplicationWithBundleIdentifier === 'function' &&
			typeof workspace?.openURL === 'function' ? workspace : null
	} catch {
		return null
	}
}

/** On AppKit, open the system settings application. This does not navigate to
 * an app-specific permission page, change permissions, or confirm presentation. */
export const openSettings: Service<OpenSettingsImpl> = {
	get supported() {
		return settingsWorkspace() !== null
	},
	async isAvailable() {
		const workspace = settingsWorkspace()
		if (!workspace) return false
		try {
			return workspace.URLForApplicationWithBundleIdentifier(settingsBundleId) != null
		} catch {
			return false
		}
	},
	open() {
		const workspace = settingsWorkspace()
		if (!workspace) throw new UnavailabilityError('openSettings')
		try {
			const url = workspace.URLForApplicationWithBundleIdentifier(settingsBundleId)
			return url != null && Boolean(workspace.openURL(url))
		} catch {
			return false
		}
	},
}

export function openUrl(url: string): boolean {
	return host().openUrl?.(url) ?? false
}
