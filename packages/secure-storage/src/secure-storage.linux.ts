// Secure storage — Linux leaf. The webview's DOM storage is not a trust
// boundary, but the Secret Service API (org.freedesktop.secrets) is — the
// host bridges to it (NSUserDefaults stands in inside the dev harness).
// The bridge is the dep-free __xplatBridge global, not a platform import.
import type { Capability, SecureStore } from './types'

const bridge = () => (typeof window !== 'undefined' ? (window as any).__xplatBridge : undefined)

const bridged = () => bridge() !== undefined
const call = <T>(method: string, ...args: unknown[]): Promise<T> =>
	bridge()!.call('secureStorage', method, args) as Promise<T>

export const secureStorage: Capability<SecureStore> = {
	get supported() {
		return bridged()
	},
	async ensure() {
		return bridged() ? 'granted' : 'unsupported'
	},
	impl: {
		get: (key) => call<string | null>('get', key),
		set: (key, value) => call<boolean>('set', key, value),
		remove: (key) => call<boolean>('remove', key),
	},
}
