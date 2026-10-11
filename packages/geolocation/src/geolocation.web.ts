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
			if (code === 1) {
				return 'denied'
			}

			if (code === 3) {
				return 'granted'
			}

			// POSITION_UNAVAILABLE can precede authorization (inactive document).
			// Only a permission query can establish access in that case.
			if (code === 2 && navigator.permissions?.query) {
				try {
					const permission = await navigator.permissions.query({ name: 'geolocation' })
					if (permission.state === 'granted') {
						return 'granted'
					}

					if (permission.state === 'denied') {
						return 'denied'
					}
				} catch {
					// Some browsers expose Permissions but cannot query geolocation.
				}
			}

			return 'unsupported'
		}
	},
	impl,
}

const permissionOwners = ((globalThis as any).__xplatPermissionOwners ??= {})
permissionOwners.location = () => geolocation.ensure()
