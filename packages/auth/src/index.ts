// Platform barrels — explicit .tsrx leaf imports (moduleSuffixes don't
// reach .tsrx; same convention as @octane-xplat/ui index.*.ts).
export { appleAuth } from './apple'
export { googleAuth } from './google'
export { AppleSignInButton } from './AppleSignInButton.tsrx'
export { GoogleSignInButton } from './GoogleSignInButton.tsrx'
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
	GoogleSignInButtonProps,
	GoogleSignInOptions,
	SignInResult,
} from './types'
