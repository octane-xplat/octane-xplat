/** @jsxImportSource @octane-xplat/macos-renderer */
import { mergeStyle } from './style-merge'
import type { KeyboardAvoidingProps } from './props'
import { cx } from '@octane-xplat/lib'

export function KeyboardAvoiding(props: KeyboardAvoidingProps) @{
	<masonview id={props.id} flexDirection="column" className={cx('vx-keyboard-avoiding', props.className)} style={mergeStyle({display: "flex"}, props.style)}>
		{props.children}
	</masonview>
}
