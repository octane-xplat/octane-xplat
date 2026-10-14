/** @jsxImportSource @nativescript-community/octane */
import type { KeyboardAvoidingProps } from './props'
import { cx } from '@octane-xplat/lib'

// Targets without mobile keyboard insets retain the shared column layout.
export function KeyboardAvoiding(props: KeyboardAvoidingProps) @{
	<flexboxlayout
		id={props.id}
		flexDirection="column"
		className={cx('vx-keyboard-avoiding', props.className)}
		style={props.style as any}
	>
		{props.children}
	</flexboxlayout>
}
