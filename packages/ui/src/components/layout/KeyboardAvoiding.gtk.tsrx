/** @jsxImportSource @octane-xplat/jsx */
import { mergeStyle } from '../../internal/layout/style-merge'
import { useMemo } from 'octane'
import { refList } from '../../internal/accessibility/ref-list'
import type { KeyboardAvoidingProps } from '../../props'
import { cx } from '@octane-xplat/lib'

// No on-screen keyboard on the GTK desktop — the component keeps the shared
// column layout (the macOS leaf's contract) without inset avoidance.
/**
 * Moves content out from under the on-screen keyboard without double-counting consumed insets. Import from `@octane-xplat/ui`.
 *
 * @see KeyboardAvoidingProps, useKeyboardInset.
 */
export function KeyboardAvoiding(props: KeyboardAvoidingProps): unknown @{
	const forwardedRef = useMemo(() => refList(props.ref), [props.ref])

	<masonview
		id={props.id}
		ref={forwardedRef}
		className={cx('vx-keyboard-avoiding', props.className)}
		style={mergeStyle({ display: 'flex', flexDirection: 'column' }, props.style)}
	>
		{props.children}
	</masonview>
}
