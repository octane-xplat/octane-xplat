// Outbound links — Linux leaf. The host owns the default-browser hop
// (Gio.AppInfo.launch_default_for_uri / xdg-open); browser dev falls back to
// window.open. Settings stay unsupported — no shared settings surface on Linux.
import { bridged, call } from './bridge'
import type { Capability, OpenSettingsImpl } from './types'

export function openUrl(url: string): boolean {
	if (bridged()) {
		void call('system', 'openUrl', url)
		return true
	}

	return window.open(url, '_blank', 'noopener,noreferrer') !== null
}

export const openSettings: Capability<OpenSettingsImpl> = {
	supported: false,
	async ensure() {
		return 'unsupported'
	},
	impl: null,
}
