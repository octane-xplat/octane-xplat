// Runtime permissions — web leaf. Each kind delegates to its owning service;
// browser feature detection and prompts therefore stay at the platform edge.
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
