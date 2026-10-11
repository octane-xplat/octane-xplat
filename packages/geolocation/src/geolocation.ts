// Geolocation — native leaf. The plugin's enableLocationRequest() owns the
// runtime prompt; getCurrentLocation() is normalized to the web position shape.
import * as geolocationApi from '@nativescript/geolocation'
import { CoreTypes } from '@nativescript/core'
import type { Capability, GeolocationImpl, GeolocationPosition } from './types'

function asPosition(nativeLocation: any): GeolocationPosition {
	const android = nativeLocation.android
	const ios = nativeLocation.ios
	const heading = nativeLocation.direction ?? nativeLocation.heading
	const speed = nativeLocation.speed
	return {
		latitude: nativeLocation.latitude,
		longitude: nativeLocation.longitude,
		accuracy: Math.max(0, nativeLocation.horizontalAccuracy ?? nativeLocation.accuracy ?? 0),
		// Altitude itself can be negative; iOS validity uses verticalAccuracy.
		altitude:
			(android && !android.hasAltitude()) || (ios && ios.verticalAccuracy < 0)
				? null
				: (nativeLocation.altitude ?? null),
		heading: (android && !android.hasBearing()) || heading == null || heading < 0 ? null : heading,
		speed: (android && !android.hasSpeed()) || speed == null || speed < 0 ? null : speed,
		timestamp: Number(nativeLocation.timestamp ?? Date.now()),
	}
}

const impl: GeolocationImpl = {
	async getCurrentPosition(options) {
		const nativePosition = await geolocationApi.getCurrentLocation({
			desiredAccuracy: options?.enableHighAccuracy
				? CoreTypes.Accuracy.high
				: CoreTypes.Accuracy.any,
			maximumAge: options?.maximumAge,
			timeout: options?.timeout,
		})

		return asPosition(nativePosition)
	},
}

export const geolocation: Capability<GeolocationImpl> = {
	supported: true,
	async ensure() {
		try {
			await geolocationApi.enableLocationRequest()
			return 'granted'
		} catch {
			return 'denied'
		}
	},
	impl,
}

// See @octane-xplat/media for the pattern — registers the kind this leaf owns
// for the platform permissions dispatcher.
const permissionOwners = ((globalThis as any).__xplatPermissionOwners ??= {})
permissionOwners.location = () => geolocation.ensure()
