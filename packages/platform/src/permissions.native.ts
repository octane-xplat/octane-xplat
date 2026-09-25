// Runtime permissions — native leaf. Delegate each kind to the service that
// owns its plugin request, so this generic seam cannot drift from reality.
import { geolocation } from './geolocation'
import { media } from './media'
import { notifications } from './notifications'
import type { PermissionKind } from './types'

export const permissions = {
	async ensure(kind: PermissionKind): Promise<'granted' | 'denied' | 'unsupported'> {
		switch (kind) {
			case 'notifications':
				return notifications.ensure()
			case 'camera':
			case 'photos':
				return media.ensure(kind)
			case 'location':
				return geolocation.ensure()
		}
	},
}
