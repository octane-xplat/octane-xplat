// Biometrics — web leaf. WebAuthn is an authentication ceremony, not a
// standalone local-presence API: it requires an RP challenge and a registered
// credential, and may require a user gesture. Do not claim it implements the
// native verify(reason) contract by creating an ephemeral passkey.
import type { BiometricsImpl, Capability } from './types'

export const biometrics: Capability<BiometricsImpl> = {
	supported: false,
	async ensure() {
		return 'unsupported'
	},
	impl: null,
}
