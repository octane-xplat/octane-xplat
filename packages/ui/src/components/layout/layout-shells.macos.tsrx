/** @jsxImportSource @octane-xplat/jsx */
import { mergeStyle } from '../../internal/layout/style-merge'
import type { SafeAreaProps } from '../../props'

export function SafeArea(props: SafeAreaProps) @{
	<masonview
		className={props.className}
		style={mergeStyle({ flexDirection: 'column' }, mergeStyle({ display: 'flex' }, props.style))}
	>
		{props.children}
	</masonview>
}
