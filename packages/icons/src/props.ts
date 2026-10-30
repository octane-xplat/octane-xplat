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
	/** Element id passed through to the host element. */
	id?: string
	/** Class list applied to the rendered svg element. */
	className?: string
	/** Accessible description. Omit for a decorative icon. */
	label?: string
}

/** DOM-free SVG output, ready for an inline SVG or native SVGView. */
export interface IconSvg {
	/** Inner SVG fragment (paths/shapes), after Iconify transforms. */
	body: string
	/** `min-x min-y width height` viewBox string for the outer <svg>. */
	viewBox: string
	/** Rendered width in px after `size` scaling and aspect preservation. */
	width: number
	/** Rendered height in px — equals `size` in IconOptions. */
	height: number
	/** Complete serialized `<svg …>…</svg>` string. */
	markup: string
}
