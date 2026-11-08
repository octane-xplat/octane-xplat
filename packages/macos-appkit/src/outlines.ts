import type { BoxPaintState } from './box-paint-state'
import type { BorderCorner } from './box-geometry'
import {
  BORDER_SIDES,
  BORDER_CORNERS,
  resolveBorderRadii,
  scaleBorderRadii,
  BORDER_STYLE_WORDS,
  roundedBoxCGPath,
  borderStrokeCGPath,
  borderBandCGPath,
} from './box-geometry.ts'

import { effectiveStyle } from './style-values.ts'
import type { PropBag, ElementNode } from './model'
import { nativeColor } from './native-colors'
import {
  CALayer,
  CAShapeLayer,
  CGPathCreateMutable,
  NSColor,
  NSNumber,
  NSView,
} from '@octane-xplat/platform/macos'

import { correctProjectionRadii } from './projection-paint'
import {
  borderStrokeStyle,
  borderBands,
  borderBandPoints,
  darkBorderComponents,
} from './border-styles.ts'

import { srgbComponents } from './color-components'

export type Outlines = ReturnType<typeof createOutlines>

export function createOutlines() {
  // `outline`/`outline-*` draws a stroked ring outside the border edge — a
  // CALayer framing the bounds expanded by offset + width. `none` clears it.
  function outlineSpec(style: PropBag) {
    let width: number | undefined
    let styleName: string | undefined
    let color: any
    const shorthand = style.outline

    if (shorthand != null && shorthand !== '') {
      for (const token of String(shorthand).trim().split(/\s+/)) {
        if (/^[+-]?[\d.]+(px)?$/.test(token)) {
          width = parseFloat(token)
        } else if (
          [
            'none',
            'hidden',
            'solid',
            'dotted',
            'dashed',
            'double',
            'groove',
            'ridge',
            'inset',
            'outset',
            'auto',
          ].includes(token)
        ) {
          styleName = token
        } else {
          color = token
        }
      }
    }

    const longWidth = Number(style.outlineWidth)

    if (Number.isFinite(longWidth)) {
      width = longWidth
    }

    if (style.outlineStyle != null) {
      styleName = String(style.outlineStyle)
    }

    if (style.outlineColor != null) {
      color = style.outlineColor
    }

    const offset = Number(style.outlineOffset)

    if (width == null || width <= 0 || styleName === 'none' || styleName === 'hidden') {
      return null
    }

    return {
      width,
      style: styleName === 'auto' || styleName == null ? 'solid' : styleName,
      color: color != null ? nativeColor(color) : NSColor.keyboardFocusIndicatorColor,
      offset: Number.isFinite(offset) ? offset : 0,
    }
  }

  // `outline`/`outline-*` draws a ring outside the border edge — a layer framing
  // the bounds expanded by offset + width. Solid keeps the CALayer border fast
  // path; dashed/dotted stroke the centered rounded path like uniform-pattern
  // borders; double/groove/ridge/inset/outset paint the same shaded per-side
  // bands borders use, on the expanded box. `none`/`hidden` clear.
  function syncOutline(node: ElementNode, state: BoxPaintState) {
    const view = node.view!

    clearOutline(node, state)

    const spec = outlineSpec(effectiveStyle(node))

    if (!spec || !view.layer) {
      return
    }

    const layers = typeof CAShapeLayer !== 'undefined' && typeof CGPathCreateMutable === 'function'

    if (!layers && spec.style !== 'solid') {
      const warned = (state.outlineWarnings ??= new Set<string>())

      if (!warned.has(spec.style)) {
        warned.add(spec.style)
        console.warn('[macos-css] outline layers unavailable; drawing solid')
      }
    }

    const style = layers ? spec.style : 'solid'

    if (
      !['solid', 'dashed', 'dotted', 'double', 'groove', 'ridge', 'inset', 'outset'].includes(style)
    ) {
      const warned = (state.outlineWarnings ??= new Set<string>())

      if (!warned.has(style)) {
        warned.add(style)
        console.warn(
          '[macos-css] unsupported outline-style ' + JSON.stringify(spec.style) + '; drawing solid',
        )
      }
    }

    view.wantsLayer = true

    const host = CALayer.alloc().init()

    state.outlineLayer = host
    host.backgroundColor = null
    view.layer.addSublayer(host)

    const outline = spec
    const resize = () => {
      const grow = outline.offset + outline.width
      const w = Math.max(0, Number(view.bounds.size.width))
      const h = Math.max(0, Number(view.bounds.size.height))
      const W = w + grow * 2
      const H = h + grow * 2

      host.frame = { origin: { x: -grow, y: -grow }, size: { width: W, height: H } }

      const specBorder = state.borderSpec
      const scaled = scaleBorderRadii(
        correctProjectionRadii(
          view,
          resolveBorderRadii(specBorder?.radii, w, h),
          specBorder?.radii,
        ),
        w,
        h,
      )

      const outerRadii = Object.fromEntries(
        BORDER_CORNERS.map((c) => [c, scaled[c] + grow]),
      ) as Record<BorderCorner, number>

      if (style === 'solid' || !BORDER_STYLE_WORDS.has(style)) {
        host.borderWidth = outline.width
        host.borderColor = outline.color?.CGColor ?? null
        host.cornerRadius = Number(view.layer.cornerRadius) + grow
        return
      }

      host.borderWidth = 0
      host.borderColor = null
      host.cornerRadius = 0

      const stroke = borderStrokeStyle(style, outline.width)

      if (stroke) {
        const shape = ((state.outlineShapes ??= {}).stroke ??= CAShapeLayer.alloc().init())

        if (shape.superlayer !== host) {
          host.addSublayer(shape)
        }

        shape.frame = { origin: { x: 0, y: 0 }, size: { width: W, height: H } }
        shape.fillColor = null
        shape.strokeColor = outline.color?.CGColor ?? null
        shape.lineWidth = outline.width
        shape.lineDashPattern = stroke.pattern.map((v) => NSNumber.numberWithDouble(v))
        shape.lineDashPhase = 0
        shape.lineCap = stroke.cap
        shape.path = borderStrokeCGPath(W, H, outerRadii, outline.width)
        for (const side of BORDER_SIDES) {
          for (const extra of state.outlineShapes?.[side] ?? []) {
            extra.hidden = true
          }
        }

        return
      }

      // Decorative styles: per-side shaded bands on the expanded box, masked
      // to the outer rounded outline. Inner band edges stay straight at
      // rounded corners — the same limit the border bands carry.
      const mask = (state.outlineMask ??= CAShapeLayer.alloc().init())

      mask.frame = { origin: { x: 0, y: 0 }, size: { width: W, height: H } }
      mask.path = roundedBoxCGPath(W, H, outerRadii)
      host.mask = mask
      if (state.outlineShapes?.stroke) {
        state.outlineShapes.stroke.hidden = true
      }

      const widths = {
        top: outline.width,
        right: outline.width,
        bottom: outline.width,
        left: outline.width,
      }

      for (const side of BORDER_SIDES) {
        const bands = borderBands(style, side, outline.width)
        const shapes = ((state.outlineShapes ??= {})[side] ??= [] as any[])

        for (let i = 0; i < bands.length; i++) {
          const shape = (shapes[i] ??= CAShapeLayer.alloc().init())

          if (shape.superlayer !== host) {
            host.addSublayer(shape)
          }

          shape.frame = { origin: { x: 0, y: 0 }, size: { width: W, height: H } }
          shape.hidden = false
          shape.strokeColor = null
          shape.path = borderBandCGPath(
            borderBandPoints(side, W, H, widths, bands[i].from, bands[i].to),
          )

          shape.fillColor =
            bands[i].shade === 'dark'
              ? (darkOutlineColor(outline.color, view)?.CGColor ?? outline.color?.CGColor)
              : outline.color?.CGColor
        }

        for (let i = bands.length; i < shapes.length; i++) {
          shapes[i].hidden = true
        }
      }
    }

    state.outlineResize = resize
    resize()
  }

  function syncOutlineGeometry(node: ElementNode, state: BoxPaintState) {
    state.outlineResize?.()
  }

  function clearOutline(node: ElementNode, state: BoxPaintState) {
    const host = state.outlineLayer

    state.outlineResize = undefined
    state.outlineLayer = null
    state.outlineMask = undefined
    state.outlineShapes = undefined
    host?.removeFromSuperlayer()
  }

  function darkOutlineColor(base: NSColor | null, view: NSView): NSColor | null {
    const components = base && srgbComponents(base, view.effectiveAppearance)

    if (!components) {
      return base
    }

    const dark = darkBorderComponents(components)

    return (
      NSColor.colorWithSRGBRedGreenBlueAlpha(dark.red, dark.green, dark.blue, dark.alpha) ?? base
    )
  }

  return {
    syncOutline,
    syncOutlineGeometry,
    clearOutline,
  }
}
