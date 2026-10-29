import { afterEach, describe, expect, it, vi } from 'vitest'
const network = vi.hoisted(() => ({
	supported: false,
	online: false,
	startFailure: false, stopFailure: false, reads: 0, stops: 0,
	listeners: new Set<() => void>(),
}))

vi.mock('./connectivity.macos', () => ({
	connectivity: {
		getState: () => {
			network.reads++
			return { supported: network.supported, online: network.online, type: 'unknown' }
		},
		subscribe(listener: (state: { supported: boolean; online: boolean; type: 'unknown' }) => void) {
			if (network.startFailure) throw new Error('network acquisition failed')
			const notify = () => listener({ supported: network.supported, online: network.online, type: 'unknown' })
			network.listeners.add(notify)
			notify()
			return () => {
				network.stops++
				network.listeners.delete(notify)
				if (network.stopFailure) throw new Error('network cleanup failed')
			}
		},
	},
}))

import { environment } from './environment.macos'
afterEach(() => {
	vi.unstubAllGlobals()
	network.listeners.clear()
	network.supported = network.online = network.startFailure = network.stopFailure = false
	network.reads = network.stops = 0
})
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
	it('releases activity and network when the initial consumer throws after synchronous registration events', () => {
		let appListener: (() => void) | undefined
		let removed = 0
		vi.stubGlobal('__xplatAppKit', {
			appState: 'active',
			onAppStateChange(listener: () => void) {
				appListener = listener
				listener()
				return () => { removed++; appListener = undefined }
			},
		})
		expect(() => environment.subscribe(() => { throw new Error('consumer failed') })).toThrow('consumer failed')
		expect(removed).toBe(1)
		expect(appListener).toBeUndefined()
		expect(network.listeners.size).toBe(0)
		expect(network.stops).toBe(1)
	})
	it('releases activity after network acquisition fails', () => {
		let removed = 0
		vi.stubGlobal('__xplatAppKit', {
			appState: 'active', onAppStateChange: () => () => { removed++ },
		})
		network.startFailure = true
		expect(() => environment.subscribe(() => {})).toThrow('network acquisition failed')
		expect(removed).toBe(1)
		expect(network.listeners.size).toBe(0)
	})
	it('attempts every cleanup once and retires held callbacks before throwing', () => {
		let appListener: (() => void) | undefined
		let removed = 0, deliveries = 0
		vi.stubGlobal('__xplatAppKit', {
			appState: 'active',
			onAppStateChange(listener: () => void) {
				appListener = listener
				return () => { removed++; listener(); throw new Error('app cleanup failed') }
			},
		})
		const stop = environment.subscribe(() => { deliveries++ })
		const heldNetwork = [...network.listeners][0]!
		network.stopFailure = true
		expect(stop).toThrow('network cleanup failed')
		expect(removed).toBe(1)
		expect(network.stops).toBe(1)
		expect(stop).not.toThrow()
		appListener!(); heldNetwork()
		expect(deliveries).toBe(1)
	})
	it('emits once after acquisition and uses network samples without redundant synchronous reads', () => {
		let appListener: (() => void) | undefined
		const app = {
			appState: 'active',
			onAppStateChange(listener: () => void) {
				expect(this).toBe(app)
				appListener = listener
				listener()
				return () => {}
			},
		}
		vi.stubGlobal('__xplatAppKit', app)
		network.supported = network.online = true
		const snapshots: Array<{ online?: boolean; active?: boolean }> = []
		const stop = environment.subscribe((value) => snapshots.push(value))
		expect(snapshots).toHaveLength(1)
		network.online = false
		for (const notify of network.listeners) notify()
		app.appState = 'background'
		appListener!()
		expect(snapshots.at(-1)).toMatchObject({ online: false, active: false })
		expect(network.reads).toBe(0)
		stop()
	})
	it('ignores retired app hooks and isolates native activity consumer errors', () => {
		let appListener: (() => void) | undefined
		const app = {
			appState: 'active',
			onAppStateChange(listener: () => void) { appListener = listener; return () => {} },
		}
		vi.stubGlobal('__xplatAppKit', app)
		let calls = 0
		const stop = environment.subscribe(() => { if (++calls > 1) throw new Error('consumer failed') })
		expect(() => appListener!()).not.toThrow()
		expect(calls).toBe(2)
		app.onAppStateChange = () => () => {}
		appListener!()
		expect(calls).toBe(2)
		stop()
	})

})
