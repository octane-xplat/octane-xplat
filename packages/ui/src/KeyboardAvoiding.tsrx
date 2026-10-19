/** @jsxImportSource @nativescript-community/octane */
import { mergeStyle } from './style-merge'
import { useMemo } from 'octane'
import { refList } from './ref-list'
import type { KeyboardAvoidingProps } from './props'
import { cx } from '@octane-xplat/lib'

// Targets without mobile keyboard insets retain the shared column layout.
/**
 * Moves content out from under the on-screen keyboard without double-counting consumed insets. Import from `@octane-xplat/ui`.
 *
 * @see KeyboardAvoidingProps, useKeyboardInset.
 */
export function KeyboardAvoiding(props: KeyboardAvoidingProps) @{
	const forwardedRef = useMemo(() => refList(props.ref), [props.ref])

	<masonview
		id={props.id}
		ref={forwardedRef}
		className={cx('vx-keyboard-avoiding', props.className)}
		style={mergeStyle({ display: "flex", flexDirection: "column" }, props.style)}
	>
		{props.children}
	</masonview>
}
