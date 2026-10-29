/** @jsxImportSource @octane-xplat/jsx */
import { useEffect, useRef } from 'octane'
import { appleAuth } from './apple.macos'
import { attachAppleButton } from './apple-button.macos'
import { createSignInButtonAction } from './sign-in-button-action.macos'
import type { AppleSignInButtonProps } from './types'

/** Official ASAuthorizationAppleIDButton, embedded in the leaf's host view. */
export function AppleSignInButton(props: AppleSignInButtonProps) @{
	const anchor = useRef<any>(null)
	const handle = useRef<ReturnType<typeof attachAppleButton> | null>(null)
	const current = useRef(props)
	current.current = props
	const action = useRef(createSignInButtonAction(() => current.current, () => appleAuth.signIn()))
	useEffect(() => action.current.mount(), [])

	useEffect(() => {
		if (!anchor.current) {
			return
		}

		let attached = true
		const attachment = attachAppleButton(anchor.current, current.current, () => {
			if (attached) action.current.press()
		})
		handle.current = attachment
		return () => {
			attached = false
			attachment.detach()
			if (handle.current === attachment) handle.current = null
		}
	}, [props.type, props.theme])

	useEffect(() => {
		handle.current?.update(!!props.disabled)
	})

	<masonview
		ref={(view: any) => {
			anchor.current = view
		}}
		id={props.id}
		className={props.className}
		style={{
			display: 'flex',
			width: 240,
			height: 44,
			...props.style,
		}}
	/>
}
