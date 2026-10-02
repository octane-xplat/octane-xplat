import type { IconifyTransformations } from '@iconify/types'

/** SVG sizing, tint, and transforms shared by every target. */
export interface IconOptions extends IconifyTransformations {
	/** Height in logical pixels; width follows the transformed aspect ratio. Default: 24. */
	size?: number
	/** Monochrome tint. Explicit fills in multicolor icons remain intact. */
	color?: string
}

/** Props for a bundled Iconify icon. */
export interface IconProps extends IconOptions {
	/** Registered collection prefix and icon name, such as `heroicons:arrow-right`. */
	name: string
	id?: string
	className?: string
	/** Accessible description. Omit for a decorative icon. */
	label?: string
}

/** DOM-free SVG output, ready for an inline SVG or native SVGView. */
export interface IconSvg {
	body: string
	viewBox: string
	width: number
	height: number
	markup: string
}
