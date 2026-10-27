// Secure storage — Keychain (iOS) / Keystore (Android) via plugin.
import { SecureStorage } from '@nativescript/secure-storage'
import type { Service } from '@octane-xplat/lib/capability'
import type { SecureStore } from './types'

const store = new SecureStorage()

// No runtime permission needed — Keychain/Keystore is device-owned.
export const secureStorage: Service<SecureStore> = {
	supported: true,
	isAvailable: async () => true,
	get: (key) => store.get({ key }).then((v) => v ?? null),
	set: (key, value) => store.set({ key, value }),
	remove: (key) => store.remove({ key }),
}
