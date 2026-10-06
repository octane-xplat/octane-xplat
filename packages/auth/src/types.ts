// Shared contract for @octane-xplat/auth — identical exports across platform
// leaves (invariant #9). The platform modules (apple.ts / apple.web.ts /
// apple.macos.ts, google.*) are implementation swaps behind this one API.

/** The account the provider authenticated. */
export interface AuthUser {
	/** Stable subject id — Apple `user`, Google `id` (id-token `sub`). */
	id: string
	email?: string
	/**
	 * Best-effort display name. Apple only returns name parts on the first
	 * authorization for an account — expect `undefined` on repeat sign-ins.
	 */
	name?: string
	givenName?: string
	familyName?: string
	/** Google only. */
	photoUrl?: string
}

/** The provider credential — hand it to your backend for verification. */
export interface AuthCredential {
	provider: 'apple' | 'google'
	/** OIDC ID token (JWT). Apple `identityToken`; Google `idToken` / GIS `credential`. */
	idToken?: string
	/**
	 * Server-side exchange code — Apple `authorizationCode`; Google
	 * `serverAuthCode` (requires `serverClientId` in `GoogleAuthConfig`).
	 */
	authorizationCode?: string
	/** Google only — short-lived API access token. */
	accessToken?: string
	/** Granted scopes where the provider reports them. */
	scopes: string[]
	user: AuthUser
}

export type SignInResult =
	| { status: 'success'; credential: AuthCredential }
	/** The user dismissed the flow, or it ended without a credential. */
	| { status: 'cancelled' }
	| { status: 'error'; message: string }

export type AppleScope = 'email' | 'name'

export interface AppleAuthConfig {
	/**
	 * Web only — the Services ID registered in the Apple developer portal
	 * (e.g. `com.example.app.web`). Required on web; ignored natively, where
	 * the app id + `com.apple.developer.applesignin` entitlement is the client.
	 */
	clientId?: string
	/** Web only — a return URL registered on the Services ID. */
	redirectURI?: string
	/** Web only — run the flow in a popup instead of a full-page redirect (default true). */
	usePopup?: boolean
}

export interface AppleSignInOptions {
	/** Apple data to request — maps to `EMAIL`/`FULL_NAME` native scopes. */
	scopes?: AppleScope[]
	/** Nonce bound into the credential — pass the value your backend issued. */
	nonce?: string
}

export type AppleCredentialState =
	| 'authorized'
	| 'revoked'
	| 'notFound'
	| 'transferred'
	/** Anywhere the state check can't run — Android, web. */
	| 'unknown'

export interface AppleAuth {
	/**
	 * Whether the provider's native SDK can run here — iOS 13+ and the macOS
	 * AppKit host (AuthenticationServices via the ObjC bridge; the packaged
	 * app needs the applesignin entitlement for the sheet to complete).
	 * False on Android. On web it reports whether a browser runtime exists;
	 * `configure` still needs a `clientId` before `signIn` will succeed.
	 */
	readonly supported: boolean
	/** Store configuration; the platform SDK loads lazily on first use. */
	configure(config: AppleAuthConfig): void
	signIn(options?: AppleSignInOptions): Promise<SignInResult>
	/** iOS and macOS — credential state for a prior `user.id`. */
	getCredentialState(userId: string): Promise<AppleCredentialState>
}

/** App-owned Google OAuth ceremony for the macOS system browser. */
export interface GoogleHostedAuthFlow {
	/** Issue a fresh backend attempt, binding state, nonce, scopes and callback destination. */
	createRequest(
		options: GoogleSignInOptions &
			Pick<GoogleAuthConfig, 'clientId' | 'serverClientId' | 'scopes' | 'hostedDomain'>,
	): Promise<{ url: string; callbackScheme: string }>
	/** Validate/redeem the callback against that attempt on your backend; return its Google credential. */
	complete(callbackURL: string): Promise<AuthCredential>
	/** Optional backend logout. macOS requests ephemeral browser sessions. */
	signOut?(): Promise<void>
}

export interface GoogleAuthConfig {
	/**
	 * OAuth client id — the web client id on web (required there). On iOS it
	 * is optional when `GIDClientID` is in the app's Info.plist; on Android the
	 * id comes from the google-services resources.
	 */
	clientId?: string
	/** Your backend's web client id — makes credentials carry `authorizationCode` (server auth code). */
	serverClientId?: string
	scopes?: string[]
	/** Restrict to a Google Workspace domain. */
	hostedDomain?: string
	/** macOS only — hosted OAuth adapter; other targets keep using their provider SDK. */
	hostedFlow?: GoogleHostedAuthFlow
}

