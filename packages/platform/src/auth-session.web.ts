// Auth session — web leaf. A browser has no hosted-session concept: the
// ceremony is ordinary navigation to the auth origin, which the app routes
// through its own pages and `webAuthn` directly. Declared unsupported so
// shared code branches on the flag rather than losing a window.
import { UnavailabilityError } from '@octane-xplat/lib/capability'
import type { Service } from '@octane-xplat/lib/capability'
import type { AuthSessionImpl } from './types'

export const authSession: Service<AuthSessionImpl> = {
	supported: false,
	isAvailable: async () => false,
	open: () => Promise.reject(new UnavailabilityError('authSession')),
}
