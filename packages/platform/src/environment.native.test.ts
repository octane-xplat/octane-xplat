import { describe, expect, it, vi } from 'vitest'
const host = vi.hoisted(() => ({
	listeners: new Map<string, Set<() => void>>(),
	online: true,
	network: new Set<() => void>(),
}))

vi.mock('@nativescript/core', () => ({
	Application: {
		suspended: false,
		suspendEvent: 'suspend',
		resumeEvent: 'resume',
		exitEvent: 'exit',
		on(event: string, listener: () => void) {
			let callbacks = host.listeners.get(event)
			if (!callbacks) {
				host.listeners.set(event, (callbacks = new Set()))
			}
			callbacks.add(listener)
		},
		off(event: string, listener: () => void) {
			host.listeners.get(event)?.delete(listener)
		},
	},
}))

vi.mock('./connectivity', () => ({
	connectivity: {
		getState: () => ({ online: host.online, type: 'unknown' }),
		subscribe(listener: () => void) {
			host.network.add(listener)
			listener()
			return () => {
				host.network.delete(listener)
			}
		},
	},
}))

import { environment } from './environment.ts'
describe('NativeScript service environment', () => {
	it('maps suspend/resume/exit and removes only its own registrations', () => {
		const snapshots: Array<{ active?: boolean; online?: boolean }> = []
		const stop = environment.subscribe((value) => snapshots.push(value))
		for (const listener of host.listeners.get('suspend')!) {
			listener()
		}
		expect(snapshots.at(-1)?.active).toBe(false)
		for (const listener of host.listeners.get('resume')!) {
			listener()
		}
		expect(snapshots.at(-1)?.active).toBe(true)
		host.online = false
		for (const listener of host.network) {
			listener()
		}
		expect(snapshots.at(-1)?.online).toBe(false)
		for (const listener of host.listeners.get('exit')!) {
			listener()
		}
		expect(snapshots.at(-1)?.active).toBe(false)
		stop()
		expect([...host.listeners.values()].every((set) => set.size === 0)).toBe(true)
		expect(host.network.size).toBe(0)
	})
})
