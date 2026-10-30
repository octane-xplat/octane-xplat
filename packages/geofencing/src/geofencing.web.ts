// Geofencing — no web region API exists; honest unsupported leaf.
import type { Geofencing, PermissionResult } from './types'

const unsupported = () => Promise.reject(new Error('unsupported: no geofencing API on web'))

/** Geofence-monitoring service — see Geofencing. */
export const geofencing: Geofencing = {
	supported: false,
	ensure: async (): Promise<PermissionResult> => 'unsupported',
	ensureBackground: async (): Promise<PermissionResult> => 'unsupported',
	startMonitoring: unsupported,
	stopMonitoring: unsupported,
	getMonitoredRegions: unsupported,
	onRegionEvent: () => () => {},
}
