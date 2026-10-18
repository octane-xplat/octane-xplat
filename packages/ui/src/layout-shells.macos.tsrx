/** @jsxImportSource @octane-xplat/macos-renderer */
import type { SafeAreaProps } from './props'

export function SafeArea(props: SafeAreaProps) @{
	<masonview display="flex" flexDirection="column" className={props.className} style={props.style}>{props.children}</masonview>
}
