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

export interface FileRef {
	name: string
	/**
	 * Opaque reference: blob/object URL on web, filesystem path on native.
	 * `files.writeText()` downloads on web and writes a file on native.
	 */
	uri: string
}

/**
 * Result of `media.pickImage()`: a displayable URI and an upload data URL.
 * Native URIs point to temporary JPEG files; call `files.release()` when the
 * preview is no longer needed.
 */
export interface PickedImage extends FileRef {
	dataUrl: string
}

/**
 * Options for `media.capturePhoto()`. Sizes are device-independent pixels;
 * the delivered image may be larger on high-density screens and may differ
 * from the request when `keepAspectRatio` applies.
 */
export interface CapturePhotoOptions {
	width?: number
	height?: number
	/** Preserve the sensor aspect ratio when resizing to width/height. Default true. */
	keepAspectRatio?: boolean
	/** Also write the shot to the OS photo library. Default false. */
	saveToGallery?: boolean
	/** Preferred lens. Default 'rear'; Android devices may ignore the hint. */
	cameraFacing?: 'front' | 'rear'
}

export interface Locale {
	tag: string
	language: string
	region: string
}

export interface SecureStore {
	get(key: string): Promise<string | null>
	set(key: string, value: string): Promise<boolean>
	remove(key: string): Promise<boolean>
}

export interface HapticsImpl {
	impact(style?: 'light' | 'medium' | 'heavy'): void
	notification(kind: 'success' | 'warning' | 'error'): void
	selection(): void
}

export interface NotificationsImpl {
	notify(title: string, body?: string): void
}

export interface BiometricsImpl {
	verify(reason: string): Promise<boolean>
}

export type PermissionResult = 'granted' | 'denied' | 'unsupported'

export type PermissionKind = 'notifications' | 'camera' | 'photos' | 'location'

export type MediaPermissionKind = 'camera' | 'photos'

export interface GeolocationOptions {
	enableHighAccuracy?: boolean
	timeout?: number
	maximumAge?: number
}

export interface GeolocationPosition {
	latitude: number
	longitude: number
	accuracy: number
	altitude: number | null
	heading: number | null
	speed: number | null
	timestamp: number
}

export interface GeolocationImpl {
	getCurrentPosition(options?: GeolocationOptions): Promise<GeolocationPosition>
}

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

export interface MediaImpl {
	pickImage(): Promise<PickedImage | null>
	pickImages(): Promise<PickedImage[]>
	/**
	 * Still-image capture through the OS camera UI. Resolves null when the
	 * shot is canceled, permission is denied, or no camera exists — call
	 * `ensure('camera')` first to tell those apart. Video capture is not part
	 * of the contract: no maintained NativeScript substrate exists.
	 */
	capturePhoto(options?: CapturePhotoOptions): Promise<PickedImage | null>
	ensure(kind: MediaPermissionKind): Promise<PermissionResult>
}

export type ShareResult = 'shared' | 'copied' | 'unavailable'

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
	 * `myapp://callback?...`). iOS intercepts it inside the session; on
	 * Android the app must declare the scheme's intent-filter like any deep
	 * link (see the incoming-links recipe).
	 */
	callbackScheme: string
	/** iOS only: do not share Safari cookies/state (ASWebAuthenticationSession.prefersEphemeralWebBrowserSession). */
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
 * (ASWebAuthenticationSession on iOS, a Chrome Custom Tab on Android) and
 * resolves when the site redirects to `callbackScheme`. This is how a native
 * app runs WebAuthn/OAuth on its real HTTPS origin without associated-domains
 * setup (decision #66).
 */
export interface AuthSessionImpl {
	open(url: string, options: AuthSessionOptions): Promise<AuthSessionResult>
}
