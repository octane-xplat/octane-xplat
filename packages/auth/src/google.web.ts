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
// GIS exposes a single credential callback per page — one flow at a time.
// `buttonHost` marks a resolver parked by a rendered button (versus a pending
// One Tap prompt); a disconnected host's parked resolver is dead weight.
let pendingFlow: {
	buttonHost: HTMLElement | null
	resolve: (result: SignInResult) => void
} | null = null

const renderedHosts = new WeakSet<HTMLElement>()

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

function initialize(google: any, nonce?: string) {
	google.accounts.id.initialize({
		client_id: config.clientId,
		callback: (response: any) => {
			const flow = pendingFlow
			pendingFlow = null
			flow?.resolve({ status: 'success', credential: toCredential(response) })
		},
		nonce,
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
		onPress?: () => void
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

	if (renderedHosts.has(host) || pendingFlow?.buttonHost === host) {
		// The renderer re-fires ref callbacks on re-render — the button is
		// already mounted or mounting in this host.
		return
	}

	// A rendered button or a pending One Tap prompt owns the single GIS
	// credential slot; a disconnected host's parked resolver can be reclaimed.
	if (pendingFlow && (pendingFlow.buttonHost === null || pendingFlow.buttonHost.isConnected)) {
		onResult({ status: 'error', message: 'a Google sign-in flow is already active' })
		return
	}

	// Park the consumer's onResult before the async SDK load so a same-tick
	// flow sees the slot as owned; the initialize callback resolves it.
	pendingFlow = { buttonHost: host, resolve: onResult }

	try {
		const google = await loadSdk()
		initialize(google)
		google.accounts.id.renderButton(host, {
			type: options.variant === 'icon' ? 'icon' : 'standard',
			theme: options.theme === 'dark' ? 'filled_black' : 'outline',
			size: 'large',
			width: options.width,
			click_listener: options.onPress,
		})

		renderedHosts.add(host)
	} catch (error) {
		if (pendingFlow?.buttonHost === host) {
			pendingFlow = null
		}

		onResult({ status: 'error', message: String((error as any)?.message ?? error) })
	}
}

/** googleAuth service — see the matching interface in types. */
export const googleAuth: GoogleAuth = {
	supported: typeof document !== 'undefined',
	async configure(next?: GoogleAuthConfig) {
		config = { ...next }
	},
	async signIn(options?: GoogleSignInOptions): Promise<SignInResult> {
		if (!config.clientId) {
			return {
				status: 'error',
				message: 'googleAuth.configure({ clientId }) is required on web — the OAuth web client id',
			}
		}

		// Same single-slot rule as the button leaf — a parked resolver for a
		// disconnected host can be reclaimed.
		if (pendingFlow && (pendingFlow.buttonHost === null || pendingFlow.buttonHost.isConnected)) {
			return { status: 'error', message: 'a Google sign-in flow is already active' }
		}

		pendingFlow = null

		try {
			const google = await loadSdk()
			return await new Promise<SignInResult>((resolve) => {
				// Park the resolver before initialize so a same-tick button
				// render sees the slot as owned.
				pendingFlow = { buttonHost: null, resolve }
				initialize(google, options?.nonce)
				google.accounts.id.prompt((notification: any) => {
					if (
						notification.isNotDisplayed?.() ||
						notification.isSkippedMoment?.() ||
						notification.isDismissedMoment?.()
					) {
						if (pendingFlow?.resolve === resolve) {
							pendingFlow = null
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
