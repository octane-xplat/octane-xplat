/** @jsxImportSource @octane-xplat/jsx/dom */
import { Image } from '@octane-xplat/ui'
import type { ImageCropProps } from './props'
import type { JSX } from 'octane/jsx-runtime'
export function Source(
	props: Pick<ImageCropProps, 'src' | 'alt' | 'width' | 'height'>,
): JSX.Element @{
	<Image
		src={props.src}
		alt={props.alt}
		style={{
			width: props.width,
			height: props.height,
			objectFit: 'contain',
			pointerEvents: 'none',
			userSelect: 'none',
		}}
		web={{ draggable: false }}
	/>
}
