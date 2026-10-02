/** @jsxImportSource @octane-xplat/macos-renderer */
import { useMemo } from 'octane'
import { appKitImageSource } from './svg-image.macos'
import type { ImageProps } from './props'

export function Image(props: ImageProps) @{
	const src = useMemo(() => appKitImageSource(props.src), [props.src])

	<image
		id={props.id}
		src={src}
		className={props.className}
		style={props.style}
		accessibilityLabel={props.alt ?? ''}
	/>
}
