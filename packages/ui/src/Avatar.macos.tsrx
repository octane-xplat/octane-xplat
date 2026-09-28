/** @jsxImportSource @xplat/macos/renderer */
import type { AvatarProps } from './props'

export function Avatar(props: AvatarProps) @{
	<label className={props.className} style={props.style} accessibilityRole="image" accessibilityLabel={props.accessibilityLabel ?? props.name}>
		{props.name ?? 'Avatar'}
	</label>
}
