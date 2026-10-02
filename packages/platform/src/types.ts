// Shared contract shapes — imported by BOTH leaves. Types must live here,
// never in a leaf: `import … from './x.web'` inside a native default module drags the
// web implementation into the native typecheck program.

/** Optional capability — never throws for absence (docs/platform-services.md). */
export interface Capability<T> {
	supported: boolean
	ensure(): Promise<'granted' | 'denied' | 'unsupported'>
	/** usable iff supported && ensured */
	impl: T | null
}

export type AppState = 'active' | 'background' | 'inactive'

export interface DeviceInfo {
	os: 'web' | 'ios' | 'android' | 'macos'
	osVersion: string
	model: string
	manufacturer: string
	language: string
	region: string
}

export interface Insets {
	top: number
	bottom: number
	left: number
	right: number
}

export interface WindowSize {
	width: number
	height: number
	orientation: 'portrait' | 'landscape'
}

export interface Locale {
	tag: string
	language: string
	region: string
}

export type PermissionResult = 'granted' | 'denied' | 'unsupported'

export type PermissionKind = 'notifications' | 'camera' | 'photos' | 'location'

export type ConnectionType =
	| 'none'
	| 'wifi'
	| 'mobile'
	| 'ethernet'
	| 'bluetooth'
	| 'vpn'
	| 'unknown'

export interface ConnectivityState {
	/** False when this runtime has no connectivity probe. */
	supported?: boolean
	online: boolean
	type: ConnectionType
}

export interface ConnectivityImpl {
	getState(): ConnectivityState
	subscribe(listener: (state: ConnectivityState) => void): () => void
}

export interface AppInfo {
	supported: boolean
	version: string | null
	build: string | null
	bundleId: string | null
}

export interface OpenSettingsImpl {
	open(): boolean
}

/**
 * WebAuthn registration options in the JSON wire shape (base64url fields) —
 * the payload an RP server such as better-auth or SimpleWebAuthn emits.
 */
export interface WebAuthnCreateOptionsJSON {
	challenge: string
	rp: { name: string; id?: string }
	user: { id: string; name: string; displayName: string }
	pubKeyCredParams: { type: 'public-key'; alg: number }[]
	timeout?: number
	excludeCredentials?: { type: 'public-key'; id: string; transports?: string[] }[]
	authenticatorSelection?: {
		authenticatorAttachment?: 'platform' | 'cross-platform'
		requireResidentKey?: boolean
		residentKey?: 'discouraged' | 'preferred' | 'required'
		userVerification?: 'required' | 'preferred' | 'discouraged'
	}
	attestation?: 'none' | 'indirect' | 'direct' | 'enterprise'
	extensions?: Record<string, unknown>
}

/** WebAuthn authentication options in the JSON wire shape. */
export interface WebAuthnGetOptionsJSON {
	challenge: string
	rpId?: string
	timeout?: number
	allowCredentials?: { type: 'public-key'; id: string; transports?: string[] }[]
	userVerification?: 'required' | 'preferred' | 'discouraged'
	extensions?: Record<string, unknown>
}

interface WebAuthnCredentialJSONBase {
	id: string
	rawId: string
	type: 'public-key'
	authenticatorAttachment?: string | null
	clientExtensionResults?: Record<string, unknown>
}

/** Serialized `PublicKeyCredential` from a create() ceremony. */
export interface WebAuthnRegistrationJSON extends WebAuthnCredentialJSONBase {
	response: {
		clientDataJSON: string
		attestationObject: string
		authenticatorData?: string
		publicKey?: string | null
		publicKeyAlgorithm?: number
		transports?: string[]
	}
}

/** Serialized `PublicKeyCredential` from a get() ceremony. */
export interface WebAuthnAssertionJSON extends WebAuthnCredentialJSONBase {
	response: {
		clientDataJSON: string
		authenticatorData: string
		signature: string
		userHandle?: string | null
	}
}

/**
 * Raw platform-authenticator ceremonies against an RP's JSON options. On
 * native this is unsupported — run the hosted ceremony via `authSession`
 * instead (decision #66).
 */
export interface WebAuthnImpl {
	/** True when a user-verifying platform authenticator (biometric/PIN) exists. */
	isAvailable(): Promise<boolean>
	create(options: WebAuthnCreateOptionsJSON): Promise<WebAuthnRegistrationJSON | null>
	get(options: WebAuthnGetOptionsJSON): Promise<WebAuthnAssertionJSON | null>
}

export interface AuthSessionOptions {
	/**
	 * URL scheme the ceremony redirects back to (e.g. `myapp` →
	 * `myapp://callback?...`). iOS/macOS intercept it inside the session; on
	 * Android the app must declare the scheme's intent-filter like any deep
	 * link (see the incoming-links recipe).
	 */
	callbackScheme: string
	/** iOS/macOS: request a browser session without shared cookies/state (ASWebAuthenticationSession.prefersEphemeralWebBrowserSession). */
	prefersEphemeralSession?: boolean
}

export type AuthSessionResult =
	/** The session captured a callback URL on the requested scheme. */
	| { type: 'success'; url: string }
	/** The user dismissed the session, or it ended without a callback. */
	| { type: 'cancel' }
	| { type: 'error'; message: string }

/**
 * Hosted browser ceremony: opens `url` in a system browser context
 * (ASWebAuthenticationSession on iOS/macOS, a Chrome Custom Tab on Android) and
 * resolves when the site redirects to `callbackScheme`. This is how a native
 * app runs WebAuthn/OAuth on its real HTTPS origin without associated-domains
 * setup (decision #66).
 */
export interface AuthSessionImpl {
	open(url: string, options: AuthSessionOptions): Promise<AuthSessionResult>
}
