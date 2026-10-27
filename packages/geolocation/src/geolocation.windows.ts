// Windows leaf — @nativescript/geolocation ships no windows entry, so the
// capability reports unsupported rather than breaking the import graph.
import { UnavailabilityError } from '@octane-xplat/lib/capability'
import type { Permissioned, PermissionResponse } from '@octane-xplat/lib/capability'
import type { GeolocationImpl } from './types'

const UNSUPPORTED: PermissionResponse = {
	status: 'unsupported',
	granted: false,
	canAskAgain: false,
}

export const geolocation: Permissioned<GeolocationImpl> = {
	supported: false,
	isAvailable: async () => false,
	getPermissions: async () => UNSUPPORTED,
	requestPermissions: async () => UNSUPPORTED,
	getCurrentPosition: () => Promise.reject(new UnavailabilityError('geolocation')),
}
