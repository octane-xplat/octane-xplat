import type { TrackingBackend } from './backend-types'
/** Expo's no-ATT-gate result is granted. It does not assert user consent. */
export const backend: TrackingBackend = {
	capabilities: () => ({ prompt: false, advertisingId: false, advertisingIdAsync: false }),
	read: () => -1,
	async request() {
		return -1
	},
	advertisingId: () => null,
	async advertisingIdAsync() {
		return null
	},
}
