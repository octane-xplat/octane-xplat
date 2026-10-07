/** @jsxImportSource @octane-xplat/macos-renderer */
import { useMemo } from 'octane'
import { appKitImageSource } from './svg-image.macos'
import type { ImageProps } from './props'

export function Image(props: ImageProps) @{
	const srcString = (Array.isArray(props.src) ? props.src[0]?.uri : props.src) ?? ''
	const src = useMemo(() => appKitImageSource(srcString), [srcString])
	// contentFit → style.objectFit (the renderer maps contain/scale-down/
	// fill/none; 'cover' degrades to scale-down — AppKit has no cover
	// scaling mode). contentPosition is unimplemented on this leaf.
	const style = {
		objectFit: props.contentFit ?? 'cover',
		...props.style,
	}

	<image
		id={props.id}
		src={src}
		className={props.className}
		{style}
		accessibilityLabel={props.alt ?? ''}
	/>
}
