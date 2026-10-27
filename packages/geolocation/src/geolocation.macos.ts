// Package-owned Core Location facade, loaded by the existing macOS native graph.
import { UnavailabilityError } from '@octane-xplat/lib/capability'
import type { Permissioned, PermissionResponse } from '@octane-xplat/lib/capability'
import type { GeolocationImpl, GeolocationPosition } from './types'

declare const XplatGeolocation: {
	isAvailable(): boolean
	ensure(completion: (result: 'granted' | 'denied' | 'unsupported') => void): void
	positionTimeoutMaximumAgeCompletion(
		highAccuracy: boolean,
		timeout: number,
		maximumAge: number,
		completion: (positionJSON: string | null, code: number, message: string) => void,
	): void
}

const available = () => typeof XplatGeolocation !== 'undefined' && XplatGeolocation.isAvailable()

const milliseconds = (value: number | undefined, fallback: number) =>
	value === undefined || Number.isNaN(value) ? fallback : Math.max(0, value)

const impl: GeolocationImpl = {
	getCurrentPosition(options) {
		return new Promise((resolve, reject) => {
			if (!available()) {
				reject(new UnavailabilityError('geolocation'))

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

// The native seam carries only ensure() — probing may prompt.
const ensure = (): Promise<PermissionResponse> =>
	!available()
		? Promise.resolve({ status: 'unsupported', granted: false, canAskAgain: false })
		: new Promise((resolve) => {
				XplatGeolocation.ensure((status) =>
					resolve({
						status,
						granted: status === 'granted',
						canAskAgain: status === 'granted',
					}),
				)
			})

export const geolocation: Permissioned<GeolocationImpl> = {
	get supported() {
		return available()
	},
	isAvailable: async () => available(),
	getPermissions: ensure,
	requestPermissions: ensure,
	...impl,
}

const permissionOwners = ((globalThis as any).__xplatPermissionOwners ??= {})
permissionOwners.location = {
	getPermissions: () => geolocation.getPermissions(),
	requestPermissions: () => geolocation.requestPermissions(),
}
