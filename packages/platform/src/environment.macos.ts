import { host } from './appkit-host'
import { connectivity } from './connectivity.macos'
import type { RuntimeEnvironment } from './environment-types'
export type { RuntimeEnvironment, RuntimeEnvironmentSnapshot } from './environment-types'

/** AppKit host activity and Network framework connectivity, with explicit absent capabilities. */
export const environment: RuntimeEnvironment = {
	getSnapshot() {
		const network = connectivity.getState()
		const app = host()
		return {
			online: network.supported === false ? undefined : network.online,
			active:
				app.appState === undefined || !app.onAppStateChange ? undefined : app.appState === 'active',
			capabilities: {
				connectivity: network.supported !== false,
				activity: app.onAppStateChange !== undefined && app.appState !== undefined,
			},
		}
	},
	subscribe(listener) {
		const notify = () => listener(environment.getSnapshot())
		const stopApp = host().onAppStateChange?.(notify)
		const stopNetwork = connectivity.subscribe(notify)
		return () => {
			stopNetwork()
			stopApp?.()
		}
	},
}
