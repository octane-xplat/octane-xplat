import { flipCommandsY, generateCommands } from './path'
import { colorChannels } from './validation.ts'
import type { PathCommand } from './path'
import type { SmoothCornersProps } from './props'

declare const CGPathCreateMutable: any
declare const CGPathMoveToPoint: any
declare const CGPathAddLineToPoint: any
declare const CGPathAddCurveToPoint: any
declare const CGPathAddArc: any
declare const CGPathCloseSubpath: any
declare const CAShapeLayer: any
declare const NSColor: any
declare const NSMakeSize: any

function colorValue(input: string | undefined): any {
  const [r, g, b, a] = colorChannels(input ?? '#000000')

  return NSColor.colorWithSRGBRedGreenBlueAlpha(r / 255, g / 255, b / 255, a)
}

/** Build Core Graphics directly: the AppKit bridge does not expose
 * NSBezierPath.CGPath. Mirror the shared y-down geometry once for layer space. */
function toCGPath(cmds: PathCommand[], h: number): any {
  const path = CGPathCreateMutable()
  const rad = (degrees: number) => (degrees * Math.PI) / 180

  for (const c of flipCommandsY(cmds, h)) {
    switch (c.c) {
      case 'M':
        CGPathMoveToPoint(path, null, c.x, c.y)
        break
      case 'L':
        CGPathAddLineToPoint(path, null, c.x, c.y)
        break
      case 'C':
        CGPathAddCurveToPoint(path, null, c.x1, c.y1, c.x2, c.y2, c.x, c.y)
        break
      case 'A':
        CGPathAddArc(
          path,
          null,
          c.cx,
          c.cy,
          c.r,
          rad(c.startDeg),
          rad(c.startDeg + c.sweepDeg),
          c.sweepDeg < 0,
        )

        break
      case 'Z':
        CGPathCloseSubpath(path)
        break
    }
  }

  return path
}

const MASK_KEY = '__smoothMask'
const BORDER_KEY = '__smoothBorder'

export function applySmoothClip(
  view: any,
  w: number,
  h: number,
  props: SmoothCornersProps,
  clip = true,
): void {
  if (view && !clip) {
    if (view.layer && view.layer.mask === view[MASK_KEY]) {
      view.layer.mask = null
    }

    return
  }

  if (!view || w <= 0 || h <= 0) {
    return
  }

  view.wantsLayer = true

  const path = toCGPath(generateCommands(w, h, props.corners), h)

  let mask = view[MASK_KEY] as any

  if (!mask) {
    mask = CAShapeLayer.new()
    view[MASK_KEY] = mask
  }

  mask.path = path
  view.layer.mask = mask

  let borderLayer = view[BORDER_KEY] as any
  const border = props.border

  if (border && border.width > 0 && border.color) {
    if (!borderLayer) {
      borderLayer = CAShapeLayer.new()
      view[BORDER_KEY] = borderLayer
      view.layer.addSublayer(borderLayer)
    }

    borderLayer.frame = view.layer.bounds
    borderLayer.path = path
    borderLayer.fillColor = null
    borderLayer.strokeColor = colorValue(border.color).CGColor
    borderLayer.lineWidth = border.width * 2
  } else if (borderLayer) {
    borderLayer.removeFromSuperlayer()
    view[BORDER_KEY] = null
  }
}

export function applySmoothShadow(
  view: any,
  w: number,
  h: number,
  props: SmoothCornersProps,
): void {
  if (!view) {
    return
  }

  view.wantsLayer = true

  const layer = view.layer
  const shadow = props.shadow

  if (!shadow || w <= 0 || h <= 0) {
    layer.shadowOpacity = 0
    layer.shadowPath = null
    return
  }

  const spread = shadow.spread ?? 0
  const gw = spread !== 0 ? w + spread * 2 : w
  const gh = spread !== 0 ? h + spread * 2 : h

  if (gw <= 0 || gh <= 0) {
    layer.shadowPath = null
    layer.shadowOpacity = 0
    return
  }

  const path = toCGPath(generateCommands(gw, gh, props.corners), gh)

  layer.shadowPath = path
  layer.shadowColor = colorValue(shadow.color).CGColor
  layer.shadowOpacity = shadow.opacity ?? 0.35
  layer.shadowRadius = shadow.blur ?? 0

  const ox = shadow.offsetX ?? 0
  // y-up shadow offsets invert vertically vs CSS.
  const oy = -(shadow.offsetY ?? 0)

  layer.shadowOffset = NSMakeSize
    ? NSMakeSize(spread !== 0 ? -spread + ox : ox, spread !== 0 ? -spread + oy : oy)
    : { width: ox, height: oy }
}
