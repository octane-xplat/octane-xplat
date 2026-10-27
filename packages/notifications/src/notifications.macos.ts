// The CLI builds platforms/macos and exposes this class through native metadata.
import { UnavailabilityError } from '@octane-xplat/lib/capability'
import type { Permissioned, PermissionResponse } from '@octane-xplat/lib/capability'
import type { NotificationsImpl } from './types'

declare const XplatLocalNotifications: {
	isAvailable(): boolean
	ensure(completion: (result: 'granted' | 'denied' | 'unsupported') => void): void
	notifyBody(title: string, body: string): void
}

const available = () =>
	typeof XplatLocalNotifications !== 'undefined' && XplatLocalNotifications.isAvailable()

// The native seam carries only ensure() — probing may prompt.
const ensure = (): Promise<PermissionResponse> =>
	!available()
		? Promise.resolve({ status: 'unsupported', granted: false, canAskAgain: false })
		: new Promise((resolve) => {
				XplatLocalNotifications.ensure((status) =>
					resolve({
						status,
						granted: status === 'granted',
						canAskAgain: status === 'granted',
					}),
				)
			})

/** Local macOS notifications; permission is requested via requestPermissions(). */
export const notifications: Permissioned<NotificationsImpl> = {
	get supported() {
		return available()
	},
	isAvailable: async () => available(),
	getPermissions: ensure,
	requestPermissions: ensure,
	notify(title, body) {
		if (!available()) {
			throw new UnavailabilityError('notifications')
		}

		XplatLocalNotifications.notifyBody(title, body ?? '')
	},
}

const permissionOwners = ((globalThis as any).__xplatPermissionOwners ??= {})
permissionOwners.notifications = {
	getPermissions: () => notifications.getPermissions(),
	requestPermissions: () => notifications.requestPermissions(),
}
