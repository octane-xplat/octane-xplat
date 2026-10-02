import type {
	AppleAuth,
	AppleAuthConfig,
	AppleCredentialState,
	AppleScope,
	AppleSignInButtonProps,
	AppleSignInOptions,
	AuthCredential,
	AuthUser,
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
