import { effectiveStyle } from './style-values.ts'
import type { PropBag, ElementNode } from './model'
import {
  CGPathAddArcToPoint,
  CGPathAddLineToPoint,
  CGPathCloseSubpath,
  CGPathCreateMutable,
  CGPathMoveToPoint,
  NSColor,
  NSView,
} from '@octane-xplat/platform/macos'
import { nativeColor } from './native-colors'

export type BorderSide = 'top' | 'right' | 'bottom' | 'left'
export type BorderCorner = 'topLeft' | 'topRight' | 'bottomRight' | 'bottomLeft'

export const BORDER_SIDES: readonly BorderSide[] = ['top', 'right', 'bottom', 'left']

export const BORDER_CORNERS: readonly BorderCorner[] = [
  'topLeft',
  'topRight',
  'bottomRight',
  'bottomLeft',
]

// `1px`/`1`/`thin` → points; CSS keyword widths map like the web.
export function borderLength(value: any): number {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? Math.max(0, value) : 0
  }
  const text = String(value ?? '')
    .trim()
    .toLowerCase()
  if (text === 'thin') {
    return 1
  }
  if (text === 'medium') {
    return 3
  }
  if (text === 'thick') {
    return 5
  }
  const points = parseFloat(text)
  return Number.isFinite(points) ? Math.max(0, points) : 0
}

// Radius slot: points, or 'N%' of min(width, height) like the old
// single-radius path.
export function borderRadiusPoints(value: any, width: number, height: number): number {
  if (typeof value === 'string' && value.trim().endsWith('%')) {
    const pct = parseFloat(value)
    return Number.isFinite(pct) ? Math.max(0, (pct / 100) * Math.min(width, height)) : 0
  }
  return borderLength(value)
}

// Resolve the four corner radii in points (pre-clamp — uniformity is judged
// here so a zero-size frame cannot collapse distinct radii).
export function resolveBorderRadii(spec: PropBag | undefined, w: number, h: number) {
  return {
    topLeft: borderRadiusPoints(spec?.topLeft, w, h),
    topRight: borderRadiusPoints(spec?.topRight, w, h),
    bottomRight: borderRadiusPoints(spec?.bottomRight, w, h),
    bottomLeft: borderRadiusPoints(spec?.bottomLeft, w, h),
  }
}

// CSS pairwise scale-down when adjacent radii overflow their shared edge.
export function scaleBorderRadii(radii: Record<BorderCorner, number>, w: number, h: number) {
  let scale = 1
  const edges: [BorderCorner, BorderCorner, number][] = [
    ['topLeft', 'topRight', w],
    ['topRight', 'bottomRight', h],
    ['bottomLeft', 'bottomRight', w],
    ['topLeft', 'bottomLeft', h],
  ]
  for (const [a, b, edge] of edges) {
    const sum = radii[a] + radii[b]
    if (sum > edge && sum > 0) {
      scale = Math.min(scale, edge / sum)
    }
  }
  if (scale < 1) {
    const scaled = { ...radii }
    for (const corner of BORDER_CORNERS) {
      scaled[corner] *= scale
    }

    return scaled
  }
  return radii
}

export const BORDER_STYLE_WORDS = new Set([
  'none',
  'hidden',
  'solid',
  'dashed',
  'dotted',
  'double',
  'groove',
  'ridge',
  'inset',
  'outset',
])

// Per-corner rounded-rect CGPath in the layer's y-up space — CSS top corners
// sit at y = height. `into` appends the subpath (ring building); dx/dy shift
// the whole rect. Null when the runtime globals are absent (slice tests).
export function roundedBoxCGPath(
  w: number,
  h: number,
  radii: Record<BorderCorner, number>,
  dx = 0,
  dy = 0,
  into?: any,
): any {
  if (typeof CGPathCreateMutable !== 'function') {
    return null
  }
  const path = into ?? CGPathCreateMutable()
  const corner = (vx: number, vy: number, nx: number, ny: number, r: number) => {
    if (r > 0) {
      CGPathAddArcToPoint(path, null, vx + dx, vy + dy, nx + dx, ny + dy, r)
    } else {
      CGPathAddLineToPoint(path, null, vx + dx, vy + dy)
    }
  }
  CGPathMoveToPoint(path, null, radii.topLeft + dx, h + dy)
  corner(w, h, w, h - radii.topRight, radii.topRight)
  CGPathAddLineToPoint(path, null, w + dx, radii.bottomRight + dy)
  corner(w, 0, w - radii.bottomRight, 0, radii.bottomRight)
  CGPathAddLineToPoint(path, null, radii.bottomLeft + dx, 0 + dy)
  corner(0, 0, 0, radii.bottomLeft, radii.bottomLeft)
  CGPathAddLineToPoint(path, null, 0 + dx, h - radii.topLeft + dy)
  corner(0, h, radii.topLeft, h, radii.topLeft)
  CGPathCloseSubpath(path)
  return path
}

// Center a stroke inside the outer border box while retaining rounded corners.
export function borderStrokeCGPath(
  w: number,
  h: number,
  radii: Record<BorderCorner, number>,
  width: number,
) {
  const inset = Math.min(width / 2, w / 2, h / 2)
  const inner = Object.fromEntries(
    BORDER_CORNERS.map((corner) => [corner, Math.max(0, radii[corner] - inset)]),
  ) as Record<BorderCorner, number>
  return roundedBoxCGPath(
    w - inset * 2,
    h - inset * 2,
    scaleBorderRadii(inner, w - inset * 2, h - inset * 2),
    inset,
    inset,
  )
}

export function borderBandCGPath(points: [number, number][]): any {
  if (typeof CGPathCreateMutable !== 'function' || !points.length) {
    return null
  }
  const path = CGPathCreateMutable()
  const [first, ...rest] = points
  CGPathMoveToPoint(path, null, first[0], first[1])
  for (const [x, y] of rest) {
    CGPathAddLineToPoint(path, null, x, y)
  }
  CGPathCloseSubpath(path)
  return path
}

// Unparseable colors (color-mix, unknown functions) read as no color rather
// than throwing mid-apply — nativeColor is strict by design elsewhere.
export function borderNSColor(node: ElementNode, value: any): NSColor | null {
  const raw = value ?? effectiveStyle(node).color ?? '#000'
  try {
    return nativeColor(raw)
  } catch {
    return null
  }
}

export function outsetShadowOnSelf(
  shadows: readonly { inset: boolean }[] | undefined,
  view: NSView,
): boolean {
  if (!(shadows?.some((s) => !s.inset) === true)) {
    return false
  }
  return view.layer?.superlayer == null && view.superview == null
}
