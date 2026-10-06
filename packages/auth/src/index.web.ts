// Platform barrels — explicit .tsrx leaf imports (moduleSuffixes don't
// reach .tsrx; same convention as @octane-xplat/ui index.*.ts).
export { appleAuth } from './apple.web'
export { googleAuth } from './google.web'
export { AppleSignInButton } from './AppleSignInButton.web.tsrx'
export { GoogleSignInButton } from './GoogleSignInButton.web.tsrx'
export { createHostedAuth, postJson, queryParam } from './hosted'
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
} from './types'
