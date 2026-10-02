/** @jsxImportSource @octane-xplat/macos-renderer */
import { useEffect, useRef } from 'octane'
import { appleAuth } from './apple.macos'
import { attachAppleButton } from './apple-button.macos'
import type { AppleSignInButtonProps } from './types'

/** Official ASAuthorizationAppleIDButton, embedded in the leaf's host view. */
export function AppleSignInButton(props: AppleSignInButtonProps) @{
	const anchor = useRef<any>(null)
	const handle = useRef<ReturnType<typeof attachAppleButton> | null>(null)
	const current = useRef(props)
	current.current = props

	useEffect(() => {
		if (!anchor.current) return
		handle.current = attachAppleButton(anchor.current, current.current, () => {
			const latest = current.current
			if (latest.disabled) return
			latest.onPress?.()
			void appleAuth.signIn().then((result) => current.current.onResult?.(result))
		})

		return () => { handle.current?.detach(); handle.current = null }
	}, [props.type, props.theme])

	useEffect(() => { handle.current?.update(!!props.disabled) })

	<flexboxlayout
		ref={(view: any) => { anchor.current = view }}
		id={props.id}
		className={props.className}
		style={{ width: 240, height: 44, ...props.style }}
	/>;
}
