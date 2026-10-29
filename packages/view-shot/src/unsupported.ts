import { UnavailabilityError } from '@octane-xplat/lib/capability'
import type { CaptureBackend } from './backend-types'
const unavailable = (): never => {
	throw new UnavailabilityError('App view capture on this host')
}
export const backend: CaptureBackend = {
	capabilities: () => ({ view: false, screen: false, formats: [], scrollContent: false }),
	validate: unavailable,
	capture: async () => unavailable(),
	captureScreen: async () => unavailable(),
	// This backend has never created a URI, so it cannot own a cleanup request.
	release() {},
	waitForLayout: async () => unavailable(),
}
