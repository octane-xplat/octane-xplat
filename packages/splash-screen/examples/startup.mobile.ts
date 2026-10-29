import { Page } from '@nativescript/core'
import { SplashScreen, hide, preventAutoHideAsync } from '@octane-xplat/splash-screen'

// Import this module before Application.run(), alongside the native entry.
const supported = SplashScreen.capabilities.hold
if (supported) {
	void preventAutoHideAsync().catch(() => {
		console.warn('The launch screen could not be held')
	})
}

/** Call after constructing/rendering the root Page, before navigating to it. */
export function revealWhenLoaded(page: Page): void {
	if (!supported) {return}
	const reveal = () => hide()
	if (page.isLoaded) {reveal()}
	else {page.once(Page.loadedEvent, reveal)}
}
