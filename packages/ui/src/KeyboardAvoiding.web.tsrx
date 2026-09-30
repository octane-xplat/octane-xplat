/** @jsxImportSource octane */
import type { KeyboardAvoidingProps } from './props'
import { cx } from './cx'

// Web keeps the wrapper's layout and styling, without claiming keyboard avoidance.
export function KeyboardAvoiding(props: KeyboardAvoidingProps) @{
	<div
		id={props.id}
		className={cx('vx-keyboard-avoiding', props.className)}
		style={props.style}
		{...props.web}
	>
		{props.children}
	</div>
}
