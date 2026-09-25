// Geolocation — web leaf. The browser owns the permission prompt and returns
// the platform-neutral position shape used by the service contract.
import type { Capability, GeolocationImpl, GeolocationOptions, GeolocationPosition } from './types'

const supported = typeof navigator !== 'undefined' && 'geolocation' in navigator

function readPosition(options?: GeolocationOptions): Promise<GeolocationPosition> {
	return new Promise((resolve, reject) => {
		navigator.geolocation.getCurrentPosition(
			(position) =>
				resolve({
					latitude: position.coords.latitude,
					longitude: position.coords.longitude,
					accuracy: position.coords.accuracy,
					altitude: position.coords.altitude,
					heading: position.coords.heading,
					speed: position.coords.speed,
					timestamp: position.timestamp,
				}),
			reject,
			{
				enableHighAccuracy: options?.enableHighAccuracy,
				timeout: options?.timeout,
				maximumAge: options?.maximumAge,
			},
		)
	})
}

const impl: GeolocationImpl = {
	getCurrentPosition: readPosition,
}

export const geolocation: Capability<GeolocationImpl> = {
	supported,
	async ensure() {
		if (!supported) {
			return 'unsupported'
		}

		try {
			await readPosition({ timeout: 15000 })
			return 'granted'
		} catch (error) {
			const code = (error as { code?: number }).code
			return code === 1 ? 'denied' : 'unsupported'
		}
	},
	impl,
}
