export interface Crop {
	x: number
	y: number
	width: number
	height: number
	unit: 'px' | '%'
}

export interface PixelCrop extends Crop {
	unit: 'px'
}

export interface PercentCrop extends Crop {
	unit: '%'
}

export interface Size {
	width: number
	height: number
}

export interface ImageFrame extends Size {
	x: number
	y: number
}

export type CropHandle = 'move' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'nw'
export interface CropConstraints {
	/** Fixed width / height ratio in displayed coordinates. */
	aspect?: number
	/** Minimum displayed width in pixels / DIPs, including for percentage crops. */
	minWidth?: number
	/** Minimum displayed height in pixels / DIPs, including for percentage crops. */
	minHeight?: number
	maxWidth?: number
	maxHeight?: number
}

export interface ImageCropProps extends CropConstraints {
	src: string
	alt?: string
	/** Natural image dimensions; must match the decoded, oriented source. */
	imageWidth: number
	imageHeight: number
	/** Controlled crop relative to the contained image, excluding letterboxing. */
	crop: Crop
	/** Update crop with either argument; both describe the same selection. */
	onChange: (pixelCrop: PixelCrop, percentCrop: PercentCrop) => void
	/** Called once on gesture end; cancellation does not complete. */
	onComplete?: (pixelCrop: PixelCrop, percentCrop: PercentCrop) => void
	disabled?: boolean
	ruleOfThirds?: boolean
	/** Frame dimensions in CSS pixels / native DIPs. */
	width: number
	height: number
	id?: string
}
