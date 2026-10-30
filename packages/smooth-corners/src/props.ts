/** Shared props for `SmoothCorners` — identical on every leaf. */

/** Corner curve family. `'continuous'` is Apple's corner (the default) —
 *  reproduced via the Rosenfeld `UIBezierPath` cubic constants, ~0.25 px
 *  from live SwiftUI `.continuous`. The rest delegate to `@lisse/core`:
 *  `squircle` = Figma's corner smoothing, `superellipse` = |x|^n+|y|^n=1,
 *  `clothoid` = Euler-spiral blend, `arc` = plain circular border-radius. */
export type CornerCurve = 'continuous' | 'squircle' | 'superellipse' | 'clothoid' | 'arc'

/** One corner's radius + curve family. */
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
/** Per-corner overrides — a bare number is shorthand for { radius }. */
export interface PerCornerConfig {
	/** Top-left corner. */
	topLeft?: CornerConfig | number
	/** Top-right corner. */
	topRight?: CornerConfig | number
	/** Bottom-right corner. */
	bottomRight?: CornerConfig | number
	/** Bottom-left corner. */
	bottomLeft?: CornerConfig | number
}

/** Corner spec: a shared CornerConfig, per-corner overrides, or a bare
 *  radius in dips. */
export type CornerOptions = CornerConfig | PerCornerConfig | number

/** Border drawn inside the smoothed edge. */
export interface SmoothBorderConfig {
	/** Stroke width in dips, painted inside the clip edge. */
	width: number
	/** Any color string the platform accepts (hex, rgba, named). */
	color: string
}

/** Drop-shadow applied with the same smoothed silhouette. */
export interface SmoothShadowConfig {
	color?: string
	/** Shadow opacity 0-1. */
	opacity?: number
	/** Horizontal offset in dips. */
	offsetX?: number
	/** Vertical offset in dips. */
	offsetY?: number
	/** Blur radius in dips. */
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
	/** Zero-based row index in the parent grid. */
	row?: number
	/** Zero-based column index in the parent grid. */
	col?: number
	/** Row tracks to span (>= 1). */
	rowSpan?: number
	/** Column tracks to span (>= 1). */
	colSpan?: number
	/** Edge of the parent dock layout this child pins to. */
	dock?: 'left' | 'top' | 'right' | 'bottom'
	/** Absolute x offset in dips inside an absolute-layout parent. */
	left?: number
	/** Absolute y offset in dips inside an absolute-layout parent. */
	top?: number
	/** Absolute right-edge offset in dips inside an absolute-layout parent. */
	right?: number
	/** Absolute bottom-edge offset in dips inside an absolute-layout parent. */
	bottom?: number
	/** Horizontal self-alignment inside the parent — NS alignment vocabulary. */
	horizontalAlignment?: 'left' | 'center' | 'middle' | 'right' | 'stretch'
	/** Vertical self-alignment inside the parent. */
	verticalAlignment?: 'top' | 'center' | 'middle' | 'bottom' | 'stretch'
	/** Flex grow factor along the parent main axis. */
	flexGrow?: number
	/** Flex shrink factor along the parent main axis. */
	flexShrink?: number
	/** Cross-axis alignment override for this child. */
	alignSelf?: string
	/** Sibling ordering — lower orders lay out first. */
	order?: number
}

/** Flex-container props for the element's own children — RN vocabulary,
 *  applied to the inner flex host on web and the AppKit macOS leaf.
 *  The native leaf's inner container is a gridlayout, so these are
 *  web/macOS-only there. `gap` is a dip number (px on web). */
export interface FlexContainerProps {
	/** Main-axis distribution of children. */
	justifyContent?: 'start' | 'center' | 'end' | 'space-between' | 'space-around' | 'space-evenly'
	/** Cross-axis alignment of children. */
	alignItems?: 'start' | 'center' | 'end' | 'stretch' | 'baseline'
	/** Child wrapping (boolean shorthand or wrap direction). */
	flexWrap?: boolean | 'wrap' | 'nowrap' | 'wrap-reverse'
	/** Gap between children — dips on native, px on web; FlexboxLayout only natively. */
	gap?: number | string
	/** Row gap — same units contract as `gap`. */
	rowGap?: number | string
	/** Column gap — same units contract as `gap`. */
	columnGap?: number | string
}

/** Props for the SmoothCorners element — a container with non-circular
 *  corner curves. */
export interface SmoothCornersProps extends LayoutChildProps, FlexContainerProps {
	/** Radius/curve configuration — the single source of truth. `border-radius`
	 *  in `style`/`className` is ignored on this element on every target. */
	corners: CornerOptions
	/** Border drawn inside the smoothed edge. */
	border?: SmoothBorderConfig
	/** Drop shadow following the clip shape. Fidelity varies per target —
	 *  see the design note: Android uses `elevation` (fixed direction, no
	 *  offsets/spread); iOS/macOS use `shadowPath`; web uses
	 *  `filter: drop-shadow` (no spread). */
	shadow?: SmoothShadowConfig
	/** Main-axis direction of the inner flex host — the renderer default is
	 *  column. Web/macOS-only like the rest of FlexContainerProps. */
	flexDirection?: 'row' | 'column' | 'row-reverse' | 'column-reverse'
	/** Class list applied to the container element. */
	className?: any
	/** Inline style (string CSS or object). `border-radius` is ignored —
	 *  use `corners`. */
	style?: any
	/** Element id passed through to the host element. */
	id?: string
	/** Content the container lays out. */
	children?: any
}
