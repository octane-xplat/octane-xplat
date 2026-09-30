/** @jsxImportSource @nativescript-community/octane */
import { registerElement } from '@nativescript-community/octane';
import { GoogleSignInButton as NSGoogleSignInButton } from '@nativescript/google-signin';
import { googleAuth } from './google';
import type { GoogleSignInButtonProps, SignInResult } from './types';

// GIDSignInButton (iOS) / the plugin's Google button (Android). The plugin
// emits the standard `tap` event — the driver's onTap alias wires it.
registerElement('googlesigninbutton', NSGoogleSignInButton);

/** Google Sign-In button — the provider's button view on iOS/Android. A tap
 *  starts `googleAuth.signIn()`; `onResult` reports the outcome. Requires a
 *  `googleAuth.configure()` call first where the platform needs it. */
export function GoogleSignInButton(props: GoogleSignInButtonProps) @{
	const run = () => {
		props.onPress?.();
		if (props.onResult) {
			googleAuth.signIn().then((result: SignInResult) => props.onResult?.(result));
		}
	};

	<googlesigninbutton
		id={props.id}
		className={props.className}
		style={props.style}
		colorScheme={props.theme ?? 'auto'}
		colorStyle={props.variant ?? 'standard'}
		isEnabled={props.disabled !== true}
		onTap={run}
	/>
}
