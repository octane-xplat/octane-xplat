export interface AnimatedImageProps {
	className?: any
	style?: any
	id?: string
	src: string
	alt?: string
	/** Content fit — same grammar as core Image. Web maps to object-fit;
	 *  ui-image (Fresco/SDWebImage) accepts the same values. */
	stretch?: 'none' | 'fill' | 'aspectFit' | 'aspectFill'
	width?: string | number
	height?: string | number
}
