import { Connectivity } from '@nativescript/core'
import type { ConnectivityImpl } from './types'
import { createNativeConnectivity } from './native-connectivity'
import { readWindowsConnectivity } from './connectivity-state'

/** Windows profile state with the shared NativeScript monitor and listener ownership. */
export const connectivity: ConnectivityImpl = createNativeConnectivity(
	Connectivity,
	readWindowsConnectivity,
)
