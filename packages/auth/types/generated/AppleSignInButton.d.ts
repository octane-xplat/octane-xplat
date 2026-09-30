import type { AppleSignInButtonProps } from './types.js';
/**  Sign in with Apple button — the platform-authentic
 *  ASAuthorizationAppleIDButton on iOS, a plain fallback button elsewhere.
 *  A tap starts `appleAuth.signIn()`; `onResult` reports the outcome. */
export declare function AppleSignInButton(props: AppleSignInButtonProps): unknown;
