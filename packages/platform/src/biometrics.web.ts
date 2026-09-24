// Biometrics — web leaf. Platform authenticator presence is the honest
// signal; an actual WebAuthn ceremony is an auth-flow concern, not this seam.
import type { BiometricsImpl, Capability } from './types'

const pkc = () => (globalThis as any).PublicKeyCredential

export const biometrics: Capability<BiometricsImpl> = {
	supported: typeof pkc() !== 'undefined',
	async ensure() {
		if (!pkc()) return 'unsupported'
		const ok = await pkc().isUserVerifyingPlatformAuthenticatorAvailable()
		return ok ? 'granted' : 'unsupported'
	},
	impl: {
		// A bare verify() has no ceremony target — WebAuthn needs a challenge.
		// Report presence; wire real attestation when an auth flow exists.
		async verify(_reason: string) {
			return false
		},
	},
}
