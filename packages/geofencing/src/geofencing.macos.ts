import type { Geofencing, PermissionResult } from './types'

const unsupported = () => Promise.reject(new Error('unsupported: geofencing is not wired on this platform'))

export const geofencing: Geofencing = {
	supported: false,
	ensure: async (): Promise<PermissionResult> => 'unsupported',
	ensureBackground: async (): Promise<PermissionResult> => 'unsupported',
	startMonitoring: unsupported,
	stopMonitoring: unsupported,
	getMonitoredRegions: unsupported,
	onRegionEvent: () => () => {},
}
