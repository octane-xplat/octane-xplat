// Geolocation — web leaf. The browser owns the permission prompt and returns
// the platform-neutral position shape used by the service contract.
import { UnavailabilityError } from '@octane-xplat/lib/capability'
import type { Permissioned, PermissionResponse } from '@octane-xplat/lib/capability'
import type { GeolocationImpl, GeolocationOptions, GeolocationPosition } from './types'

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

const respond = (status: PermissionResponse['status']): PermissionResponse => ({
	status,
	granted: status === 'granted',
	canAskAgain: status === 'granted' || status === 'undetermined',
})

// The prompting probe — a position request surfaces the browser prompt.
async function requestProbe(): Promise<PermissionResponse> {
	try {
		await readPosition({ timeout: 15000 })
		return respond('granted')
	} catch (error) {
		const code = (error as { code?: number }).code
		if (code === 1) {
			return respond('denied')
		}

		if (code === 3) {
			return respond('granted')
		}

		// POSITION_UNAVAILABLE can precede authorization (inactive document).
		// Only a permission query can establish access in that case.
		if (code === 2) {
			return readState()
		}

		return respond('unsupported')
	}
}

// Non-prompting read via the Permissions API where available.
async function readState(): Promise<PermissionResponse> {
	if (navigator.permissions?.query) {
		try {
			const permission = await navigator.permissions.query({ name: 'geolocation' })
			return respond(permission.state === 'prompt' ? 'undetermined' : permission.state)
		} catch {
			// Some browsers expose Permissions but cannot query geolocation.
		}
	}

	return respond('undetermined')
}

export const geolocation: Permissioned<GeolocationImpl> = {
	supported,
	isAvailable: async () => supported,
	async getPermissions() {
		return supported ? readState() : respond('unsupported')
	},
	async requestPermissions() {
		return supported ? requestProbe() : respond('unsupported')
	},
	getCurrentPosition: (options) =>
		supported ? readPosition(options) : Promise.reject(new UnavailabilityError('geolocation')),
}

const permissionOwners = ((globalThis as any).__xplatPermissionOwners ??= {})
permissionOwners.location = {
	getPermissions: () => geolocation.getPermissions(),
	requestPermissions: () => geolocation.requestPermissions(),
}
