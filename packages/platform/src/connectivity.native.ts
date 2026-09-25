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
	for (const listener of listeners) {
		listener(state)
	}
}

function startMonitoring() {
	if (monitoring) {
		return
	}

	Connectivity.startMonitoring(notify)
	monitoring = true
}

function stopMonitoring() {
	if (!monitoring) {
		return
	}

	Connectivity.stopMonitoring()
	monitoring = false
}

export const connectivity: ConnectivityImpl = {
	getState: read,
	subscribe(listener) {
		listeners.add(listener)
		listener(read())
		startMonitoring()
		return () => {
			listeners.delete(listener)
			if (listeners.size === 0) {
				stopMonitoring()
			}
		}
	},
}
