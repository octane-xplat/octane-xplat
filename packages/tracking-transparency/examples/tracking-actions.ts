import {
	getAdvertisingIdAsync,
	getTrackingPermissionsAsync,
	requestTrackingPermissionsAsync,
	TrackingTransparency,
} from '@octane-xplat/tracking-transparency'

/** Call from a visible app action, after explaining the app's tracking choice. */
export async function requestTrackingFromButton(): Promise<string> {
	const permission = await requestTrackingPermissionsAsync()
	if (permission.authorizationStatus === 'unavailable') {
		return 'This platform has no ATT prompt.'
	}
	return `Tracking authorization: ${permission.authorizationStatus}`
}

/** This read never displays a permission prompt. */
export async function readTrackingStatus(): Promise<string> {
	return (await getTrackingPermissionsAsync()).authorizationStatus
}

/** Call after the app's consent flow. Do not persist or log the identifier. */
export async function withAdvertisingIdentifier(
	consume: (identifier: string) => Promise<void>,
): Promise<boolean> {
	if (!TrackingTransparency.capabilities.advertisingIdAsync) {
		return false
	}
	const identifier = await getAdvertisingIdAsync()
	if (identifier === null) {
		return false
	}
	await consume(identifier)
	return true
}
