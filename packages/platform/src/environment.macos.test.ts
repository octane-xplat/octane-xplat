import { afterEach, describe, expect, it, vi } from 'vitest'
const network = vi.hoisted(() => ({
	supported: false,
	online: false,
	listeners: new Set<() => void>(),
}))

vi.mock('./connectivity.macos', () => ({
	connectivity: {
		getState: () => ({ supported: network.supported, online: network.online, type: 'unknown' }),
		subscribe(listener: () => void) {
			network.listeners.add(listener)
			listener()
			return () => {
				network.listeners.delete(listener)
			}
		},
	},
}))

import { environment } from './environment.macos'
afterEach(() => vi.unstubAllGlobals())
describe('AppKit service environment', () => {
	it('does not turn an unsupported connectivity host into known offline', () => {
		vi.stubGlobal('__xplatAppKit', undefined)
		expect(environment.getSnapshot()).toEqual({
			online: undefined,
			active: undefined,
			capabilities: { connectivity: false, activity: false },
		})
	})
	it('reads live app state and tears down connectivity and activity listeners', () => {
		let appListener: (() => void) | undefined
		const app = {
			appState: 'active',
			onAppStateChange(listener: () => void) {
				appListener = listener
				return () => {
					appListener = undefined
				}
			},
		}
		vi.stubGlobal('__xplatAppKit', app)
		network.supported = true
		network.online = true
		const snapshots: Array<{ active?: boolean; online?: boolean }> = []
		const stop = environment.subscribe((value) => snapshots.push(value))
		app.appState = 'background'
		appListener!()
		expect(snapshots.at(-1)?.active).toBe(false)
		stop()
		expect(appListener).toBeUndefined()
		expect(network.listeners.size).toBe(0)
	})
})
