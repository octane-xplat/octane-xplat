export type PermissionResult = 'granted' | 'denied' | 'unsupported'

export interface GeofenceRegion {
	identifier: string
	latitude: number
	longitude: number
	/** Meters — iOS caps regions at 20 per app and clamps tiny radii. */
	radius: number
	notifyOnEnter?: boolean
	notifyOnExit?: boolean
}

export interface RegionEvent {
	identifier: string
	eventType: 'enter' | 'exit'
}

export type RegionEventListener = (event: RegionEvent) => void

export interface Geofencing {
	readonly supported: boolean
	/** Foreground ('when in use') location grant. */
	ensure(): Promise<PermissionResult>
	/** Background ('always') location grant — required for suspended delivery
	 *  (iOS Always, Android ACCESS_BACKGROUND_LOCATION). */
	ensureBackground(): Promise<PermissionResult>
	startMonitoring(regions: GeofenceRegion[]): Promise<void>
	stopMonitoring(identifiers?: string[]): Promise<void>
	getMonitoredRegions(): Promise<GeofenceRegion[]>
	/** Events delivered while the app was suspended are buffered and replayed
	 *  to the next registered listener (same constraint as expo-task-manager). */
	onRegionEvent(listener: RegionEventListener): () => void
}

export declare const geofencing: Geofencing
