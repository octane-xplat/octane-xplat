/** Coarse permission answer; 'unsupported' means the platform has no such
 *  permission concept or no geofencing backend. */
export type PermissionResult = 'granted' | 'denied' | 'unsupported'

/** A circular monitored region. */
export interface GeofenceRegion {
	/** App-chosen id — reported back on RegionEvent and used by stopMonitoring. */
	identifier: string
	/** Center latitude, WGS-84 degrees. */
	latitude: number
	/** Center longitude, WGS-84 degrees. */
	longitude: number
	/** Meters — iOS caps regions at 20 per app and clamps tiny radii. */
	radius: number
	/** Deliver enter transitions. Defaults per platform (iOS requires at least
	 *  one of enter/exit). */
	notifyOnEnter?: boolean
	/** Deliver exit transitions. */
	notifyOnExit?: boolean
}

/** A delivered region transition. */
export interface RegionEvent {
	/** The GeofenceRegion.identifier that transitioned. */
	identifier: string
	/** Which way the boundary was crossed. */
	eventType: 'enter' | 'exit'
}

/** Callback for region transitions; may be replayed for suspended delivery. */
export type RegionEventListener = (event: RegionEvent) => void

/** OS geofence-monitoring façade (CLLocationManager regions /
 *  GeofencingClient). Monitoring persists across app suspension — events
 *  arriving while suspended are buffered for the next listener. */
export interface Geofencing {
	/** Synchronous fast check — a geofencing backend exists. */
	readonly supported: boolean
	/** Foreground ('when in use') location grant. */
	ensure(): Promise<PermissionResult>
	/** Background ('always') location grant — required for suspended delivery
	 *  (iOS Always, Android ACCESS_BACKGROUND_LOCATION). */
	ensureBackground(): Promise<PermissionResult>
	/** Begin monitoring a set of regions. iOS enforces a 20-region per-app
	 *  cap — this replaces nothing implicitly; call stopMonitoring to free slots. */
	startMonitoring(regions: GeofenceRegion[]): Promise<void>
	/** Stop monitoring the given regions, or every region when omitted. */
	stopMonitoring(identifiers?: string[]): Promise<void>
	/** Currently monitored regions. */
	getMonitoredRegions(): Promise<GeofenceRegion[]>
	/** Events delivered while the app was suspended are buffered and replayed
	 *  to the next registered listener (same constraint as expo-task-manager). */
	onRegionEvent(listener: RegionEventListener): () => void
}

export declare const geofencing: Geofencing
