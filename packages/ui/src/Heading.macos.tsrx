/** @jsxImportSource @xplat/macos/renderer */
import type { HeadingProps } from './props'

export function Heading(props: HeadingProps) @{
	<label id={props.id} className={props.className} style={props.style} accessibilityRole="heading">
		{props.children}
	</label>
}
