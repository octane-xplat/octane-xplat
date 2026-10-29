import type { PermissionResponse, TrackingAuthorizationStatus } from './types'

const nativeStatuses = new Map<number, TrackingAuthorizationStatus>([
	[-1, 'unavailable'],
	[0, 'not-determined'],
	[1, 'restricted'],
	[2, 'denied'],
	[3, 'authorized'],
])
export function permissionResponse(value: number): PermissionResponse {
	const authorizationStatus = nativeStatuses.get(value)
	if (!authorizationStatus) {
		throw new Error('Unknown tracking authorization status')
	}
	const granted = value === -1 || value === 3
	return Object.freeze({
		status: granted ? 'granted' : value === 0 ? 'undetermined' : 'denied',
		granted,
		canAskAgain: granted || value === 0,
		expires: 'never',
		authorizationStatus,
	})
}
export function advertisingIdentifier(
	value: string | null,
	format: 'uuid' | 'alphanumeric' = 'uuid',
): string | null {
	if (value === null) {
		return null
	}
	const valid =
		format === 'alphanumeric'
			? /^[a-z\d]{1,256}$/i
			: /^[a-f\d]{8}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{12}$/i
	if (typeof value !== 'string' || !valid.test(value)) {
		throw new Error('Invalid advertising identifier reply')
	}
	return /^0+$/.test(value.replace(/-/g, '')) ? null : value
}
