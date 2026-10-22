import { connectivity } from './connectivity.web'
import { desktopHostBootstrap, desktopHostClient } from './host-runtime.web'
import type { RuntimeEnvironment, RuntimeEnvironmentSnapshot } from './environment-types'
export type { RuntimeEnvironment, RuntimeEnvironmentSnapshot } from './environment-types'

/** Browser visibility/connectivity, or desktop WebView host activity when connected. */
export const environment: RuntimeEnvironment = {
	getSnapshot() {
		const network =
			typeof navigator === 'undefined' || typeof navigator.onLine !== 'boolean'
				? undefined
				: connectivity.getState()
		const state = typeof document === 'undefined' ? undefined : desktopHostBootstrap()?.appState
		return {
			online: network?.online,
			active:
				typeof document === 'undefined'
					? undefined
					: state
						? state === 'active'
						: document.visibilityState === 'visible',
			capabilities: {
				connectivity: network !== undefined,
				activity: typeof document !== 'undefined',
			},
		}
	},
	subscribe(listener) {
		if (typeof window === 'undefined' || typeof document === 'undefined') {
			listener(environment.getSnapshot())
			return () => {}
		}
		let active = environment.getSnapshot().active
		const snapshot = (): RuntimeEnvironmentSnapshot => ({ ...environment.getSnapshot(), active })
		const network = () => listener(snapshot())
		const visibility = () => {
			active = document.visibilityState === 'visible'
			listener(snapshot())
		}
		const hide = () => {
			active = false
			listener(snapshot())
		}
		const host = desktopHostClient()
		const stopHost = host?.on('app.state.change', (state) => {
			active = state === 'active'
			listener(snapshot())
		})
		if (!host) {
			document.addEventListener('visibilitychange', visibility)
			window.addEventListener('pageshow', visibility)
			window.addEventListener('pagehide', hide)
		}
		const stopNetwork = connectivity.subscribe(network)
		return () => {
			stopNetwork()
			stopHost?.()
			document.removeEventListener('visibilitychange', visibility)
			window.removeEventListener('pageshow', visibility)
			window.removeEventListener('pagehide', hide)
		}
	},
}
