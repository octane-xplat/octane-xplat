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
