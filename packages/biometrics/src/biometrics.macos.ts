// Biometrics — AppKit host leaf. No LocalAuthentication bridge exists on the
// dev host.
import type { Capability, BiometricsImpl } from './types'

export const biometrics: Capability<BiometricsImpl> = {
	supported: false,
	ensure: async () => 'unsupported',
	impl: null,
}
