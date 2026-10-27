// Outbound links — Linux leaf. The host owns the default-browser hop
// (Gio.AppInfo.launch_default_for_uri / xdg-open); browser dev falls back to
// window.open. Settings stay unsupported — no shared settings surface on Linux.
import { bridged, call } from './bridge'
import { UnavailabilityError } from '@octane-xplat/lib/capability'
import type { Service } from '@octane-xplat/lib/capability'
import type { OpenSettingsImpl } from './types'

export function openUrl(url: string): boolean {
	if (bridged()) {
		void call('system', 'openUrl', url)
		return true
	}

	return window.open(url, '_blank', 'noopener,noreferrer') !== null
}

export const openSettings: Service<OpenSettingsImpl> = {
	supported: false,
	isAvailable: async () => false,
	open: () => {
		throw new UnavailabilityError('openSettings')
	},
}
