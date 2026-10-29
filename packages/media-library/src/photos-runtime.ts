import { UnavailabilityError } from '@octane-xplat/lib/capability'
import type { AppleHost } from './photos-runtime-types'
export const appleHost: AppleHost = {
	runtime: () => null,
	observer() {
		throw new UnavailabilityError('MediaLibrary PhotoKit observer')
	},
	async permissionsPicker() {
		throw new UnavailabilityError('MediaLibrary limited-selection picker')
	},
}
