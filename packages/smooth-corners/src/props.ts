import type { ClassValue, CSSProperties } from 'octane/jsx-runtime'

/** Shared props for `SmoothCorners` — identical on every leaf. */

/** Corner curve family. `'continuous'` is Apple's corner (the default) —
 *  approximated with the Rosenfeld `UIBezierPath` cubic constants. The rest delegate to `@lisse/core`:
 *  `squircle` = Figma's corner smoothing, `superellipse` = |x|^n+|y|^n=1,
 *  `clothoid` = Euler-spiral blend, `arc` = plain circular border-radius. */
export type CornerCurve = 'continuous' | 'squircle' | 'superellipse' | 'clothoid' | 'arc'

/** One corner's radius + curve family. */
export interface CornerConfig {
  /** Finite, non-negative corner radius in logical pixels (DIPs on native). */
  radius: number
  /** Curve family. Default `'continuous'`. */
  curve?: CornerCurve
  /** 0–1 smoothing — used by `squircle`/`clothoid`, ignored elsewhere.
   *  Figma's "iOS" preset is 0.6; Lisse's closest-fit is 0.65. */
  smoothing?: number
  /** Finite superellipse exponent (`n`), at least 2. Default 4. */
  exponent?: number
  /** Preserve smoothing when space is limited. Default true. */
  preserveSmoothing?: boolean
}

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
  /** CSS #rgb/#rgba/#rrggbb/#rrggbbaa, rgb(), rgba(), or transparent. */
  color: string
}

/** Drop-shadow applied with the same smoothed silhouette. */
export interface SmoothShadowConfig {
  /** CSS #rgb/#rgba/#rrggbb/#rrggbbaa, rgb(), rgba(), or transparent. */
  color?: string
  /** Shadow opacity 0-1. */
  opacity?: number
  /** Horizontal offset in dips. */
  offsetX?: number
  /** Vertical offset in dips. */
  offsetY?: number
  /** Blur radius in dips. */
  blur?: number
  /** Finite spread in logical pixels; negative values shrink the silhouette. */
  spread?: number
}

/** Metadata read by parent layouts — the shared LayoutChildProps contract,
 *  plus the edges and grid-cell alignments the AppKit absolute/grid parents
 *  consume (`right`/`bottom`, `horizontalAlignment`/`verticalAlignment`).
 *  These map to CSS grid, alignment and absolute edges on the outer Mason/DOM
 *  wrapper. Use a shared Mason parent to interpret them on native. */
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

/** Android's native elevation shadow; distinct from a portable blur radius. */
export interface SmoothAndroidConfig {
  /** Finite, non-negative elevation in DIPs. Default 0. OS controls shadow appearance. */
  elevation?: number
}

/** Props for the SmoothCorners element — a container with non-circular
 *  corner curves. Caller content defaults to block flow; select flex/grid with className/style.
 * Invalid numeric/color inputs throw before native drawing.
 * @example
 * ```tsx
 * import { SmoothCorners } from '@octane-xplat/smooth-corners'
 * <SmoothCorners corners={24} style={{ width: 200, height: 120, backgroundColor: '#dbeafe' }} />
 * ```
 */
export interface SmoothCornersProps extends LayoutChildProps {
  /** Radius/curve configuration — the single source of truth. `border-radius`
   *  in `style`/`className` is ignored on this element on every target. */
  corners: CornerOptions
  /** Border drawn inside the smoothed edge. */
  border?: SmoothBorderConfig
  /** Path-shaped shadow on web, iOS and AppKit macOS. Throws on Android;
   * use `android.elevation` there. Blur rendering is native to each engine. */
  shadow?: SmoothShadowConfig
  /** Explicit Android-only rendering options; ignored on other targets. */
  android?: SmoothAndroidConfig
  /** Class list applied to the container element. */
  className?: ClassValue
  /** Dynamic CSS property object. Use className for static CSS. `border-radius` is ignored —
   * use `corners`. Overflow defaults to `visible`: only the surface is
   * shaped. Set `overflow: 'hidden'` to clip descendants to the same curve.
   * The component's own shadow remains outside the content clip. */
  style?: CSSProperties
  /** Element id passed through to the host element. */
  id?: string
  /** Content the container lays out. */
  children?: unknown
}
