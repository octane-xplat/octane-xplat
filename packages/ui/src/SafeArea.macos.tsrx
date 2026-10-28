/** @jsxImportSource @octane-xplat/macos-renderer */
import { mergeStyle } from './style-merge'
import type { SafeAreaProps } from './props'

export function SafeArea(props: SafeAreaProps) @{
	<masonview
		className={props.className}
		style={mergeStyle({ flexDirection: 'column' }, mergeStyle({ display: 'flex' }, props.style))}
	>
		{props.children}
	</masonview>
}
