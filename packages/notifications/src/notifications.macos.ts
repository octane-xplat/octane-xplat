// The CLI builds platforms/macos and exposes this class through native metadata.
import type { Capability, NotificationsImpl, PermissionResult } from './types'

declare const XplatLocalNotifications: {
	isAvailable(): boolean
	ensure(completion: (result: PermissionResult) => void): void
	notifyBody(title: string, body: string): void
}

const available = () =>
	typeof XplatLocalNotifications !== 'undefined' && XplatLocalNotifications.isAvailable()

const impl: NotificationsImpl = {
	notify(title, body) {
		if (available()) {
			XplatLocalNotifications.notifyBody(title, body ?? '')
		}
	},
}

/** Local macOS notifications; permission is requested explicitly by ensure(). */
export const notifications: Capability<NotificationsImpl> = {
	get supported() {
		return available()
	},
	async ensure() {
		if (!available()) {
			return 'unsupported'
		}

		return new Promise<PermissionResult>((resolve) => {
			XplatLocalNotifications.ensure(resolve)
		})
	},
	get impl() {
		return available() ? impl : null
	},
}

const permissionOwners = ((globalThis as any).__xplatPermissionOwners ??= {})
permissionOwners.notifications = () => notifications.ensure()
