import type { GoogleSignInButtonProps } from './types.js';
/**  Google Sign-In button — the provider's button view on iOS/Android. A tap
 *  starts `googleAuth.signIn()`; `onResult` reports the outcome. Requires a
 *  `googleAuth.configure()` call first where the platform needs it. */
export declare function GoogleSignInButton(props: GoogleSignInButtonProps): unknown;
