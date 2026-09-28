// Notifications — Linux leaf. WebKitGTK does not implement the web
// Notification API, so delivery goes through the host bridge
// (org.freedesktop.Notifications on the session bus). Without a host —
// browser dev against the same server — the capability reports unsupported.
import { bridged, call } from './bridge'
import type { Capability, NotificationsImpl, PermissionResult } from './types'

export const notifications: Capability<NotificationsImpl> = {
	get supported() {
		return bridged()
	},
	async ensure(): Promise<PermissionResult> {
		if (!bridged()) {
			return 'unsupported'
		}

		return call<PermissionResult>('notifications', 'ensure')
	},
	impl: {
		notify(title, body) {
			void call('notifications', 'notify', title, body)
		},
	},
}
