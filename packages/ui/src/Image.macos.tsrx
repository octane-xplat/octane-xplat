/** @jsxImportSource @xplat/macos/renderer */
import type { ImageProps } from './props'

export function Image(props: ImageProps) @{
	<image
		id={props.id}
		src={props.src}
		className={props.className}
		style={props.style}
		accessibilityLabel={props.accessibilityLabel}
	/>
}
