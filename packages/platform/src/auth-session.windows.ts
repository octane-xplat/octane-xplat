import { UnavailabilityError } from '@octane-xplat/lib/capability'
import type { Service } from '@octane-xplat/lib/capability'
import type { AuthSessionImpl } from './types'

/** Windows hosted authentication requires a desktop callback/activation adapter. */
export const authSession: Service<AuthSessionImpl> = {
	supported: false,
	isAvailable: async () => false,
	open: () => Promise.reject(new UnavailabilityError('authSession')),
}
