// Notifications — local notifications via plugin; push (APNs/FCM) is an
// app-level concern, not this seam.
import { LocalNotifications } from '@nativescript/local-notifications';
import type { Capability } from './types';
import type { NotificationsImpl } from './notifications.web';

export const notifications: Capability<NotificationsImpl> = {
	supported: true,
	async ensure() {
		const granted = await LocalNotifications.requestPermission();
		return granted ? 'granted' : 'denied';
	},
	impl: {
		notify(title, body) {
			LocalNotifications.schedule([{ id: Date.now() % 2147483647, title, body: body ?? '' }]);
		},
	},
};
