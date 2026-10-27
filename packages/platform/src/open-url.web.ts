// Outbound links — web leaf. Settings are an app-level concept and are
// explicitly unsupported in a browser.
import { UnavailabilityError } from '@octane-xplat/lib/capability'
import type { Service } from '@octane-xplat/lib/capability'
import type { OpenSettingsImpl } from './types'
import { desktopHost } from './host-runtime.web'

export function openUrl(url: string): boolean {
	const host = desktopHost()
	if (host) {
		// This synchronous API can report that the host request was dispatched,
		// not the eventual result returned by the asynchronous bridge call.
		void host.system.openUrl(url).catch((error) => {
			console.warn('[xplat] desktop host could not open URL', error)
		})

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
