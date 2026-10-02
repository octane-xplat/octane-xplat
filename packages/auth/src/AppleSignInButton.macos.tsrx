/** @jsxImportSource @octane-xplat/macos-renderer */
import { appleAuth } from './apple.macos'
import type { AppleSignInButtonProps, SignInResult } from './types'

const LABELS = {
	default: 'Sign in with Apple',
	signUp: 'Sign up with Apple',
	continue: 'Continue with Apple',
} as const

/** Sign in with Apple button — macOS leaf. The AppKit renderer has no
 *  ASAuthorizationAppleIDButton in its vocabulary, so this is a flexbox row
 *  with a click-gesture tap (the same shape as Pressable/controls.macos)
 *  that runs the AuthenticationServices flow and reports through `onResult`.
 *  onPress on the intrinsic <button> is not used — the universal compile
 *  emits DOM-only delegateEvents for it. */
export function AppleSignInButton(props: AppleSignInButtonProps) @{
	<flexboxlayout
		id={props.id}
		className={['vx-button', props.className]}
		style={props.style}
		accessibilityLabel={LABELS[props.type ?? 'default']}
		onTap={
			props.disabled === true
				? undefined
				: () => {
						props.onPress?.()
						if (props.onResult) {
							void appleAuth.signIn().then((result: SignInResult) => props.onResult?.(result))
						}
					}
		}
	>
		<label text={LABELS[props.type ?? 'default']} />
	</flexboxlayout>
}
