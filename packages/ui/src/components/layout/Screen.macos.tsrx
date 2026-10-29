/** @jsxImportSource @octane-xplat/jsx */
import { mergeStyle } from '../../internal/layout/style-merge'
import type { ScreenProps } from '../../props'
import { cx } from '@octane-xplat/lib'

export function Screen(props: ScreenProps) @{
	<masonview
		id={props.id}
		className={cx('vx-screen', props.className)}
		style={mergeStyle({ flexDirection: 'column' }, mergeStyle({ display: 'flex' }, props.style))}
	>
		{props.children}
	</masonview>
}
