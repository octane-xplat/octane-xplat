import { Application } from '@nativescript/core'
import { connectivity } from './connectivity'
import type { RuntimeEnvironment } from './environment-types'
export type { RuntimeEnvironment, RuntimeEnvironmentSnapshot } from './environment-types'

/** NativeScript connectivity and app-wide suspend/resume state, attached on subscription. */
export const environment: RuntimeEnvironment = {
	getSnapshot() {
		const network = connectivity.getState()
		return {
			online: network.supported === false ? undefined : network.online,
			active: !Application.suspended,
			capabilities: { connectivity: network.supported !== false, activity: true },
		}
	},
	subscribe(listener) {
		let active = !Application.suspended
		const notify = () => listener({ ...environment.getSnapshot(), active })
		const suspend = () => {
			active = false
			notify()
		}
		const resume = () => {
			active = true
			notify()
		}
		Application.on(Application.suspendEvent, suspend)
		Application.on(Application.resumeEvent, resume)
		Application.on(Application.exitEvent, suspend)
		const removeApp = () => {
			Application.off(Application.suspendEvent, suspend)
			Application.off(Application.resumeEvent, resume)
			Application.off(Application.exitEvent, suspend)
		}
		let stopNetwork: () => void
		try {
			stopNetwork = connectivity.subscribe(notify)
		} catch (error) {
			removeApp()
			throw error
		}
		return () => {
			try {
				stopNetwork()
			} finally {
				removeApp()
			}
		}
	},
}
