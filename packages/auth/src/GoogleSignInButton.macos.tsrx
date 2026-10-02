/** @jsxImportSource @octane-xplat/macos-renderer */
import { googleAuth } from './google.macos'
import type { GoogleSignInButtonProps } from './types'

/** Hosted Google sign-in trigger; Google does not provide an AppKit button. */
export function GoogleSignInButton(props: GoogleSignInButtonProps) @{
	<flexboxlayout
		id={props.id}
		className={['vx-button', props.className]}
		style={props.style}
		accessibilityRole="button"
		accessibilityLabel="Sign in with Google"
		accessibilityState={{ disabled: !!props.disabled }}
		onTap={props.disabled ? undefined : () => {
			props.onPress?.()
			void googleAuth.signIn().then((result) => props.onResult?.(result))
		}}
	>
		<label text="Sign in with Google" />
	</flexboxlayout>;
}
