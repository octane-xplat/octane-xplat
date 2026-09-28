import type { OpenSheet } from './props'

export const openSheet: OpenSheet = () => {
	console.warn('[octane-xplat] Imperative sheets are unsupported by the current AppKit host.')
	return Promise.reject(new Error('unsupported: AppKit host has no sheet presenter'))
}

export function closeSheet(): void {}
export function sheetHost(): null { return null }
