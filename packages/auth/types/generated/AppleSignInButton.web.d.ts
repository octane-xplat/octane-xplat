import type { AppleSignInButtonProps } from './types.js';
/**  Sign in with Apple button — web leaf. Apple's JS API renders official
 *  markup only through its own stylesheet hooks, so this is a styled fallback
 *  matching Apple's published button spec; the click runs the popup flow via
 *  `appleAuth.signIn()` and reports through `onResult`. */
export declare function AppleSignInButton(props: AppleSignInButtonProps): import("octane/jsx-runtime").JSX.Element;
