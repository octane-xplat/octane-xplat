// Native APIs are loaded by the CLI's platforms/macos leaf loader.
import { UnavailabilityError } from '@octane-xplat/lib/capability'
import type { Service } from '@octane-xplat/lib/capability'
import type { SecureStore } from './types'

interface NativeSecureStorage {
	get(key: string): { objectForKey(key: string): unknown }
	set(options: { key: string; value: string }): boolean
	remove(key: string): boolean
}

/** Capture one complete bridge and its receivers; lookup can itself throw. */
function native(): NativeSecureStorage | null {
	try {
		const bridge = (globalThis as any).XplatSecureStorage
		if (!bridge) {return null}
		const get = bridge.get, set = bridge.set, remove = bridge.remove
		if (typeof get !== 'function' || typeof set !== 'function' || typeof remove !== 'function') {return null}
		return {
			get: key => get.call(bridge, key),
			set: options => set.call(bridge, options),
			remove: key => remove.call(bridge, key),
		}
	} catch {
		// Lookup exceptions can contain arguments too. Never forward them.
		return null
	}
}

function requireNative(): NativeSecureStorage {
	const store = native()
	if (!store) {throw new UnavailabilityError('secureStorage')}
	return store
}

export const secureStorage: Service<SecureStore> = {
	get supported() { return native() !== null },
	isAvailable: async () => native() !== null,
	async get(key) {
		const store = requireNative()
		try {
			const result = store.get(key), read = result?.objectForKey
			if (typeof read === 'function') {
				const status = read.call(result, 'status')
				if (status === -25300) {return null} // errSecItemNotFound only
				if (status === 0) {
					const value = read.call(result, 'value')
					if (typeof value === 'string') {return value}
				}
			}
		} catch {
			// Native exceptions may contain arguments. Never forward them.
		}

		throw new Error('Keychain read failed')
	},
	async set(key, value) {
		const store = requireNative()
		try { return store.set({ key, value }) === true }
		catch { return false }
	},
	async remove(key) {
		const store = requireNative()
		try { return store.remove(key) === true }
		catch { return false }
	},
}
