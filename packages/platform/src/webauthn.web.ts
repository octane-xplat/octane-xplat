// WebAuthn — web leaf over navigator.credentials. Options and results use the
// JSON wire shape (base64url fields) so RP payloads from better-auth /
// SimpleWebAuthn pass straight through. Requires a secure context.
import type {
	Capability,
	WebAuthnAssertionJSON,
	WebAuthnCreateOptionsJSON,
	WebAuthnGetOptionsJSON,
	WebAuthnImpl,
	WebAuthnRegistrationJSON,
} from './types'

function decode(value: string): ArrayBuffer {
	const base64 = value.replace(/-/g, '+').replace(/_/g, '/')
	const binary = atob(base64 + '='.repeat((4 - (base64.length % 4)) % 4))
	const bytes = new Uint8Array(binary.length)
	for (let i = 0; i < binary.length; i++) {
		bytes[i] = binary.charCodeAt(i)
	}

	return bytes.buffer
}

function encode(buffer: ArrayBuffer): string {
	const bytes = new Uint8Array(buffer)
	let binary = ''
	for (let i = 0; i < bytes.length; i++) {
		binary += String.fromCharCode(bytes[i])
	}

	return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

async function create(options: WebAuthnCreateOptionsJSON): Promise<WebAuthnRegistrationJSON | null> {
	const credential = (await navigator.credentials.create({
		publicKey: {
			challenge: decode(options.challenge),
			rp: options.rp,
			user: { ...options.user, id: decode(options.user.id) },
			pubKeyCredParams: options.pubKeyCredParams,
			timeout: options.timeout,
			excludeCredentials: options.excludeCredentials?.map((c) => ({
				type: 'public-key',
				id: decode(c.id),
				transports: c.transports as AuthenticatorTransport[] | undefined,
			})),
			authenticatorSelection: options.authenticatorSelection,
			attestation: options.attestation,
			extensions: options.extensions as AuthenticationExtensionsClientInputs | undefined,
		},
	})) as PublicKeyCredential | null

	if (!credential) {
		return null
	}

	const response = credential.response as AuthenticatorAttestationResponse
	return {
		id: credential.id,
		rawId: encode(credential.rawId),
		type: 'public-key',
		response: {
			clientDataJSON: encode(response.clientDataJSON),
			attestationObject: encode(response.attestationObject),
			...(typeof response.getTransports === 'function'
				? { transports: response.getTransports() }
				: {}),
			...(typeof response.getAuthenticatorData === 'function'
				? { authenticatorData: encode(response.getAuthenticatorData()) }
				: {}),
			...(typeof response.getPublicKey === 'function'
				? { publicKey: response.getPublicKey() && encode(response.getPublicKey()!) }
				: {}),
			...(typeof response.getPublicKeyAlgorithm === 'function'
				? { publicKeyAlgorithm: response.getPublicKeyAlgorithm() }
				: {}),
		},
		authenticatorAttachment: credential.authenticatorAttachment,
		clientExtensionResults: credential.getClientExtensionResults() as Record<string, unknown>,
	}
}

async function get(options: WebAuthnGetOptionsJSON): Promise<WebAuthnAssertionJSON | null> {
	const credential = (await navigator.credentials.get({
		publicKey: {
			challenge: decode(options.challenge),
			rpId: options.rpId,
			timeout: options.timeout,
			allowCredentials: options.allowCredentials?.map((c) => ({
				type: 'public-key',
				id: decode(c.id),
				transports: c.transports as AuthenticatorTransport[] | undefined,
			})),
			userVerification: options.userVerification,
			extensions: options.extensions as AuthenticationExtensionsClientInputs | undefined,
		},
	})) as PublicKeyCredential | null

	if (!credential) {
		return null
	}

	const response = credential.response as AuthenticatorAssertionResponse
	return {
		id: credential.id,
		rawId: encode(credential.rawId),
		type: 'public-key',
		response: {
			clientDataJSON: encode(response.clientDataJSON),
			authenticatorData: encode(response.authenticatorData),
			signature: encode(response.signature),
			userHandle: response.userHandle && encode(response.userHandle),
		},
		authenticatorAttachment: credential.authenticatorAttachment,
		clientExtensionResults: credential.getClientExtensionResults() as Record<string, unknown>,
	}
}

const supported =
	typeof window !== 'undefined' &&
	window.isSecureContext &&
	typeof PublicKeyCredential === 'function' &&
	!!navigator.credentials

export const webAuthn: Capability<WebAuthnImpl> = {
	supported,
	async ensure() {
		return supported ? 'granted' : 'unsupported'
	},
	impl: supported
		? {
				async isAvailable() {
					try {
						return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
					} catch {
						return false
					}
				},
				create,
				get,
			}
		: null,
}
