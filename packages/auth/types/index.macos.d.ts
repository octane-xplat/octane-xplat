import type {
	AppleAuth,
	AppleAuthConfig,
	AppleCredentialState,
	AppleScope,
	AppleSignInButtonProps,
	AppleSignInOptions,
	AuthCredential,
	AuthUser,
	HostedAuth,
	HostedAuthAttempt,
	HostedAuthConfig,
	HostedAuthCredentialStore,
	HostedAuthCredentials,
	HostedAuthFetch,
	HostedAuthFlow,
	HostedAuthFlowContext,
	HostedAuthPkce,
	HostedAuthRequestInit,
	HostedAuthResponse,
	HostedAuthSession,
	HostedAuthSessionResult,
	HostedAuthSignInResult,
	HostedAuthStatus,
	GoogleAuth,
	GoogleAuthConfig,
	GoogleHostedAuthFlow,
	GoogleSignInButtonProps,
	GoogleSignInOptions,
	SignInResult,
} from './generated/types.js'

export type {
	AppleAuth,
	AppleAuthConfig,
	AppleCredentialState,
	AppleScope,
	AppleSignInButtonProps,
	AppleSignInOptions,
	AuthCredential,
	AuthUser,
	HostedAuth,
	HostedAuthAttempt,
	HostedAuthConfig,
	HostedAuthCredentialStore,
	HostedAuthCredentials,
	HostedAuthFetch,
	HostedAuthFlow,
	HostedAuthFlowContext,
	HostedAuthPkce,
	HostedAuthRequestInit,
	HostedAuthResponse,
	HostedAuthSession,
	HostedAuthSessionResult,
	HostedAuthSignInResult,
	HostedAuthStatus,
	GoogleAuth,
	GoogleAuthConfig,
	GoogleHostedAuthFlow,
	GoogleSignInButtonProps,
	GoogleSignInOptions,
	SignInResult,
} from './generated/types.js'

export declare const appleAuth: AppleAuth
export declare const googleAuth: GoogleAuth
export declare function AppleSignInButton(props: AppleSignInButtonProps): unknown
export declare function GoogleSignInButton(props: GoogleSignInButtonProps): unknown
export declare function createHostedAuth(config: HostedAuthConfig): HostedAuth
export declare function postJson(
	transport: HostedAuthFetch,
	url: string,
	body: Record<string, string>,
): Promise<HostedAuthResponse>

export declare function queryParam(url: string, name: string): string | null
