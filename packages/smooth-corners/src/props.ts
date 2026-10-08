/** Shared props for `SmoothCorners` — identical on every leaf. */

/** Corner curve family. `'continuous'` is Apple's corner (the default) —
 *  reproduced via the Rosenfeld `UIBezierPath` cubic constants, ~0.25 px
 *  from live SwiftUI `.continuous`. The rest delegate to `@lisse/core`:
 *  `squircle` = Figma's corner smoothing, `superellipse` = |x|^n+|y|^n=1,
 *  `clothoid` = Euler-spiral blend, `arc` = plain circular border-radius. */
export type CornerCurve = 'continuous' | 'squircle' | 'superellipse' | 'clothoid' | 'arc'

export interface CornerConfig {
	/** Nominal corner radius in dips (matches `border-radius`). */
	radius: number
	/** Curve family. Default `'continuous'`. */
	curve?: CornerCurve
	/** 0–1 smoothing — used by `squircle`/`clothoid`, ignored elsewhere.
	 *  Figma's "iOS" preset is 0.6; Lisse's closest-fit is 0.65. */
	smoothing?: number
	/** Superellipse exponent (`n`); only `superellipse`. Default 4. */
	exponent?: number
	/** Preserve smoothing when space is limited. Default true. */
	preserveSmoothing?: boolean
}

/** Per-corner configuration — each value is a CornerConfig or a radius
 *  shorthand. */
export interface PerCornerConfig {
	topLeft?: CornerConfig | number
	topRight?: CornerConfig | number
	bottomRight?: CornerConfig | number
	bottomLeft?: CornerConfig | number
}

export type CornerOptions = CornerConfig | PerCornerConfig | number

export interface SmoothBorderConfig {
	/** Stroke width in dips, painted inside the clip edge. */
	width: number
	/** Any color string the platform accepts (hex, rgba, named). */
	color: string
}

export interface SmoothShadowConfig {
	color?: string
	opacity?: number
	offsetX?: number
	offsetY?: number
	blur?: number
	/** Spread is web/iOS/macOS only — Android elevation cannot express it. */
	spread?: number
}

/** Metadata read by parent layouts — the shared LayoutChildProps contract,
 *  plus the edges and grid-cell alignments the AppKit absolute/grid parents
 *  consume (`right`/`bottom`, `horizontalAlignment`/`verticalAlignment`).
 *  On SmoothCorners these land on the outer wrapper — the node the parent
 *  layout sees as its child. Native forwards the attached attributes;
 *  `right`/`bottom` are honored by the AppKit absolute layout and web CSS
 *  only (NativeScript AbsoluteLayout reads left/top). */
export interface LayoutChildProps {
	row?: number
	col?: number
	rowSpan?: number
	colSpan?: number
	dock?: 'left' | 'top' | 'right' | 'bottom'
	left?: number
	top?: number
	right?: number
	bottom?: number
	horizontalAlignment?: 'left' | 'center' | 'middle' | 'right' | 'stretch'
	verticalAlignment?: 'top' | 'center' | 'middle' | 'bottom' | 'stretch'
	flexGrow?: number
	flexShrink?: number
	alignSelf?: string
	order?: number
}

/** Flex-container props for the element's own children — RN vocabulary,
 *  applied to the inner flex host on web and the AppKit macOS leaf.
 *  The native leaf's inner container is a gridlayout, so these are
 *  web/macOS-only there. `gap` is a dip number (px on web). */
export interface FlexContainerProps {
	justifyContent?: 'start' | 'center' | 'end' | 'space-between' | 'space-around' | 'space-evenly'
	alignItems?: 'start' | 'center' | 'end' | 'stretch' | 'baseline'
	flexWrap?: boolean | 'wrap' | 'nowrap' | 'wrap-reverse'
	gap?: number | string
	rowGap?: number | string
	columnGap?: number | string
}

export interface SmoothCornersProps extends LayoutChildProps, FlexContainerProps {
	/** Radius/curve configuration — the single source of truth. `border-radius`
	 *  in `style`/`className` is ignored on this element on every target. */
	corners: CornerOptions
	border?: SmoothBorderConfig
	/** Drop shadow following the clip shape. Fidelity varies per target —
	 *  see the design note: Android uses `elevation` (fixed direction, no
	 *  offsets/spread); iOS/macOS use `shadowPath`; web uses
	 *  `filter: drop-shadow` (no spread). */
	shadow?: SmoothShadowConfig
	/** Main-axis direction of the inner flex host — the renderer default is
	 *  column. Web/macOS-only like the rest of FlexContainerProps. */
	flexDirection?: 'row' | 'column' | 'row-reverse' | 'column-reverse'
	className?: any
	style?: any
	id?: string
	children?: any
}
