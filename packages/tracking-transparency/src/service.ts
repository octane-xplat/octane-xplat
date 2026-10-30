import { backend } from './backend'
import { advertisingIdentifier, permissionResponse } from './permission'
import type { PermissionResponse } from './types'
export type TrackingTransparencyModule = Readonly<{
	readonly supported: boolean
	readonly capabilities: Readonly<{
		prompt: boolean
		advertisingId: boolean
		advertisingIdAsync: boolean
	}>
	isAvailable: typeof isAvailable
	getTrackingPermissionsAsync: typeof getTrackingPermissionsAsync
	requestTrackingPermissionsAsync: typeof requestTrackingPermissionsAsync
	getAdvertisingId: typeof getAdvertisingId
	getAdvertisingIdAsync: typeof getAdvertisingIdAsync
}>

let prompt: Promise<PermissionResponse> | undefined
let identifier: Promise<string | null> | undefined
/** Whether this host implements a native tracking capability; inspect capabilities.prompt for ATT. */
export function isAvailable(): boolean {
	const value = backend.capabilities()
	return value.prompt || value.advertisingId || value.advertisingIdAsync
}

/** Reads current OS state without showing a prompt. */
export async function getTrackingPermissionsAsync(): Promise<PermissionResponse> {
	return permissionResponse(backend.read())
}

/** Call from an explicit app action. Concurrent callers share a single native request. */
export function requestTrackingPermissionsAsync(): Promise<PermissionResponse> {
	if (!prompt) {
		prompt = Promise.resolve()
			.then(() => backend.request())
			.then(permissionResponse)
			.finally(() => {
				prompt = undefined
			})
	}
	return prompt
}

/** iOS IDFA or Windows advertising ID; Android callers use getAdvertisingIdAsync to avoid blocking the JS/UI thread. */
export function getAdvertisingId(): string | null {
	return advertisingIdentifier(backend.advertisingId(), backend.identifierFormat)
}

/** Fetches anew after each completed call; never caches an identifier. */
export function getAdvertisingIdAsync(): Promise<string | null> {
	if (!identifier) {
		identifier = Promise.resolve()
			.then(() => backend.advertisingIdAsync())
			.then((value) => advertisingIdentifier(value, backend.identifierFormat))
			.finally(() => {
				identifier = undefined
			})
	}
	return identifier
}

/** Tracking service with separate prompt/identifier capabilities; no-gate grants are not app consent. */
export const TrackingTransparency: TrackingTransparencyModule = Object.freeze({
	get supported(): boolean {
		return isAvailable()
	},
	get capabilities(): Readonly<{
		prompt: boolean
		advertisingId: boolean
		advertisingIdAsync: boolean
	}> {
		return Object.freeze({ ...backend.capabilities() })
	},
	isAvailable,
	getTrackingPermissionsAsync,
	requestTrackingPermissionsAsync,
	getAdvertisingId,
	getAdvertisingIdAsync,
})
