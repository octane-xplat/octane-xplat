/** @jsxImportSource @xplat/macos/renderer */
import type { AvatarGroupProps } from './props'

export function AvatarGroup(props: AvatarGroupProps) @{
	<flexboxlayout flexDirection="row" className={props.className} style={props.style}>
		{props.children}
	</flexboxlayout>
}
