import type { PermissionResponse as SharedPermissionResponse } from '@octane-xplat/lib/capability'

/** Portable Expo permission-state constants. */
export const PermissionStatus = {
	GRANTED: 'granted',
	DENIED: 'denied',
	UNDETERMINED: 'undetermined',
} as const
/** Portable permission state returned by this leaf. */
export type PermissionStatus = (typeof PermissionStatus)[keyof typeof PermissionStatus]
/** Expo expiration value; this leaf returns never. */
export type PermissionExpiration = 'never' | number
/** Native ATT state, or unavailable when this OS gate does not exist. */
export type TrackingAuthorizationStatus =
	| 'not-determined'
	| 'restricted'
	| 'denied'
	| 'authorized'
	| 'unavailable'
/** Expo fields plus the native distinction between a denial and a restriction. */
export interface PermissionResponse extends Omit<SharedPermissionResponse, 'status'> {
	status: PermissionStatus
	expires: PermissionExpiration
	authorizationStatus: TrackingAuthorizationStatus
}
/** Reading on mount is optional. Prompts require calling the returned request method. */
export interface PermissionHookOptions {
	/** Read permission after mount. @default true */
	get?: boolean
	/** Automatic prompting is unsupported; call the returned request action. @default false */
	request?: false
}
/** Availability of ATT prompts and synchronous/asynchronous native identifier access. */
export interface TrackingCapabilities {
	readonly prompt: boolean
	readonly advertisingId: boolean
	readonly advertisingIdAsync: boolean
}
