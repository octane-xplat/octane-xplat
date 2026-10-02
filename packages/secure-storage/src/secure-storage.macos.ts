// Native APIs are loaded by the CLI's platforms/macos leaf loader.
import type { Capability, SecureStore } from './types'

interface NativeSecureStorage {
	get(key: string): { objectForKey(key: string): unknown }
	set(options: { key: string; value: string }): boolean
	remove(key: string): boolean
}

declare const XplatSecureStorage: NativeSecureStorage | undefined
const native = () => (typeof XplatSecureStorage === 'undefined' ? null : XplatSecureStorage)

const store: SecureStore = {
	async get(key) {
		try {
			const result = native()?.get(key)
			if (!result || result.objectForKey('status') === -25300) {
				return null
			} // errSecItemNotFound

			const value = result.objectForKey('value')
			if (result.objectForKey('status') === 0 && typeof value === 'string') {
				return value
			}
		} catch {
			// Native exceptions may contain arguments. Never forward them.
		}

		throw new Error('Keychain read failed')
	},
	async set(key, value) {
		try {
			return native()?.set({ key, value }) ?? false
		} catch {
			return false
		}
	},
	async remove(key) {
		try {
			return native()?.remove(key) ?? false
		} catch {
			return false
		}
	},
}

export const secureStorage: Capability<SecureStore> = {
	get supported() {
		return native() !== null
	},
	ensure: async () => (native() ? 'granted' : 'unsupported'),
	get impl() {
		return native() ? store : null
	},
}
