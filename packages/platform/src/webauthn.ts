// WebAuthn — native leaf. A raw platform-authenticator ceremony requires an
// associated-domains RP (apple-app-site-association / assetlinks.json on the
// origin) plus ASAuthorizationController / Credential Manager plumbing — no
// maintained NativeScript plugin provides it, so it stays unsupported until a
// dedicated leaf lands (decision #66). Run the hosted ceremony through
// `authSession` instead.
import { UnavailabilityError } from '@octane-xplat/lib/capability'
import type { Service } from '@octane-xplat/lib/capability'
import type { WebAuthnImpl } from './types'

const unavailable = () => Promise.reject(new UnavailabilityError('webAuthn'))

export const webAuthn: Service<WebAuthnImpl> = {
	supported: false,
	isAvailable: async () => false,
	create: unavailable,
	get: unavailable,
}
