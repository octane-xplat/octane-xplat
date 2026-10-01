/** @jsxImportSource @nativescript-community/octane */
import type { ButtonGroupProps } from './props'
import { ButtonGroupProvider } from './button-group-context'
import { cx } from './cx'

export function ButtonGroup(props: ButtonGroupProps) @{
	const orientation = props.orientation ?? 'horizontal'
	const value = { orientation, isDisabled: !!props.isDisabled, size: props.size ?? 'md', position: 'only' as const }

	<ButtonGroupProvider value={value}>
		<flexboxlayout id={props.id} className={cx('vx-button-group', `vx-button-group--${orientation}`, props.className)} style={props.style} accessible={true} accessibilityLabel={props.label}>
			{props.children}
		</flexboxlayout>
	</ButtonGroupProvider>
}
