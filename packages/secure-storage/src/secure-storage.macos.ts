// Secure storage — AppKit host leaf. The dev host exposes NSUserDefaults,
// which is not a trust boundary, so the capability stays unsupported.
import type { Capability, SecureStore } from './types'

export const secureStorage: Capability<SecureStore> = {
	supported: false,
	ensure: async () => 'unsupported',
	impl: null,
}
