// WebAuthn — native leaf. A raw platform-authenticator ceremony requires an
// associated-domains RP (apple-app-site-association / assetlinks.json on the
// origin) plus ASAuthorizationController / Credential Manager plumbing — no
// maintained NativeScript plugin provides it, so it stays unsupported until a
// dedicated leaf lands (decision #66). Run the hosted ceremony through
// `authSession` instead.
import type { Capability, WebAuthnImpl } from './types'

export const webAuthn: Capability<WebAuthnImpl> = {
	supported: false,
	async ensure() {
		return 'unsupported'
	},
	impl: null,
}
