/** @jsxImportSource @nativescript-community/octane */
import type { KeyboardAvoidingProps } from './props'
import { cx } from './cx'

// Targets without mobile keyboard insets retain the shared column layout.
export function KeyboardAvoiding(props: KeyboardAvoidingProps) @{
	<flexboxlayout
		id={props.id}
		flexDirection="column"
		className={cx('vx-keyboard-avoiding', props.className)}
		style={props.style}
	>
		{props.children}
	</flexboxlayout>
}
