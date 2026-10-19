/** @jsxImportSource octane */
import { useMemo } from 'octane'
import { refList } from './ref-list'
import type { KeyboardAvoidingProps } from './props'
import { cx } from '@octane-xplat/lib'

// Web keeps the wrapper's layout and styling, without claiming keyboard avoidance.
export function KeyboardAvoiding(props: KeyboardAvoidingProps) @{
	const forwardedRef = useMemo(() => refList(props.ref), [props.ref])

	<div
		id={props.id}
		ref={forwardedRef}
		className={cx('vx-keyboard-avoiding', props.className)}
		style={props.style}
		{...props.web}
	>
		{props.children}
	</div>
}
