import { UnavailabilityError } from '@octane-xplat/lib/capability'
import type { OrientationBackend } from './backend-types'
const unavailable = (): never => {
	throw new UnavailabilityError('Screen orientation on this host')
}
export const backend: OrientationBackend = {
	capabilities: () => ({ observe: false, lock: false }),
	info: unavailable,
	policy: unavailable,
	platformPolicy: unavailable,
	supports: () => false,
	lock: async () => unavailable(),
	unlock: async () => unavailable(),
	lockPlatform: async () => unavailable(),
	subscribe: unavailable,
	iosSupportedOrientations: unavailable,
}
