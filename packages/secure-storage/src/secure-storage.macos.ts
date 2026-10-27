// Native APIs are loaded by the CLI's platforms/macos leaf loader.
import { UnavailabilityError } from '@octane-xplat/lib/capability'
import type { Service } from '@octane-xplat/lib/capability'
import type { SecureStore } from './types'

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

const unavailable = () => Promise.reject(new UnavailabilityError('secureStorage'))

export const secureStorage: Service<SecureStore> = {
	get supported() {
		return native() !== null
	},
	isAvailable: async () => native() !== null,
	get: (key) => (native() ? store.get(key) : unavailable()),
	set: (key, value) => (native() ? store.set(key, value) : unavailable()),
	remove: (key) => (native() ? store.remove(key) : unavailable()),
}
