// Secure storage — Keychain (iOS) / Keystore (Android) via plugin.
import { SecureStorage } from '@nativescript/secure-storage';
import type { Capability } from './types';
import type { SecureStore } from './types';

const store = new SecureStorage();

export const secureStorage: Capability<SecureStore> = {
	supported: true,
	// No runtime permission needed — Keychain/Keystore is device-owned.
	ensure: async () => 'granted',
	impl: {
		get: (key) => store.get({ key }).then((v) => v ?? null),
		set: (key, value) => store.set({ key, value }),
		remove: (key) => store.remove({ key }),
	},
};
