// Notifications — local notifications via plugin; push (APNs/FCM) is an
// app-level concern, not this seam.
import { LocalNotifications } from '@nativescript/local-notifications'
import { notificationBody } from './notification-body'
import type { Capability } from './types'
import type { NotificationsImpl } from './types'

// Keep IDs distinct for rapid sends and within Android's signed integer range.
let nextId = Date.now() % 2147483647

export const notifications: Capability<NotificationsImpl> = {
	supported: true,
	async ensure() {
		const granted = await LocalNotifications.requestPermission()
		return granted ? 'granted' : 'denied'
	},
	impl: {
		notify(title, body) {
			const id = nextId
			nextId = (nextId + 1) % 2147483647
			void (async () => {
				if (await LocalNotifications.hasPermission()) {
					await LocalNotifications.schedule([{ id, title, body: notificationBody(body) }])
				}
			})().catch(() => {})
		},
	},
}

const permissionOwners = ((globalThis as any).__xplatPermissionOwners ??= {})
permissionOwners.notifications = () => notifications.ensure()
