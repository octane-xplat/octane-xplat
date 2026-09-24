// Biometrics — FaceID/TouchID/fingerprint via @nativescript/biometrics.
import { BiometricAuth } from '@nativescript/biometrics';
import type { Capability } from './types';
import type { BiometricsImpl } from './biometrics.web';

const bio = new BiometricAuth();

export const biometrics: Capability<BiometricsImpl> = {
	supported: true,
	async ensure() {
		const r = await bio.available();
		return r.any ? 'granted' : 'unsupported';
	},
	impl: {
		async verify(reason) {
			try {
				const r = await bio.verifyBiometric({ title: reason });
				return r.code === 0;
			} catch {
				return false;
			}
		},
	},
};
