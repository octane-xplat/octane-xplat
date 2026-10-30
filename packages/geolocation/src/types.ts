/** Options for getCurrentPosition(). All fields are hints — the platform
 *  location service decides actual accuracy and latency. */
export interface GeolocationOptions {
	/** Request GPS-grade accuracy (higher battery cost); false allows
	 *  network/cell fixes. */
	enableHighAccuracy?: boolean
	/** Give up after this many milliseconds and reject. */
	timeout?: number
	/** Accept a cached fix no older than this many milliseconds; 0 forces a
	 *  fresh reading. */
	maximumAge?: number
}

/** A single position fix. Optional sensors report null rather than 0 —
 *  distinguish "no reading" from "stationary"/"sea level". */
export interface GeolocationPosition {
	/** WGS-84 degrees. */
	latitude: number
	/** WGS-84 degrees. */
	longitude: number
	/** Horizontal accuracy radius in meters; 0 when the platform reports none. */
	accuracy: number
	/** Meters above sea level, or null when the fix has no altitude. */
	altitude: number | null
	/** Course in degrees clockwise from north, or null when the device is
	 *  stationary or the platform reports no bearing. */
	heading: number | null
	/** Ground speed in m/s, or null when unavailable. */
	speed: number | null
	/** Fix time in milliseconds since the Unix epoch. */
	timestamp: number
}

/** Single-shot location façade. */
export interface GeolocationImpl {
	/** Request one position fix; rejects on denial, timeout, or no fix. */
	getCurrentPosition(options?: GeolocationOptions): Promise<GeolocationPosition>
}

export { UnavailabilityError } from '@octane-xplat/lib/capability'
export type {
	Permissioned,
	PermissionResponse,
	PermissionStatus,
	Service,
} from '@octane-xplat/lib/capability'
