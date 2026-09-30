/** The account the provider authenticated. */
export interface AuthUser {
    /** Stable subject id — Apple `user`, Google `id` (id-token `sub`). */
    id: string;
    email?: string;
    /**
     * Best-effort display name. Apple only returns name parts on the first
     * authorization for an account — expect `undefined` on repeat sign-ins.
     */
    name?: string;
    givenName?: string;
    familyName?: string;
    /** Google only. */
    photoUrl?: string;
}
/** The provider credential — hand it to your backend for verification. */
export interface AuthCredential {
    provider: 'apple' | 'google';
    /** OIDC ID token (JWT). Apple `identityToken`; Google `idToken` / GIS `credential`. */
    idToken?: string;
    /**
     * Server-side exchange code — Apple `authorizationCode`; Google
     * `serverAuthCode` (requires `serverClientId` in `GoogleAuthConfig`).
     */
    authorizationCode?: string;
    /** Google only — short-lived API access token. */
    accessToken?: string;
    /** Granted scopes where the provider reports them. */
    scopes: string[];
    user: AuthUser;
}
export type SignInResult = {
    status: 'success';
    credential: AuthCredential;
}
/** The user dismissed the flow, or it ended without a credential. */
 | {
    status: 'cancelled';
} | {
    status: 'error';
    message: string;
};
export type AppleScope = 'email' | 'name';
export interface AppleAuthConfig {
    /**
     * Web only — the Services ID registered in the Apple developer portal
     * (e.g. `com.example.app.web`). Required on web; ignored natively, where
     * the app id + `com.apple.developer.applesignin` entitlement is the client.
     */
    clientId?: string;
    /** Web only — a return URL registered on the Services ID. */
    redirectURI?: string;
    /** Web only — run the flow in a popup instead of a full-page redirect (default true). */
    usePopup?: boolean;
}
export interface AppleSignInOptions {
    /** Apple data to request — maps to `EMAIL`/`FULL_NAME` native scopes. */
    scopes?: AppleScope[];
    /** Nonce bound into the credential — pass the value your backend issued. */
    nonce?: string;
}
export type AppleCredentialState = 'authorized' | 'revoked' | 'notFound' | 'transferred'
/** Anywhere the state check can't run — Android, web. */
 | 'unknown';
export interface AppleAuth {
    /**
     * Whether the provider's native SDK can run here — iOS 13+ and the macOS
     * AppKit host (AuthenticationServices via the ObjC bridge; the packaged
     * app needs the applesignin entitlement for the sheet to complete).
     * False on Android. On web it reports whether a browser runtime exists;
     * `configure` still needs a `clientId` before `signIn` will succeed.
     */
    readonly supported: boolean;
    /** Store configuration; the platform SDK loads lazily on first use. */
    configure(config: AppleAuthConfig): void;
    signIn(options?: AppleSignInOptions): Promise<SignInResult>;
    /** iOS and macOS — credential state for a prior `user.id`. */
    getCredentialState(userId: string): Promise<AppleCredentialState>;
}
export interface GoogleAuthConfig {
    /**
     * OAuth client id — the web client id on web (required there). On iOS it
     * is optional when `GIDClientID` is in the app's Info.plist; on Android the
     * id comes from the google-services resources.
     */
    clientId?: string;
    /** Your backend's web client id — makes credentials carry `authorizationCode` (server auth code). */
    serverClientId?: string;
    scopes?: string[];
    /** Restrict to a Google Workspace domain. */
    hostedDomain?: string;
}
export interface GoogleSignInOptions {
    /**
     * Web only — nonce bound into the id token. Scope requests go through
     * `GoogleAuthConfig.scopes`; neither provider SDK takes per-call scopes.
     */
    nonce?: string;
}
export interface GoogleAuth {
    /**
     * Whether the provider SDK can run here — iOS/Android + browsers. False on
     * macOS (use a hosted `authSession` flow instead). Android devices without
     * Play services still report true — the sign-in call surfaces the failure.
     */
    readonly supported: boolean;
    configure(config?: GoogleAuthConfig): Promise<void>;
    signIn(options?: GoogleSignInOptions): Promise<SignInResult>;
    /** Clear the SDK's account selection so the next `signIn` re-prompts. */
    signOut(): Promise<void>;
}
interface SignInButtonBaseProps {
    id?: string;
    className?: any;
    style?: any;
    disabled?: boolean;
    /** Tap hook — fires alongside the sign-in flow (not a gate). */
    onPress?: () => void;
    /** Called with the outcome of the flow the button started. */
    onResult?: (result: SignInResult) => void;
}
export interface AppleSignInButtonProps extends SignInButtonBaseProps {
    /** Label variant — 'default' is "Sign in with Apple". */
    type?: 'default' | 'signUp' | 'continue';
    theme?: 'black' | 'white' | 'whiteOutline';
}
export interface GoogleSignInButtonProps extends SignInButtonBaseProps {
    /** Native button color scheme — 'dark'/'light'/'auto'. */
    theme?: 'dark' | 'light' | 'auto';
    /** 'wide' and 'icon' are native-only shapes; web renders 'standard'. */
    variant?: 'standard' | 'wide' | 'icon';
}
export {};
