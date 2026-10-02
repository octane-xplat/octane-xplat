/** @jsxImportSource @octane-xplat/macos-renderer */
import type { SafeAreaProps } from './props'

export function SafeArea(props: SafeAreaProps) @{
	<flexboxlayout flexDirection="column" className={props.className} style={props.style}>
		{props.children}
	</flexboxlayout>
}
