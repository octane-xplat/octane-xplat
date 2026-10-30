// Connectivity — native leaf. NativeScript exposes this through @nativescript/core;
// it is a built-in service rather than a separate @nativescript/connectivity plugin.
import { Connectivity } from '@nativescript/core'
import type { ConnectionType, ConnectivityImpl, ConnectivityState } from './types'
import { createNativeConnectivity } from './native-connectivity'

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

function read(value?: number): ConnectivityState {
	const type = connectionType(value)
	return { online: type !== 'none', type }
}

/** Network connectivity service. */
export const connectivity: ConnectivityImpl = createNativeConnectivity(Connectivity, read)
