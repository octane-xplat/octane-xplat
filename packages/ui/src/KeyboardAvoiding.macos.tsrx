/** @jsxImportSource @octane-xplat/macos-renderer */
import type { KeyboardAvoidingProps } from './props'
import { cx } from '@octane-xplat/lib'

export function KeyboardAvoiding(props: KeyboardAvoidingProps) @{
	<masonview display="flex" id={props.id} flexDirection="column" className={cx('vx-keyboard-avoiding', props.className)} style={props.style}>
		{props.children}
	</masonview>
}
