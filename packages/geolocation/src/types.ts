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

export { UnavailabilityError } from '@octane-xplat/lib/capability'
export type {
	Permissioned,
	PermissionResponse,
	PermissionStatus,
	Service,
} from '@octane-xplat/lib/capability'
