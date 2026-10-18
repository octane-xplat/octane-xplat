/** @jsxImportSource @octane-xplat/macos-renderer */
import type { ButtonGroupProps } from './props'
import { ButtonGroupProvider } from './button-group-context'
import { SizeProvider, useSize } from './size-context'
import { cx } from '@octane-xplat/lib'

export function ButtonGroup(props: ButtonGroupProps) @{
	const orientation = props.orientation ?? 'horizontal'
	const size = useSize(props.size, 'md')
	const value = { orientation, isDisabled: !!props.isDisabled, size, position: 'only' as const }

	<ButtonGroupProvider value={value}>
		<SizeProvider value={size}>
			<masonview display="flex" id={props.id} className={cx('vx-button-group', `vx-button-group--${orientation}`, props.className)} style={props.style} accessible={true} accessibilityLabel={props.label}>
				{props.children}
			</masonview>
		</SizeProvider>
	</ButtonGroupProvider>
}
