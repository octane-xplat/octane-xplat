// Runtime permissions — native leaf. Maps the shared kind union onto the
// owning plugin's request call; add kinds as services land.
import { LocalNotifications } from '@nativescript/local-notifications'
import type { PermissionKind } from './types'

export const permissions = {
	async ensure(kind: PermissionKind): Promise<'granted' | 'denied' | 'unsupported'> {
		switch (kind) {
			case 'notifications':
				return (await LocalNotifications.requestPermission()) ? 'granted' : 'denied'
			// camera/photos/location have dedicated plugins — the owning
			// service leaf (media, geolocation) owns its own ensure(); this
			// generic seam reports them unsupported until wired.
			case 'camera':
			case 'photos':
			case 'location':
				return 'unsupported'
		}
	},
}