export interface GoogleSignInOptions {
	/**
	 * Web/macOS — nonce bound into the id token. Scope requests go through
	 * `GoogleAuthConfig.scopes`; neither provider SDK takes per-call scopes.
	 */
	nonce?: string
}

export interface GoogleAuth {
	/**
	 * Whether the provider can run here — iOS/Android + browsers, or macOS
	 * AuthenticationServices (requires `configure({ hostedFlow })`). Android devices without
	 * Play services still report true — the sign-in call surfaces the failure.
	 */
	readonly supported: boolean
	configure(config?: GoogleAuthConfig): Promise<void>
	signIn(options?: GoogleSignInOptions): Promise<SignInResult>
	/** Clear SDK account selection; macOS calls hostedFlow.signOut and requests ephemeral sessions. */
	signOut(): Promise<void>
}

interface SignInButtonBaseProps {
	id?: string
	className?: any
	style?: any
	disabled?: boolean
	/** Tap hook — fires alongside the sign-in flow (not a gate). */
	onPress?: () => void
	/** Called with the outcome of the flow the button started. */
	onResult?: (result: SignInResult) => void
}

export interface AppleSignInButtonProps extends SignInButtonBaseProps {
	/** Label variant — 'default' is "Sign in with Apple". */
	type?: 'default' | 'signUp' | 'continue'
	theme?: 'black' | 'white' | 'whiteOutline'
}

export interface GoogleSignInButtonProps extends SignInButtonBaseProps {
	/** Native button color scheme — 'dark'/'light'/'auto'. */
	theme?: 'dark' | 'light' | 'auto'
	/** 'wide' and 'icon' are native-only shapes; web renders 'standard'. */
	variant?: 'standard' | 'wide' | 'icon'
}

/* ------------------------------------------------------------------ */
/* Hosted-auth client (native session transport)                       */
/* ------------------------------------------------------------------ */

/**
 * Minimal string KV the credential store needs — satisfied by
 * `@octane-xplat/secure-storage`'s `SecureStore` and any host bridge.
 */
export interface HostedAuthCredentialStore {
	get(key: string): Promise<string | null>
	set(key: string, value: string): Promise<unknown>
	remove(key: string): Promise<unknown>
}

/**
 * DOM-free request init — `Response`/`RequestInit` types are not declared in
 * the native typecheck program, so the client contract is this narrow shape
 * which both runtimes' `fetch` accept at runtime.
 */
export interface HostedAuthRequestInit {
	method?: string
	headers?: Record<string, string> | Iterable<readonly [string, string]>
	body?: unknown
	signal?: unknown
}

/** The slice of `fetch`'s `Response` the client exposes. */
export interface HostedAuthResponse {
	readonly status: number
	readonly ok: boolean
	readonly headers: { get(name: string): string | null }
	json(): Promise<unknown>
	text(): Promise<string>
}

export type HostedAuthFetch = (
	url: string,
	init?: HostedAuthRequestInit,
) => Promise<HostedAuthResponse>

/** What a hosted browser ceremony returns — matches `authSession`'s result. */
export type HostedAuthSessionResult =
	| { type: 'success'; url: string }
	| { type: 'cancel' }
	| { type: 'error'; message: string }

export interface HostedAuthSession {
	readonly supported: boolean
	open(url: string, options: { callbackScheme: string }): Promise<HostedAuthSessionResult>
}

/** Credential record the client persists between sessions. */
export interface HostedAuthCredentials {
	/** Short-lived access credential — Bearer on authorized API requests. */
	token: string
	/** `token` expiry in milliseconds since epoch. */
	expiresAt: number
	/** Durable session credential — mints access tokens; revoked on sign-out. */
	sessionToken: string
}

/** Fresh single-use PKCE pair the client generates for each ceremony. */
export interface HostedAuthPkce {
	/** High-entropy verifier kept out of the hosted URL and deep link. */
	verifier: string
	/** base64url(SHA-256(verifier)) sent in the sign-in attempt. */
	challenge: string
}

/** Dependencies the client hands to the flow for each backend call. */
export interface HostedAuthFlowContext {
	/** DOM-free transport bound to the client's `fetch` config. */
	fetch: HostedAuthFetch
	/** The ceremony's PKCE pair — present during `begin` and `complete`. */
	pkce?: HostedAuthPkce
}

