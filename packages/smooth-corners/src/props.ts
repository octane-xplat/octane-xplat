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

export interface SmoothCornersProps {
	/** Radius/curve configuration — the single source of truth. `border-radius`
	 *  in `style`/`className` is ignored on this element on every target. */
	corners: CornerOptions
	border?: SmoothBorderConfig
	/** Drop shadow following the clip shape. Fidelity varies per target —
	 *  see the design note: Android uses `elevation` (fixed direction, no
	 *  offsets/spread); iOS/macOS use `shadowPath`; web uses
	 *  `filter: drop-shadow` (no spread). */
	shadow?: SmoothShadowConfig
	className?: any
	style?: any
	id?: string
	children?: any
}
