// Secure storage — plain web has no equivalent trust boundary. Desktop
// webview hosts can provide one through the typed host bridge.
import { UnavailabilityError } from '@octane-xplat/lib/capability'
import type { Service } from '@octane-xplat/lib/capability'
import { desktopHost } from '@octane-xplat/platform/host/web'
import type { SecureStore } from './types'

const unavailable = () => Promise.reject(new UnavailabilityError('secureStorage'))

const hostStore: SecureStore = {
	get: (key) => desktopHost()?.secureStorage.get(key) ?? unavailable(),
	set: (key, value) => desktopHost()?.secureStorage.set(key, value) ?? unavailable(),
	remove: (key) => desktopHost()?.secureStorage.remove(key) ?? unavailable(),
}

export const secureStorage: Service<SecureStore> = {
	get supported() {
		return desktopHost() !== null
	},
	async isAvailable() {
		const host = desktopHost()
		return host !== null && (await host.supports('secureStorage', 'get'))
	},
	get: (key) => hostStore.get(key),
	set: (key, value) => hostStore.set(key, value),
	remove: (key) => hostStore.remove(key),
}