export interface HostedAuthAttempt {
	/** Absolute URL to open in the system browser. */
	url: string
	/** Custom URL scheme the browser callback returns on. */
	callbackScheme: string
	/**
	 * Server-issued state the callback's `state` query parameter must echo.
	 * When set, the client rejects mismatched callbacks before `complete`.
	 */
	state?: string
	/** Flow-private data handed back to `complete` (e.g. an attempt id). */
	data?: unknown
}

/**
 * A product's hosted-auth wire contract — where requests go and what they
 * carry. The client owns the ceremony lifecycle, credential storage, and
 * access-token transport; the flow owns the backend's attempt, redemption,
 * refresh, and revocation calls.
 */
export interface HostedAuthFlow {
	/**
	 * Issue the sign-in attempt against the backend and return the hosted
	 * page to open. `context.pkce` is the ceremony's verifier/challenge.
	 */
	begin(context: HostedAuthFlowContext): Promise<HostedAuthAttempt>
	/**
	 * Redeem the system-browser callback URL into credentials. Return `null`
	 * — or throw — to fail the sign-in.
	 */
	complete(
		callbackUrl: string,
		attempt: HostedAuthAttempt,
		context: HostedAuthFlowContext,
	): Promise<HostedAuthCredentials | null>
	/**
	 * Mint a fresh credential record from the durable session credential.
	 * Return `null` when the session is expired or revoked — the client
	 * clears stored credentials. Throw for transient failures.
	 */
	refresh?(
		credentials: HostedAuthCredentials,
		context: HostedAuthFlowContext,
	): Promise<HostedAuthCredentials | null>
	/** Revoke the durable session credential — best-effort. */
	revoke?(credentials: HostedAuthCredentials, context: HostedAuthFlowContext): Promise<void>
}

export interface HostedAuthConfig {
	/** HTTPS origin of the hosted backend; same-origin requests may carry Bearer tokens. */
	apiOrigin: string
	/** The product's hosted-auth wire contract. */
	flow: HostedAuthFlow
	/**
	 * Which same-origin paths get `Authorization: Bearer <access token>` on
	 * `fetch`. Default: every `/api/*` path except the `/api/auth` mount.
	 */
	authorizePath?(pathname: string): boolean
	/** Credential persistence — defaults to `@octane-xplat/secure-storage`. */
	storage?: HostedAuthCredentialStore
	/** Secure-storage key for the credential blob — default `hosted-auth`. */
	storageKey?: string
	/** Transport override — defaults to the global `fetch`. */
	fetch?: HostedAuthFetch
	/** Ceremony override — defaults to the platform `authSession` capability. */
	authSession?: HostedAuthSession
	/** Clock override for expiry checks — defaults to `Date.now`. */
	now?: () => number
}

export type HostedAuthSignInResult =
	| { status: 'success' }
	/** The user dismissed the hosted ceremony, or it ended without a callback. */
	| { status: 'cancelled' }
	| { status: 'error'; message: string }

export type HostedAuthStatus = 'authenticated' | 'unauthenticated'

/**
 * Hosted-auth client: PKCE + a system-browser ceremony
 * (ASWebAuthenticationSession / Custom Tab) driven by a `HostedAuthFlow`
 * backend contract, credentials in secure storage, Bearer attach + refresh
 * for authorized API calls. Works unchanged on every target — `supported`
 * reports whether the hosted ceremony can run (false on web).
 */
export interface HostedAuth {
	/**
	 * Whether the hosted ceremony can run on this target — the platform
	 * `authSession` capability plus an OS CSPRNG. Web reports false: browser
	 * apps keep the cookie session flow.
	 */
	readonly supported: boolean
	/**
	 * Load persisted credentials into memory. Resolves `authenticated` when a
	 * durable session token was stored — the access token may still need a
	 * refresh before the first API call.
	 */
	restore(): Promise<HostedAuthStatus>
	/**
	 * Run the hosted sign-in ceremony: `flow.begin` → `authSession` →
	 * `flow.complete`. Stores the credential record on success.
	 */
	signIn(): Promise<HostedAuthSignInResult>
	/**
	 * A currently valid access token, minting a fresh one from the stored
	 * session credential when expired. Resolves `null` when there is no usable
	 * credential — sign in again.
	 */
	getAccessToken(): Promise<string | null>
	/**
	 * `fetch` that attaches `Authorization: Bearer <access token>` to
	 * `authorizePath`-matching requests under `apiOrigin` and replays once
	 * after a refresh when the server rejects the token. Other URLs pass
	 * through.
	 */
	fetch(url: string, init?: HostedAuthRequestInit): Promise<HostedAuthResponse>
	/** Revoke the durable session via `flow.revoke` and clear stored credentials. */
	signOut(): Promise<void>
}
