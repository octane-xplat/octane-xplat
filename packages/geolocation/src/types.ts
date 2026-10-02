/** Optional capability — never throws for absence (docs/platform/platform-services.md). */
export interface Capability<T> {
	supported: boolean
	ensure(): Promise<'granted' | 'denied' | 'unsupported'>
	/** usable iff supported && ensured */
	impl: T | null
}

export type PermissionResult = 'granted' | 'denied' | 'unsupported'

export interface GeolocationOptions {
	enableHighAccuracy?: boolean
	timeout?: number
	maximumAge?: number
}

export interface GeolocationPosition {
	latitude: number
	longitude: number
	accuracy: number
	altitude: number | null
	heading: number | null
	speed: number | null
	timestamp: number
}

export interface GeolocationImpl {
	getCurrentPosition(options?: GeolocationOptions): Promise<GeolocationPosition>
}
