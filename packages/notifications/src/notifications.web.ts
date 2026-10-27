// Notifications — desktop webview hosts own local notification delivery;
// outside a host this uses the Web Notification API.
import { UnavailabilityError } from '@octane-xplat/lib/capability'
import type { Permissioned, PermissionResponse } from '@octane-xplat/lib/capability'
import { desktopHost } from '@octane-xplat/platform/host/web'
import type { NotificationsImpl } from './types'

const dom = () => typeof Notification !== 'undefined'

const fromStatus = (status: string): PermissionResponse => ({
	status: status as PermissionResponse['status'],
	granted: status === 'granted',
	// Denied web permissions can only be reset in browser UI.
	canAskAgain: status === 'granted' || status === 'undetermined',
})

// The host wire carries only ensure() — probing there may prompt.
async function hostPermissions() {
	const host = desktopHost()
	if (host && (await host.supports('notifications', 'ensure'))) {
		return fromStatus(await host.notifications.ensure())
	}

	return null
}

export const notifications: Permissioned<NotificationsImpl> = {
	get supported() {
		return desktopHost() !== null || dom()
	},
	async isAvailable() {
		const host = desktopHost()
		return host !== null ? await host.supports('notifications', 'notify') : dom()
	},
	async getPermissions() {
		const hosted = await hostPermissions()
		if (hosted) {
			return hosted
		}

		if (!dom()) {
			return fromStatus('unsupported')
		}

		return fromStatus(Notification.permission)
	},
	async requestPermissions() {
		const hosted = await hostPermissions()
		if (hosted) {
			return hosted
		}

		if (!dom()) {
			return fromStatus('unsupported')
		}

		return fromStatus(await Notification.requestPermission())
	},
	notify(title, body) {
		const host = desktopHost()
		if (host) {
			void host.notifications.notify(title, body).catch(() => {})
			return
		}

		if (!dom()) {
			throw new UnavailabilityError('notifications')
		}

		if (Notification.permission === 'granted') {
			new Notification(title, { body })
		}
	},
}

const permissionOwners = ((globalThis as any).__xplatPermissionOwners ??= {})
permissionOwners.notifications = {
	getPermissions: () => notifications.getPermissions(),
	requestPermissions: () => notifications.requestPermissions(),
}
