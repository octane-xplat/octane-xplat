// Auth session — web leaf. A browser has no hosted-session concept: the
// ceremony is ordinary navigation to the auth origin, which the app routes
// through its own pages and `webAuthn` directly. Declared unsupported so
// shared code branches on the flag rather than losing a window.
import type { AuthSessionImpl, Capability } from './types'

export const authSession: Capability<AuthSessionImpl> = {
	supported: false,
	async ensure() {
		return 'unsupported'
	},
	impl: null,
}
