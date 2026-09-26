import type { OpenWindowOptions } from './props'

/** Open a browser window using the current route unless a URL is supplied. */
export function openWindow(options: OpenWindowOptions = {}): Window | null {
	return window.open(options.url ?? window.location.href, '_blank')
}
