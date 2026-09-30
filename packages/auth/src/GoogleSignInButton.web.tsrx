import { renderGoogleButton } from './google.web';
import type { GoogleSignInButtonProps, SignInResult } from './types';

/** Google Sign-In button — web leaf. Renders the official GIS button via
 *  `renderButton` when a `clientId` is configured; without one it falls back
 *  to a plain button that runs `googleAuth.signIn()` (One Tap). `onResult`
 *  reports the outcome either way. */
export function GoogleSignInButton(props: GoogleSignInButtonProps) @{
	<div
		id={props.id}
		className={props.className}
		style={props.style}
		ref={(el: HTMLElement | null) => {
			if (el && !props.disabled) {
				void renderGoogleButton(
					el,
					{ theme: props.theme, variant: props.variant },
					(result: SignInResult) => props.onResult?.(result),
				);
			}
		}}
	/>
}
