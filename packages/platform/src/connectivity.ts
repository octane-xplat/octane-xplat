// Connectivity — native leaf. NativeScript exposes this through @nativescript/core;
// it is a built-in service rather than a separate @nativescript/connectivity plugin.
import { Connectivity } from '@nativescript/core'
import type { ConnectionType, ConnectivityImpl, ConnectivityState } from './types'

const listeners = new Set<(state: ConnectivityState) => void>()
let monitoring = false

function connectionType(value = Connectivity.getConnectionType()): ConnectionType {
	const types = Connectivity.connectionType as any
	if (value === types.none) {
		return 'none'
	}

	if (value === types.wifi) {
		return 'wifi'
	}

	if (value === types.mobile) {
		return 'mobile'
	}

	if (value === types.ethernet) {
		return 'ethernet'
	}

	if (value === types.bluetooth) {
		return 'bluetooth'
	}

	if (value === types.vpn) {
		return 'vpn'
	}

	return 'unknown'
}

function read(): ConnectivityState {
	const type = connectionType()
	return { online: type !== 'none', type }
}

function notify(value: number) {
	if (listeners.size === 0) {
		return
	}

	const type = connectionType(value)
	const state = { online: type !== 'none', type }
	for (const listener of Array.from(listeners)) {
		if (listeners.has(listener)) {
			listener(state)
		}
	}
}

function startMonitoring() {
	if (monitoring) {
		return
	}

	monitoring = true
	try {
		Connectivity.startMonitoring(notify)
	} catch (error) {
		monitoring = false
		try {
			Connectivity.stopMonitoring()
		} catch {
			// Rollback must preserve the original startup failure.
		}

		throw error
	}
}

function stopMonitoring() {
	if (!monitoring) {
		return
	}

	monitoring = false
	Connectivity.stopMonitoring()
}

export const connectivity: ConnectivityImpl = {
	getState: read,
	subscribe(listener) {
		// A repeated callback still owns a distinct subscription and teardown.
		const callback = (state: ConnectivityState) => listener(state)
		listeners.add(callback)
		try {
			callback(read())
			startMonitoring()
		} catch (error) {
			listeners.delete(callback)
			if (listeners.size === 0) {
				try {
					stopMonitoring()
				} catch {}
			}

			throw error
		}
		return () => {
			if (!listeners.delete(callback)) {
				return
			}
			if (listeners.size === 0) {
				stopMonitoring()
			}
		}
	},
}
