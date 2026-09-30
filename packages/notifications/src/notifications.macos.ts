// Notifications — AppKit host leaf. UNUserNotificationCenter is not bridged
// on the dev host.
import type { Capability, NotificationsImpl } from './types'

export const notifications: Capability<NotificationsImpl> = {
	supported: false,
	ensure: async () => 'unsupported',
	impl: null,
}
