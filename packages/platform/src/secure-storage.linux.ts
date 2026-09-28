// Secure storage — Linux leaf. The webview's DOM storage is not a trust
// boundary, but the Secret Service API (org.freedesktop.secrets) is — the
// host bridges to it (NSUserDefaults stands in inside the dev harness).
import { bridged, call } from './bridge'
import type { Capability, SecureStore } from './types'

export const secureStorage: Capability<SecureStore> = {
	get supported() {
		return bridged()
	},
	async ensure() {
		return bridged() ? 'granted' : 'unsupported'
	},
	impl: {
		get: (key) => call<string | null>('secureStorage', 'get', key),
		set: (key, value) => call<boolean>('secureStorage', 'set', key, value),
		remove: (key) => call<boolean>('secureStorage', 'remove', key),
	},
}
