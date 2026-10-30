/** A WGS-84 point. */
export interface Coordinate {
	/** WGS-84 degrees. */
	latitude: number
	/** WGS-84 degrees. */
	longitude: number
}

/** Basemap rendering style. */
export type MapType = 'none' | 'normal' | 'satellite' | 'terrain' | 'hybrid'

/** Map service/permissions facade. */
export interface Maps {
	/** Whether a map backend exists on this target — false on macOS/Linux/Windows. */
	readonly supported: boolean
	/** Web only: inject the Maps JS API key before the first <MapView>
	 *  renders. Native keys come from app metadata — this is a no-op there. */
	init(options: { apiKey: string }): void
}

export declare const maps: Maps
