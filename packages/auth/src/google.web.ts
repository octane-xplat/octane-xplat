// Google Sign-In — web leaf over Google Identity Services
// (accounts.google.com/gsi/client) in id_token mode, loaded lazily on first
// use. Headless `signIn` drives One Tap (`google.accounts.id.prompt`); the
// `GoogleSignInButton` leaf renders the official button via `renderButton`,
// which is the reliable interactive path — One Tap can be skipped/cancelled
// without user intent when there is no Google session.
import type {
	AuthCredential,
	GoogleAuth,
	GoogleAuthConfig,
	GoogleSignInOptions,
	SignInResult,
} from './types'

const GIS_URL = 'https://accounts.google.com/gsi/client'

let config: GoogleAuthConfig = {}
let sdkPromise: Promise<any> | null = null
let credentialResolve: ((result: SignInResult) => void) | null = null
let configuredNonce: string | undefined

function loadSdk(): Promise<any> {
	sdkPromise ??= new Promise((resolve, reject) => {
		const script = document.createElement('script')
		script.src = GIS_URL
		script.async = true
		script.onload = () => resolve((globalThis as any).google)
		script.onerror = () => {
			sdkPromise = null
			reject(new Error('failed to load the Google Identity Services SDK'))
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
	const claims = decodeJwt(response?.credential ?? '')
	return {
		provider: 'google',
		idToken: response?.credential ?? undefined,
		scopes: claims.scope ? String(claims.scope).split(' ') : (config.scopes ?? []),
		user: {
			id: claims.sub ?? '',
			email: claims.email ?? undefined,
			name: claims.name ?? undefined,
			givenName: claims.given_name ?? undefined,
			familyName: claims.family_name ?? undefined,
			photoUrl: claims.picture ?? undefined,
		},
	}
}

function initialize(google: any) {
	google.accounts.id.initialize({
		client_id: config.clientId,
		callback: (response: any) => {
			const resolve = credentialResolve
			credentialResolve = null
			resolve?.({ status: 'success', credential: toCredential(response) })
		},
		nonce: configuredNonce,
		hosted_domain: config.hostedDomain,
	})
}

/** Internal — the button leaf renders the official GIS button into `host`. */
export async function renderGoogleButton(
	host: HTMLElement,
	options: {
		theme?: 'dark' | 'light' | 'auto'
		variant?: 'standard' | 'wide' | 'icon'
		width?: number
	},
	onResult: (result: SignInResult) => void,
): Promise<void> {
	if (!config.clientId) {
		onResult({
			status: 'error',
			message: 'googleAuth.configure({ clientId }) is required on web — the OAuth web client id',
		})

		return
	}

	try {
		const google = await loadSdk()
		initialize(google)
		google.accounts.id.renderButton(host, {
			type: options.variant === 'icon' ? 'icon' : 'standard',
			theme: options.theme === 'dark' ? 'filled_black' : 'outline',
			size: 'large',
			width: options.width,
		})

		// The button's flow resolves through the initialize callback — park the
		// consumer's onResult where the credential callback can find it. One
		// flow at a time, matching the native ceremony.
		credentialResolve = onResult
	} catch (error) {
		onResult({ status: 'error', message: String((error as any)?.message ?? error) })
	}
}

export const googleAuth: GoogleAuth = {
	supported: typeof document !== 'undefined',
	async configure(next?: GoogleAuthConfig) {
		config = { ...next }
		configuredNonce = undefined
	},
	async signIn(options?: GoogleSignInOptions): Promise<SignInResult> {
		if (!config.clientId) {
			return {
				status: 'error',
				message: 'googleAuth.configure({ clientId }) is required on web — the OAuth web client id',
			}
		}

		if (credentialResolve) {
			return { status: 'error', message: 'a Google sign-in flow is already active' }
		}

		configuredNonce = options?.nonce
		try {
			const google = await loadSdk()
			initialize(google)
			return await new Promise<SignInResult>((resolve) => {
				credentialResolve = resolve
				google.accounts.id.prompt((notification: any) => {
					if (
						notification.isNotDisplayed?.() ||
						notification.isSkippedMoment?.() ||
						notification.isDismissedMoment?.()
					) {
						if (credentialResolve === resolve) {
							credentialResolve = null
							resolve({ status: 'cancelled' })
						}
					}
				})
			})
		} catch (error) {
			return { status: 'error', message: String((error as any)?.message ?? error) }
		}
	},
	async signOut() {
		// GIS id-token mode keeps no session — clearing Google's auto-select
		// flag is the web equivalent of the native signOut.
		try {
			const google = await loadSdk()
			google.accounts.id.disableAutoSelect()
		} catch {
			// Nothing to revoke — the credential is stateless.
		}
	},
}
