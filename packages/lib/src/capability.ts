// Shared optional-capability contract (decision #125). Leaves expose flat
// service objects — sync `supported`, async `isAvailable()`, permission
// check/request pair — and throw UnavailabilityError when a method is called
// on an absent capability.

/**
 * Permission state for one capability. `'undetermined'` means the user was
 * never asked (web `Notification.permission === 'default'`, pre-prompt
 * native); `'unsupported'` means the capability does not exist on this
 * platform — folding support into the status lets `requestPermissions()`
 * answer support + permission in one await.
 */
export type PermissionStatus = 'granted' | 'denied' | 'undetermined' | 'unsupported'

/**
 * Result of `getPermissions()` / `requestPermissions()`. Mirrors Expo's
 * PermissionResponse minus `expires`; `'unsupported'` extends the status
 * vocabulary.
 */
export interface PermissionResponse {
	status: PermissionStatus
	/** Convenience: `status === 'granted'`. */
	granted: boolean
	/** false → the OS will not re-prompt; route the user to `openSettings()`. */
	canAskAgain: boolean
}

/**
 * Thrown when a capability method is called while the capability is absent.
 * Absence is a missing-`supported`-guard bug, not a runtime outcome — check
 * `supported`/`isAvailable()` first. Carries the capability name so catch
 * sites can tell which feature was misused.
 */
export class UnavailabilityError extends Error {
	readonly feature: string
	constructor(feature: string) {
		super(`${feature} is unavailable on this platform`)
		this.name = 'UnavailabilityError'
		this.feature = feature
	}
}

/** Throw UnavailabilityError for `feature` unless `available` is true. */
export function assertAvailable(feature: string, available: boolean): void {
	if (!available) {throw new UnavailabilityError(feature)}
}
