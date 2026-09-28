import type { OpenWindowOptions } from './props'

export function openWindow(options: OpenWindowOptions = {}): void {
	const open = (globalThis as any).__xplatAppKitOpenWindow
	if (typeof open !== 'function') {
		console.warn('[octane-xplat] Window creation is unsupported by the current AppKit host.')
		return
	}
	open(options)
}
