// AppKit accepts NSApplication as the announcement element. Using the app
// avoids retaining a window or targeting a window that has already closed.

import {
	NSAccessibilityAnnouncementKey,
	NSAccessibilityAnnouncementRequestedNotification,
	NSAccessibilityPostNotificationWithUserInfo,
	NSAccessibilityPriorityKey,
	NSAccessibilityPriorityLevel,
	NSApplication,
} from '@octane-xplat/platform/macos'

export function announceAppKit(text: string, app: NSApplication) {
	if (!text.trim()) {
		return
	}

	NSAccessibilityPostNotificationWithUserInfo(
		app,
		NSAccessibilityAnnouncementRequestedNotification,
		{
			[NSAccessibilityAnnouncementKey]: text,
			[NSAccessibilityPriorityKey]: NSAccessibilityPriorityLevel.Medium,
		},
	)
}
