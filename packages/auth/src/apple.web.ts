// Sign in with Apple — web leaf over Apple's JS API
// (appleid.cdn.apple.com/appleauth/js/jsapi/AppleID.auth.js), loaded lazily on
// first use. The flow needs a Services ID (`clientId`) and a registered
// `redirectURI` via `configure`; `usePopup` (default on) keeps the ceremony in
// a popup so the app never leaves.
import type {
	AppleAuth,
	AppleAuthConfig,
	AppleCredentialState,
	AppleSignInOptions,
	AuthCredential,
	SignInResult,
} from './types'

const APPLE_SDK_URL = 'https://appleid.cdn.apple.com/appleauth/js/jsapi/AppleID.auth.js'

let config: AppleAuthConfig = {}
let requestedScopes: string[] = []
let sdkPromise: Promise<any> | null = null

function loadSdk(): Promise<any> {
	sdkPromise ??= new Promise((resolve, reject) => {
		const script = document.createElement('script')
		script.src = APPLE_SDK_URL
		script.async = true
		script.onload = () => resolve((globalThis as any).AppleID)
		script.onerror = () => {
			sdkPromise = null
			reject(new Error('failed to load the Sign in with Apple JS SDK'))
		}
		document.head.appendChild(script)
	})
	return sdkPromise
}

function decodeJwt(token: string): Record<string, any> {
	try {
		const part = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
		return JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(part), (c) => c.charCodeAt(0))))
	} catch {
		return {}
	}
}

function toCredential(response: any): AuthCredential {
	const auth = response?.authorization ?? {}
	const claims = auth.id_token ? decodeJwt(auth.id_token) : {}
	const name = [response?.user?.name?.firstName, response?.user?.name?.lastName]
		.filter(Boolean)
		.join(' ') || undefined
	return {
		provider: 'apple',
		idToken: auth.id_token ?? undefined,
		authorizationCode: auth.code ?? undefined,
		scopes: requestedScopes,
		user: {
			id: claims.sub ?? '',
			email: response?.user?.email ?? claims.email ?? undefined,
			name,
			givenName: response?.user?.name?.firstName ?? undefined,
			familyName: response?.user?.name?.lastName ?? undefined,
		},
	}
}

function isCancel(error: unknown): boolean {
	const code = (error as any)?.error ?? (error as any)?.message ?? error
	return /popup_closed_by_user|cancel/i.test(String(code))
}

export const appleAuth: AppleAuth = {
	supported: typeof document !== 'undefined',
	configure(next: AppleAuthConfig) {
		config = { ...next }
	},
	async signIn(options?: AppleSignInOptions): Promise<SignInResult> {
		if (!config.clientId || !config.redirectURI) {
			return {
				status: 'error',
				message:
					'appleAuth.configure({ clientId, redirectURI }) is required on web — the Services ID and a registered return URL',
			}
		}

		try {
			const sdk = await loadSdk()
			requestedScopes = options?.scopes ?? ['name', 'email']
			sdk.auth.init({
				clientId: config.clientId,
				scope: requestedScopes.join(' '),
				redirectURI: config.redirectURI,
				usePopup: config.usePopup !== false,
				nonce: options?.nonce,
			})
			const response = await sdk.auth.signIn()
			return { status: 'success', credential: toCredential(response) }
		} catch (error) {
			return isCancel(error)
				? { status: 'cancelled' }
				: { status: 'error', message: String((error as any)?.message ?? (error as any)?.error ?? error) }
		}
	},
	async getCredentialState(): Promise<AppleCredentialState> {
		// The web SDK has no credential-state endpoint.
		return 'unknown'
	},
}
