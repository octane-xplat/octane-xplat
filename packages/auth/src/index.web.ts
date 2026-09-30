// Platform barrels — explicit .tsrx leaf imports (moduleSuffixes don't
// reach .tsrx; same convention as @octane-xplat/ui index.*.ts).
export { appleAuth } from './apple.web';
export { googleAuth } from './google.web';
export { AppleSignInButton } from './AppleSignInButton.web.tsrx';
export { GoogleSignInButton } from './GoogleSignInButton.web.tsrx';
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
} from './types';
