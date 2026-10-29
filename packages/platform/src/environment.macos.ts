import { host } from './appkit-host'
import { connectivity } from './connectivity.macos'
import type { ConnectivityState } from './types'
import type { RuntimeEnvironment } from './environment-types'
export type { RuntimeEnvironment, RuntimeEnvironmentSnapshot } from './environment-types'

function snapshot(network: ConnectivityState) {
	const app = host()
	const activity = typeof app.onAppStateChange === 'function' && app.appState !== undefined
	return {
		online: network.supported === false ? undefined : network.online,
		active: activity ? app.appState === 'active' : undefined,
		capabilities: { connectivity: network.supported !== false, activity },
	}
}

/** AppKit host activity and Network connectivity; absent capabilities stay unknown. */
export const environment: RuntimeEnvironment = {
	getSnapshot() {
		return snapshot(connectivity.getState())
	},
	subscribe(listener) {
		const app = host()
		const subscribeApp = app.onAppStateChange
		let active = true, registering = true
		let network: ConnectivityState | undefined
		let stopApp: (() => void) | undefined, stopNetwork: (() => void) | undefined
		const stop = () => {
			if (!active) return
			active = false
			const cleanups = [stopNetwork, stopApp]
			stopNetwork = stopApp = undefined
			let failure: unknown
			let failed = false
			for (const cleanup of cleanups) {
				try { cleanup?.() } catch (error) {
					if (!failed) { failed = true; failure = error }
				}
			}
			if (failed) throw failure
		}
		try {
			if (typeof subscribeApp === 'function') {
				stopApp = subscribeApp.call(app, () => {
					if (!active || registering || host() !== app || app.onAppStateChange !== subscribeApp) return
					try { listener(snapshot(network ?? connectivity.getState())) } catch {
						// Native activity delivery must not block unrelated app listeners.
					}
				})
			}
			stopNetwork = connectivity.subscribe((state) => {
				if (!active) return
				network = state
				if (!registering) listener(snapshot(state))
			})
			registering = false
			// Publish once, after both cleanup handles have been acquired.
			listener(snapshot(network ?? connectivity.getState()))
		} catch (error) {
			try { stop() } catch { /* Preserve the original acquisition/listener error. */ }
			throw error
		}
		return stop
	},
}
