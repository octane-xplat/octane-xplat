/** @jsxImportSource @nativescript-community/octane */
import { Image } from '@octane-xplat/ui'
import type { ImageCropProps } from './props'
export function Source(props: Pick<ImageCropProps, 'src' | 'alt' | 'width' | 'height'>) @{
	<Image src={props.src} alt={props.alt} style={{ width: props.width, height: props.height }}
		ios={{ stretch: 'aspectFit', isUserInteractionEnabled: false }}
		android={{ stretch: 'aspectFit', isUserInteractionEnabled: false }} />
}
