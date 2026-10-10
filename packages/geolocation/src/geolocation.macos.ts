// Package-owned Core Location facade, loaded by the existing macOS native graph.
import type {
	Capability,
	GeolocationImpl,
	GeolocationPosition,
	PermissionResult,
} from './types'

declare const XplatGeolocation: {
	isAvailable(): boolean
	ensure(completion: (result: PermissionResult) => void): void
	positionTimeoutMaximumAgeCompletion(
		highAccuracy: boolean,
		timeout: number,
		maximumAge: number,
		completion: (
			positionJSON: string | null,
			code: number,
			message: string,
		) => void,
	): void
}

const available = () =>
	typeof XplatGeolocation !== 'undefined' && XplatGeolocation.isAvailable()

const milliseconds = (value: number | undefined, fallback: number) =>
	value === undefined || Number.isNaN(value) ? fallback : Math.max(0, value)

const impl: GeolocationImpl = {
	getCurrentPosition(options) {
		return new Promise((resolve, reject) => {
			if (!available()) {
				reject(
					Object.assign(new Error('Location host unavailable'), { code: 2 }),
				)

				return
			}

			const timeout = milliseconds(options?.timeout, Infinity)
			XplatGeolocation.positionTimeoutMaximumAgeCompletion(
				options?.enableHighAccuracy ?? false,
				timeout === Infinity ? -1 : timeout,
				milliseconds(options?.maximumAge, 0),
				(positionJSON, code, message) => {
					if (code === 0 && positionJSON) {
						try {
							resolve(JSON.parse(positionJSON) as GeolocationPosition)
						} catch (error) {
							reject(error)
						}
					} else {
						reject(
							Object.assign(new Error(message || 'Location unavailable'), {
								code: code || 2,
							}),
						)
					}
				},
			)
		})
	},
}

export const geolocation: Capability<GeolocationImpl> = {
	get supported() {
		return available()
	},
	async ensure() {
		if (!available()) {
			return 'unsupported'
		}

		return new Promise<PermissionResult>((resolve) =>
			XplatGeolocation.ensure(resolve),
		)
	},
	get impl() {
		return available() ? impl : null
	},
}

const permissionOwners = ((globalThis as any).__xplatPermissionOwners ??= {})
permissionOwners.location = () => geolocation.ensure()
