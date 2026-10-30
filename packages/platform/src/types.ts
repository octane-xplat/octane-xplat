// Shared contract shapes — imported by BOTH leaves. Types must live here,
// never in a leaf: `import … from './x.web'` inside a native default module drags the
// web implementation into the native typecheck program.
// The capability contract (Service/Permissioned/PermissionResponse/
// UnavailabilityError) lives in @octane-xplat/lib/capability (decision #125).

/** App lifecycle states (active/background/inactive). */
export type AppState = 'active' | 'background' | 'inactive'

/** Static device metadata. */
export interface DeviceInfo {
	/** Operating system name. */
	os: 'web' | 'ios' | 'android' | 'macos' | 'windows'
	/** OS version string. */
	osVersion: string
	/** Device model identifier. */
	model: string
	/** Device manufacturer. */
	manufacturer: string
	/** Primary language tag. */
	language: string
	/** Region/locale tag. */
	region: string
}

/** Edge insets in px/dips. */
export interface Insets {
	/** Top edge inset (px/dips). */
	top: number
	/** Bottom edge inset. */
	bottom: number
	/** Left edge inset. */
	left: number
	/** Right edge inset. */
	right: number
}

/** Window dimensions + orientation. */
export interface WindowSize {
	/** Width in px/dips. */
	width: number
	/** Height in px/dips. */
	height: number
	/** Portrait vs landscape. */
	orientation: 'portrait' | 'landscape'
}

/** Active locale breakdown. */
export interface Locale {
	/** BCP-47 locale tag. */
	tag: string
	/** Primary language tag. */
	language: string
	/** Region/locale tag. */
	region: string
}

/**
 * OS CSPRNG: fills buffers from the platform's cryptographic entropy source
 * (SecRandomCopyBytes on iOS/macOS, java.security.SecureRandom on Android,
 * crypto.getRandomValues on web/Linux, WinRT CryptographicBuffer on Windows).
 * `supported` is false where no source
 * is bound — `fill`/`bytes` throw there rather than weaken to Math.random.
 */
export interface RandomImpl {
	readonly supported: boolean
	/** Fill `view` entirely with secure random bytes; returns `view`. */
	fill<T extends ArrayBufferView>(view: T): T
	/** Return `length` freshly generated secure random bytes. */
	bytes(length: number): Uint8Array
}

/** Permission domain keys. */
export type PermissionKind =
	| 'notifications'
	| 'camera'
	| 'photos'
	| 'location'
	| 'location-always'
	| 'microphone'
	| 'contacts'
	| 'calendar'

/** Network connection kinds. */
export type ConnectionType =
	| 'none'
	| 'wifi'
	| 'mobile'
	| 'ethernet'
	| 'bluetooth'
	| 'vpn'
	| 'unknown'

/** Connectivity snapshot. */
export interface ConnectivityState {
	/** False when this runtime has no connectivity probe. */
	supported?: boolean
	/** Whether the device reports connectivity. */
	online: boolean
	/** Result/kind discriminator. */
	type: ConnectionType
}

/** Connectivity service contract. */
export interface ConnectivityImpl {
	getState(): ConnectivityState
	subscribe(listener: (state: ConnectivityState) => void): () => void
}

/** Static app metadata. */
export interface AppInfo {
	/** Whether the feature is supported on this platform. */
	supported: boolean
	/** OS/app version string. */
	version: string | null
	/** Build number. */
	build: string | null
	/** Application bundle/package identifier. */
	bundleId: string | null
}

/** Settings-opening contract. */
export interface OpenSettingsImpl {
	open(): boolean
}

/**
 * WebAuthn registration options in the JSON wire shape (base64url fields) —
 * the payload an RP server such as better-auth or SimpleWebAuthn emits.
 */
export interface WebAuthnCreateOptionsJSON {
	/** Server-issued challenge bytes. */
	challenge: string
	/** Relying-party parameters. */
	rp: { name: string; id?: string }
	/** User-handle parameters. */
	user: { id: string; name: string; displayName: string }
	/** Allowed public-key algorithms. */
	pubKeyCredParams: { type: 'public-key'; alg: number }[]
	/** Ceremony timeout in ms. */
	timeout?: number
	/** Credentials to exclude. */
	excludeCredentials?: { type: 'public-key'; id: string; transports?: string[] }[]
	/** Authenticator selection criteria. */
	authenticatorSelection?: {
		/** Platform vs cross-platform authenticator. */
		authenticatorAttachment?: 'platform' | 'cross-platform'
		requireResidentKey?: boolean
		residentKey?: 'discouraged' | 'preferred' | 'required'
		/** User-verification requirement. */
		userVerification?: 'required' | 'preferred' | 'discouraged'
	}
	/** Attestation conveyance preference. */
	attestation?: 'none' | 'indirect' | 'direct' | 'enterprise'
	/** WebAuthn extension inputs. */
	extensions?: Record<string, unknown>
}

/** WebAuthn authentication options in the JSON wire shape. */
export interface WebAuthnGetOptionsJSON {
	/** Server-issued challenge bytes. */
	challenge: string
	/** Relying-party id. */
	rpId?: string
	/** Ceremony timeout in ms. */
	timeout?: number
	/** Acceptable credential descriptors. */
	allowCredentials?: { type: 'public-key'; id: string; transports?: string[] }[]
	/** User-verification requirement. */
	userVerification?: 'required' | 'preferred' | 'discouraged'
	/** WebAuthn extension inputs. */
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
	/** The authenticator response payload. */
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
	/** The authenticator response payload. */
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

/** Options for an auth session. */
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

/** Auth-session outcome. */
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
