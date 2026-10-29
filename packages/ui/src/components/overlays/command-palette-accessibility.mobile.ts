import { Application } from '@nativescript/core'
import { hostGlobal } from '../../internal/platform/host-bridge'

/** Announce search status through the active native accessibility service. */
export function announceCommandPalette(view: any, message: string): void {
	if (!message) {
		return
	}

	if (Application.ios) {
		hostGlobal('UIAccessibilityPostNotification')?.(
			hostGlobal('UIAccessibilityAnnouncementNotification'),
			message,
		)
	} else {
		view?.nativeViewProtected?.announceForAccessibility?.(message)
	}
}
