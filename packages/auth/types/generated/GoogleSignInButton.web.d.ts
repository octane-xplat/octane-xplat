import type { GoogleSignInButtonProps } from './types.js';
/**  Google Sign-In button — web leaf. Renders the official GIS button via
 *  `renderButton` when a `clientId` is configured; without one it falls back
 *  to a plain button that runs `googleAuth.signIn()` (One Tap). `onResult`
 *  reports the outcome either way. */
export declare function GoogleSignInButton(props: GoogleSignInButtonProps): import("octane/jsx-runtime").JSX.Element;
