export interface Coordinate {
	latitude: number
	longitude: number
}

export type MapType = 'none' | 'normal' | 'satellite' | 'terrain' | 'hybrid'

export interface Maps {
	readonly supported: boolean
	/** Web only: inject the Maps JS API key before the first <MapView>
	 *  renders. Native keys come from app metadata — this is a no-op there. */
	init(options: { apiKey: string }): void
}

export declare const maps: Maps
