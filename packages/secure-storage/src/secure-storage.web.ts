// Secure storage — plain web has no equivalent trust boundary. Desktop
// webview hosts can provide one through the typed host bridge.
import { desktopHost } from '@octane-xplat/platform/host/web'
import type { Capability, SecureStore } from './types'

const hostStore: SecureStore = {
	get: (key) => desktopHost()?.secureStorage.get(key) ?? Promise.resolve(null),
	set: (key, value) => desktopHost()?.secureStorage.set(key, value) ?? Promise.resolve(false),
	remove: (key) => desktopHost()?.secureStorage.remove(key) ?? Promise.resolve(false),
}

export const secureStorage: Capability<SecureStore> = {
	get supported() {
		return desktopHost() !== null
	},
	async ensure() {
		const host = desktopHost()
		return host && (await host.supports('secureStorage', 'get')) ? 'granted' : 'unsupported'
	},
	get impl() {
		return desktopHost() ? hostStore : null
	},
}
