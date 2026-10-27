// Notifications — local notifications via plugin; push (APNs/FCM) is an
// app-level concern, not this seam.
import { LocalNotifications } from '@nativescript/local-notifications'
import type { Permissioned, PermissionResponse } from '@octane-xplat/lib/capability'
import { notificationBody } from './notification-body'
import type { NotificationsImpl } from './types'

// Keep IDs distinct for rapid sends and within Android's signed integer range.
let nextId = Date.now() % 2147483647

const respond = (granted: boolean, canAskAgain: boolean): PermissionResponse => ({
	status: granted ? 'granted' : 'denied',
	granted,
	canAskAgain,
})

export const notifications: Permissioned<NotificationsImpl> = {
	supported: true,
	isAvailable: async () => true,
	async getPermissions() {
		// The plugin exposes only a boolean — 'undetermined' reads as 'denied'.
		return respond(await LocalNotifications.hasPermission(), true)
	},
	async requestPermissions() {
		const granted = await LocalNotifications.requestPermission()
		// A request denial is permanent on iOS and cannot be re-prompted.
		return respond(granted, granted)
	},
	notify(title, body) {
		const id = nextId
		nextId = (nextId + 1) % 2147483647
		void (async () => {
			if (await LocalNotifications.hasPermission()) {
				// The plugin schedules a fixed ~2s trigger on iOS, so mobile
				// delivery lags the immediate macOS/web path — a documented
				// plugin limitation, not something this package can schedule away.
				await LocalNotifications.schedule([{ id, title, body: notificationBody(body) }])
			}
		})().catch(() => {})
	},
}

const permissionOwners = ((globalThis as any).__xplatPermissionOwners ??= {})
permissionOwners.notifications = {
	getPermissions: () => notifications.getPermissions(),
	requestPermissions: () => notifications.requestPermissions(),
}
