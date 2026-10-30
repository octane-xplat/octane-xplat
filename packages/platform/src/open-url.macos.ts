import { UnavailabilityError, type Service } from '@octane-xplat/lib/capability'
import type { OpenSettingsImpl, SettingsPane } from './types'
import { host } from './appkit-host'

// Resolve through Launch Services instead of assuming an installation path.
// Resolve the installed app on each request so a missing app or changing host
// does not become cached success.
const settingsBundleId = 'com.apple.systempreferences'

/** x-apple.systempreferences routes: <pane extension id>?<anchor>. Anchor
 *  names verified against System Settings on macOS 27.2 via AppleScript
 *  (`anchors of pane`); the same ids exist on macOS 13+. */
const PRIVACY = 'com.apple.settings.PrivacySecurity.extension'
const PANE_URLS: Record<SettingsPane, string> = {
	general: 'x-apple.systempreferences:com.apple.systempreferences.GeneralSettings',
	privacy: `x-apple.systempreferences:${PRIVACY}`,
	notifications: 'x-apple.systempreferences:com.apple.Notifications-Settings.extension',
	camera: `x-apple.systempreferences:${PRIVACY}?Privacy_Camera`,
	microphone: `x-apple.systempreferences:${PRIVACY}?Privacy_Microphone`,
	photos: `x-apple.systempreferences:${PRIVACY}?Privacy_Photos`,
	contacts: `x-apple.systempreferences:${PRIVACY}?Privacy_Contacts`,
	calendars: `x-apple.systempreferences:${PRIVACY}?Privacy_Calendars`,
	reminders: `x-apple.systempreferences:${PRIVACY}?Privacy_Reminders`,
	location: `x-apple.systempreferences:${PRIVACY}?Privacy_LocationServices`,
	bluetooth: `x-apple.systempreferences:${PRIVACY}?Privacy_Bluetooth`,
	accessibility: `x-apple.systempreferences:${PRIVACY}?Privacy_Accessibility`,
	screenCapture: `x-apple.systempreferences:${PRIVACY}?Privacy_ScreenCapture`,
	fullDiskAccess: `x-apple.systempreferences:${PRIVACY}?Privacy_AllFiles`,
	filesAndFolders: `x-apple.systempreferences:${PRIVACY}?Privacy_FilesAndFolders`,
	inputMonitoring: `x-apple.systempreferences:${PRIVACY}?Privacy_ListenEvent`,
	speechRecognition: `x-apple.systempreferences:${PRIVACY}?Privacy_SpeechRecognition`,
	media: `x-apple.systempreferences:${PRIVACY}?Privacy_Media`,
	automation: `x-apple.systempreferences:${PRIVACY}?Privacy_Automation`,
	home: `x-apple.systempreferences:${PRIVACY}?Privacy_HomeKit`,
	motion: `x-apple.systempreferences:${PRIVACY}?Privacy_Motion`,
	passkeys: `x-apple.systempreferences:${PRIVACY}?Privacy_PasskeyAccess`,
	// No verified anchor for the local-network permission list; land on the
	// privacy pane rather than claiming a pane the OS does not expose.
	localNetwork: `x-apple.systempreferences:${PRIVACY}`,
	wifi: 'x-apple.systempreferences:com.apple.wifi-settings-extension',
	network: 'x-apple.systempreferences:com.apple.Network-Settings.extension',
}

function settingsWorkspace(): any | null {
	try {
		const workspace = (globalThis as any).NSWorkspace?.sharedWorkspace
		return typeof workspace?.URLForApplicationWithBundleIdentifier === 'function' &&
			typeof workspace?.openURL === 'function' ? workspace : null
	} catch {
		return null
	}
}

/** On AppKit, open System Settings — `pane` selects a verified permission or
 *  preference pane through the public x-apple.systempreferences scheme. This
 *  does not change permissions or confirm presentation. */
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
	open(pane) {
		const workspace = settingsWorkspace()
		if (!workspace) throw new UnavailabilityError('openSettings')
		try {
			const appUrl = workspace.URLForApplicationWithBundleIdentifier(settingsBundleId)
			if (appUrl == null) {
				return false
			}

			if (pane) {
				const target = (globalThis as any).NSURL?.URLWithString?.(PANE_URLS[pane])
				if (target != null && Boolean(workspace.openURL(target))) {
					return true
				}
			}

			return Boolean(workspace.openURL(appUrl))
		} catch {
			return false
		}
	},
}

export function openUrl(url: string): boolean {
	return host().openUrl?.(url) ?? false
}
