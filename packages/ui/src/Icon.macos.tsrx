/** @jsxImportSource @xplat/macos/renderer */
import type { IconProps } from './props'

export function Icon(props: IconProps) @{
	<label className={props.className} style={props.style} accessibilityLabel={props.accessibilityLabel ?? props.name}>
		{props.name}
	</label>
}
