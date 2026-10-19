/** @jsxImportSource @nativescript-community/octane */
import { mergeStyle } from './style-merge'
import type { KeyboardAvoidingProps } from './props'
import { cx } from '@octane-xplat/lib'

// Targets without mobile keyboard insets retain the shared column layout.
/**
 * Moves content out from under the on-screen keyboard without double-counting consumed insets. Import from `@octane-xplat/ui`.
 *
 * @see KeyboardAvoidingProps, useKeyboardInset.
 */
export function KeyboardAvoiding(props: KeyboardAvoidingProps) @{
	<masonview id={props.id} className={cx('vx-keyboard-avoiding', props.className)} style={mergeStyle({flexDirection: "column"}, mergeStyle({display: "flex"}, props.style as any))}>
		{props.children}
	</masonview>
}
