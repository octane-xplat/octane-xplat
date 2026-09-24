// A11y announce — native leaf. UIAccessibility announcement notification on
// iOS; View.announceForAccessibility on Android (posted on the content view).
import { Application } from '@nativescript/core';

export function announce(text: string): void {
	if (Application.ios) {
		UIAccessibilityPostNotification(UIAccessibilityAnnouncementNotification, text);
		return;
	}
	if (Application.android) {
		const view = Application.android.foregroundActivity?.findViewById?.(16908290 /* android.R.id.content */);
		view?.announceForAccessibility?.(text);
	}
}
