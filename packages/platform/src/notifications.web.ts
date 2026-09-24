// Notifications — Web Notification API. ensure() maps permission state;
// notify() posts an immediate local notification (no push).
import type { Capability, NotificationsImpl } from './types'

export const notifications: Capability<NotificationsImpl> = {
	supported: typeof Notification !== 'undefined',
	async ensure() {
		if (typeof Notification === 'undefined') return 'unsupported'
		if (Notification.permission === 'granted') return 'granted'
		if (Notification.permission === 'denied') return 'denied'
		return (await Notification.requestPermission()) === 'granted' ? 'granted' : 'denied'
	},
	impl: {
		notify(title, body) {
			if (Notification.permission === 'granted') new Notification(title, { body })
		},
	},
}
