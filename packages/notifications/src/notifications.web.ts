// Notifications — desktop webview hosts own local notification delivery;
// outside a host this uses the Web Notification API.
import { desktopHost } from '@octane-xplat/platform/host/web'
import type { Capability, NotificationsImpl } from './types'

export const notifications: Capability<NotificationsImpl> = {
	get supported() {
		return desktopHost() !== null || typeof Notification !== 'undefined'
	},
	async ensure() {
		const host = desktopHost()
		if (host && (await host.supports('notifications', 'ensure'))) {
			return host.notifications.ensure()
		}

		if (typeof Notification === 'undefined') {
			return 'unsupported'
		}

		if (Notification.permission === 'granted') {
			return 'granted'
		}

		if (Notification.permission === 'denied') {
			return 'denied'
		}

		return (await Notification.requestPermission()) === 'granted' ? 'granted' : 'denied'
	},
	impl: {
		notify(title, body) {
			const host = desktopHost()
			if (host) {
				void host.notifications.notify(title, body).catch(() => {})
				return
			}

			if (Notification.permission === 'granted') {
				new Notification(title, { body })
			}
		},
	},
}

const permissionOwners = ((globalThis as any).__xplatPermissionOwners ??= {})
permissionOwners.notifications = () => notifications.ensure()
