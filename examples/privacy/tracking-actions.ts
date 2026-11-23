import {
  getAdvertisingIdAsync,
  getTrackingPermissionsAsync,
  requestTrackingPermissionsAsync,
  TrackingTransparency,
} from '@octane-xplat/tracking-transparency'

/** Call from a visible app action, after explaining the app's tracking choice. */
export async function requestTrackingFromButton(): Promise<string> {
  // 1. Request permission from a visible user action.
  const permission = await requestTrackingPermissionsAsync()

  if (permission.authorizationStatus === 'unavailable') {
    return 'This platform has no ATT prompt.'
  }

  // 2. Show the resulting authorization status.
  return `Tracking authorization: ${permission.authorizationStatus}`
}

/** This read never displays a permission prompt. */
export async function readTrackingStatus(): Promise<string> {
  // 3. Read the current status later without showing another prompt.
  return (await getTrackingPermissionsAsync()).authorizationStatus
}

/** Call after the app's consent flow. Do not persist or log the identifier. */
export async function withAdvertisingIdentifier(
  consume: (identifier: string) => Promise<void>,
): Promise<boolean> {
  // 4. Check support before requesting an advertising identifier.
  if (!TrackingTransparency.capabilities.advertisingIdAsync) {
    return false
  }

  const identifier = await getAdvertisingIdAsync()

  if (identifier === null) {
    return false
  }

  // 5. Pass the identifier to the consented action without storing it here.
  await consume(identifier)
  return true
}
