// Outbound links — web leaf. Settings are an app-level concept and are
// explicitly unsupported in a browser.
import type { Capability, OpenSettingsImpl } from './types'

export function openUrl(url: string): boolean {
	return window.open(url, '_blank', 'noopener,noreferrer') !== null
}

export const openSettings: Capability<OpenSettingsImpl> = {
	supported: false,
	async ensure() {
		return 'unsupported'
	},
	impl: null,
}
