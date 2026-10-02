/** @jsxImportSource @octane-xplat/macos-renderer */
import type { KeyboardAvoidingProps } from './props'
import { cx } from './cx'

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
