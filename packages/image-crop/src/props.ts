/** A crop selection over the displayed (contained) image — coordinates are
 *  either displayed pixels ('px') or a fraction of the displayed image ('%').
 *  Excludes letterboxing, as react-image-crop does. */
export interface Crop {
	/** Selection origin x — in `unit`. */
	x: number
	/** Selection origin y — in `unit`. */
	y: number
	/** Selection width — in `unit`. */
	width: number
	/** Selection height — in `unit`. */
	height: number
	/** Coordinate space: displayed 'px' or '%' of the displayed image. */
	unit: 'px' | '%'
}

/** A Crop fixed to displayed-pixel coordinates. */
export interface PixelCrop extends Crop {
	/** Always 'px'. */
	unit: 'px'
}

/** A Crop fixed to percent-of-image coordinates — resolution-independent. */
export interface PercentCrop extends Crop {
	/** Always '%'. */
	unit: '%'
}

/** Displayed-pixel dimensions. */
export interface Size {
	/** Displayed width in px/DIPs. */
	width: number
	/** Displayed height in px/DIPs. */
	height: number
}

/** The positioned frame the contained image occupies inside the component
 *  box — offsets are the letterbox margins. */
export interface ImageFrame extends Size {
	/** Horizontal letterbox offset. */
	x: number
	/** Vertical letterbox offset. */
	y: number
}

/** Drag handle identifier — compass-edge resizers plus 'move' for the body. */
export type CropHandle = 'move' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'nw'
/** Constraints applied while dragging a crop selection. */
export interface CropConstraints {
	/** Fixed width / height ratio in displayed coordinates. */
	aspect?: number
	/** Minimum displayed width in pixels / DIPs, including for percentage crops. */
	minWidth?: number
	/** Minimum displayed height in pixels / DIPs, including for percentage crops. */
	minHeight?: number
	/** Maximum displayed width in pixels / DIPs. */
	maxWidth?: number
	/** Maximum displayed height in pixels / DIPs. */
	maxHeight?: number
}

/** Props for the `<ImageCrop>` element — react-image-crop's data contract
 *  with cross-platform gesture surfaces. */
export interface ImageCropProps extends CropConstraints {
	/** Image URL. */
	src: string
	/** Accessible image description. */
	alt?: string
	/** Natural image dimensions; must match the decoded, oriented source. */
	imageWidth: number
	/** Natural image height — same contract as `imageWidth`. */
	imageHeight: number
	/** Controlled crop relative to the contained image, excluding letterboxing. */
	crop: Crop
	/** Update crop with either argument; both describe the same selection. */
	onChange: (pixelCrop: PixelCrop, percentCrop: PercentCrop) => void
	/** Called once on gesture end; cancellation does not complete. */
	onComplete?: (pixelCrop: PixelCrop, percentCrop: PercentCrop) => void
	/** Disables crop interaction; the selection remains rendered. */
	disabled?: boolean
	/** Overlay rule-of-thirds guide lines. */
	ruleOfThirds?: boolean
	/** Frame dimensions in CSS pixels / native DIPs. */
	width: number
	/** Frame height — same units as `width`. */
	height: number
	/** Element id passed through to the host element. */
	id?: string
}
