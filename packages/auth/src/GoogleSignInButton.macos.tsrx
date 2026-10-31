/** @jsxImportSource @octane-xplat/jsx */
import { useEffect, useRef } from 'octane'
import { googleAuth } from './google.macos'
import { createSignInButtonAction } from './sign-in-button-action.macos'
import type { GoogleSignInButtonProps } from './types'

/** Native NSButton trigger for hosted Google sign-in; no official AppKit Google button. */
export function GoogleSignInButton(props: GoogleSignInButtonProps) @{
	const current = useRef(props)
	current.current = props
	const action = useRef(createSignInButtonAction(() => current.current, () => googleAuth.signIn()))
	useEffect(() => action.current.mount(), [])

	<button
		id={props.id}
		className={['vx-button', props.className]}
		style={{ display: 'flex', ...props.style }}
		text="Sign in with Google"
		accessibilityLabel="Sign in with Google"
		isEnabled={!props.disabled}
		onTap={() => action.current.press()}
	/>
}
