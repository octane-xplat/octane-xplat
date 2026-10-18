/** @jsxImportSource @nativescript-community/octane */
import { mergeStyle } from './style-merge'
import type { ButtonGroupProps } from './props'
import { ButtonGroupProvider } from './button-group-context'
import { SizeProvider, useSize } from './size-context'
import { cx } from '@octane-xplat/lib'

/**
 * Connected button row — shared surface, one tab stop, arrow-key navigation on web. Import from `@octane-xplat/ui`.
 *
 * @see ButtonGroupProps.
 */
export function ButtonGroup(props: ButtonGroupProps) @{
	const orientation = props.orientation ?? 'horizontal'
	const size = useSize(props.size, 'md')
	const value = { orientation, isDisabled: !!props.isDisabled, size, position: 'only' as const }

	<ButtonGroupProvider value={value}>
		<SizeProvider value={size}>
			<masonview id={props.id} className={cx('vx-button-group', `vx-button-group--${orientation}`, props.className)} style={mergeStyle({display: "flex"}, props.style as any)} accessible={true} accessibilityLabel={props.label}>
				{props.children}
			</masonview>
		</SizeProvider>
	</ButtonGroupProvider>
}
