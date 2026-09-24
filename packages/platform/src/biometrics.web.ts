// Biometrics — web leaf. Platform authenticator presence is the honest
// signal; actual WebAuthn ceremony is an auth-flow concern, not this seam.
import type { Capability } from './types';

export interface BiometricsImpl {
	/** Prompt the user to verify (WebAuthn platform authenticator). */
	verify(reason: string): Promise<boolean>;
}

export const biometrics: Capability<BiometricsImpl> = {
	supported: typeof PublicKeyCredential !== 'undefined',
	async ensure() {
		if (typeof PublicKeyCredential === 'undefined') return 'unsupported';
		const ok = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
		return ok ? 'granted' : 'unsupported';
	},
	impl: {
		// A bare verify() has no ceremony target — WebAuthn needs a challenge.
		// Report presence; wire real attestation when an auth flow exists.
		async verify(_reason: string) {
			return false;
		},
	},
};
