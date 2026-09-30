/** @jsxImportSource @nativescript-community/octane */
import { registerElement } from '@nativescript-community/octane';
import * as applePlugin from '@nativescript/apple-sign-in';
import { appleAuth } from './apple';
import type { AppleSignInButtonProps, SignInResult } from './types';

// The plugin's SignInButton wraps ASAuthorizationAppleIDButton — iOS only
// (the class is absent from the plugin's Android module), so register it
// conditionally and fall back to a plain button everywhere else.
const PluginButton = (applePlugin as any).SignInButton;
if (PluginButton) {
	registerElement('applesigninbutton', PluginButton);
}

/** Sign in with Apple button — the platform-authentic
 *  ASAuthorizationAppleIDButton on iOS, a plain fallback button elsewhere.
 *  A tap starts `appleAuth.signIn()`; `onResult` reports the outcome. */
export function AppleSignInButton(props: AppleSignInButtonProps) @{
	const run = () => {
		props.onPress?.();
		if (props.onResult) {
			appleAuth.signIn().then((result: SignInResult) => props.onResult?.(result));
		}
	};

	@if (PluginButton && appleAuth.supported) {
		<applesigninbutton
			id={props.id}
			className={props.className}
			style={props.style}
			type={props.type ?? 'default'}
			buttonStyle={props.theme ?? 'black'}
			isEnabled={props.disabled !== true}
			onTap={run}
		/>
	} @else {
		<button
			id={props.id}
			className={props.className}
			style={props.style}
			text={props.type === 'signUp' ? 'Sign up with Apple' : props.type === 'continue' ? 'Continue with Apple' : 'Sign in with Apple'}
			isEnabled={props.disabled !== true}
			onTap={run}
		/>
	}
}
