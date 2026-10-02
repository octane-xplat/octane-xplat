import { Application } from '@nativescript/core'

/** Announce search status through the active native accessibility service. */
export function announceCommandPalette(view: any, message: string): void {
	if (!message) {
		return
	}

	if (Application.ios) {
		const native = globalThis as any
		native.UIAccessibilityPostNotification?.(
			native.UIAccessibilityAnnouncementNotification,
			message,
		)
	} else {
		view?.nativeViewProtected?.announceForAccessibility?.(message)
	}
}
