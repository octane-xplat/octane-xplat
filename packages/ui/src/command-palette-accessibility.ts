import { hostGlobal } from './host-bridge'

/** Announce search status through the active native accessibility service. */
export function announceCommandPalette(view: any, message: string): void {
	if (!message) {
		return
	}

	const notify = hostGlobal('UIAccessibilityPostNotification')
	if (typeof notify === 'function') {
		notify(hostGlobal('UIAccessibilityAnnouncementNotification'), message)
	} else {
		view?.nativeViewProtected?.announceForAccessibility?.(message)
	}
}
