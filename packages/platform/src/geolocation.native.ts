// Geolocation — native leaf. The plugin's enableLocationRequest() owns the
// runtime prompt; getCurrentLocation() is normalized to the web position shape.
import * as geolocationApi from '@nativescript/geolocation'
import { CoreTypes } from '@nativescript/core'
import type { Capability, GeolocationImpl, GeolocationPosition } from './types'

function asPosition(nativeLocation: any): GeolocationPosition {
	return {
		latitude: nativeLocation.latitude,
		longitude: nativeLocation.longitude,
		accuracy: nativeLocation.horizontalAccuracy ?? nativeLocation.accuracy ?? 0,
		altitude: nativeLocation.altitude ?? null,
		heading: nativeLocation.direction ?? nativeLocation.heading ?? null,
		speed: nativeLocation.speed ?? null,
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
