import { FailureCollector } from './failures.ts'
import type { BoxPaintState } from './box-paint-state'
import {
  BORDER_SIDES,
  BORDER_CORNERS,
  borderLength,
  resolveBorderRadii,
  scaleBorderRadii,
  BORDER_STYLE_WORDS,
  roundedBoxCGPath,
  borderStrokeCGPath,
  borderBandCGPath,
  borderNSColor,
  outsetShadowOnSelf,
} from './box-geometry.ts'

import type { BorderSide, BorderCorner } from './box-geometry'
import { effectiveStyle } from './style-values.ts'
import type { ElementNode } from './model'
import { splitStyleTokens } from './css-text.ts'
import {
  CALayer,
  CAShapeLayer,
  CGPathCreateMutable,
  NSColor,
  NSNumber,
} from '@octane-xplat/platform/macos'

import {
  borderStyleSides,
  hiddenBorderStyle,
  borderStrokeStyle,
  borderBands,
  borderBandPoints,
  darkBorderComponents,
} from './border-styles.ts'

import { correctProjectionRadii } from './projection-paint'
import { srgbComponents } from './color-components'

export type BorderPaint = ReturnType<typeof createBorderPaint>

export function createBorderPaint() {
  // camelCase style keys → the slot each writes; 'all' expands to every
  // side/corner. CSS border shorthands land as longhands (computeCascade
  // borderLonghands); `border`/`border-{side}` arrive whole and split here.
  const BORDER_WIDTH_KEYS: Record<string, BorderSide | 'all'> = {
    borderWidth: 'all',
    borderTopWidth: 'top',
    borderRightWidth: 'right',
    borderBottomWidth: 'bottom',
    borderLeftWidth: 'left',
  }

  const BORDER_COLOR_KEYS: Record<string, BorderSide | 'all'> = {
    borderColor: 'all',
    borderTopColor: 'top',
    borderRightColor: 'right',
    borderBottomColor: 'bottom',
    borderLeftColor: 'left',
  }

  const BORDER_RADIUS_KEYS: Record<string, BorderCorner | 'all'> = {
    borderRadius: 'all',
    borderTopLeftRadius: 'topLeft',
    borderTopRightRadius: 'topRight',
    borderBottomRightRadius: 'bottomRight',
    borderBottomLeftRadius: 'bottomLeft',
  }

  const BORDER_EDGE_KEYS: Record<string, BorderSide | 'all'> = {
    border: 'all',
    borderTop: 'top',
    borderRight: 'right',
    borderBottom: 'bottom',
    borderLeft: 'left',
  }

  // Border style declarations repaint the resolved side geometry.
  const BORDER_STYLE_KEYS = new Set([
    'borderStyle',
    'borderTopStyle',
    'borderRightStyle',
    'borderBottomStyle',
    'borderLeftStyle',
  ])

  // Whitespace/comma tokenizers come from ./css-text.ts.

  const BORDER_WIDTH_RE = /^[+-]?(?:\d+\.?\d*|\.\d+)(?:px|dip|pt)?$|^thin$|^medium$|^thick$/i

  // `border[-side]: <width> <style> <color>` arrives whole (no shorthand
  // expansion upstream of the bag), so split it here. `border: 0` and
  // `border: none` zero the widths.
  function parseBorderEdge(value: any): { width: any; color: any } {
    if (typeof value === 'number') {
      return { width: value, color: undefined }
    }
    let width: any
    let color: any
    let none = false
    for (const token of splitStyleTokens(String(value ?? ''))) {
      const lower = token.toLowerCase()
      if (BORDER_STYLE_WORDS.has(lower)) {
        none = none || lower === 'none' || lower === 'hidden'
        continue
      }

      if (width === undefined && BORDER_WIDTH_RE.test(token)) {
        width = token
        continue
      }

      color = color === undefined ? token : `${color} ${token}`
    }
    return { width: none ? 0 : width, color }
  }

  // Trapezoid covering one side's border band between the outer rect and the
  // inner border edge — the four sides partition the ring at the miters.
  function borderSideCGPath(
    side: BorderSide,
    w: number,
    h: number,
    widths: Record<BorderSide, number>,
  ): any {
    return borderBandCGPath(borderBandPoints(side, w, h, widths, 0, 1))
  }

  function setBorderSlot(
    node: ElementNode,
    state: BoxPaintState,
    group: 'widths' | 'colors' | 'radii',
    slot: BorderSide | BorderCorner | 'all',
    value: any,
  ) {
    const spec = (state.borderSpec ??= {})
    const bag = (spec[group] ??= {})
    if (slot === 'all') {
      for (const key of group === 'radii' ? BORDER_CORNERS : BORDER_SIDES) {
        bag[key] = value
      }
    } else {
      bag[slot] = value
    }
  }

  function clearBorderSlot(
    node: ElementNode,
    state: BoxPaintState,
    group: 'widths' | 'colors' | 'radii',
    slot: BorderSide | BorderCorner | 'all',
  ) {
    const bag = state.borderSpec?.[group]
    if (bag) {
      if (slot === 'all') {
        for (const key of group === 'radii' ? BORDER_CORNERS : BORDER_SIDES) {
          delete bag[key]
        }
      } else {
        delete bag[slot]
      }
    }
  }

  // `border`/`border-{side}` shorthand text feeds the same width/color slots.
  function setBorderEdge(
    node: ElementNode,
    state: BoxPaintState,
    slot: BorderSide | 'all',
    value: any,
  ) {
    const { width, color } = parseBorderEdge(value)
    const spec = (state.borderSpec ??= {})
    const sides = slot === 'all' ? BORDER_SIDES : [slot]
    if (width !== undefined) {
      const widths = (spec.widths ??= {})
      for (const side of sides) {
        widths[side] = width
      }
    }
    if (color !== undefined) {
      const colors = (spec.colors ??= {})
      for (const side of sides) {
        colors[side] = color
      }
    }
  }

  function clearBorderEdge(node: ElementNode, state: BoxPaintState, slot: BorderSide | 'all') {
    const spec = state.borderSpec
    for (const side of slot === 'all' ? BORDER_SIDES : [slot]) {
      delete spec?.widths?.[side]
      delete spec?.colors?.[side]
    }
  }

  function removeBorderLayers(node: ElementNode, state: BoxPaintState) {
    const host = state.borderLayer
    const bands = Object.values(state.borderBandShapes ?? {}).flat()
    state.borderLayer = null
    state.borderSides = undefined
    state.borderOutline = undefined
    state.borderStroke = undefined
    state.borderSideMasks = undefined
    state.borderBandShapes = undefined
    const failures = new FailureCollector()
    failures.run('border host', () => host?.removeFromSuperlayer())
    for (const shape of bands) {
      failures.run('border band', () => shape.removeFromSuperlayer())
    }
    failures.throwIfFailed()
  }

  function disposeBorder(node: ElementNode, state: BoxPaintState) {
    const failures = new FailureCollector()
    state.borderSpec = undefined
    state.cornerMask = undefined
    failures.run('border layers', () => removeBorderLayers(node, state))
    failures.throwIfFailed()
  }

  // borderRadius styles and per-side border slots resolve on the node and sync
  // here. CALayer takes one borderWidth/borderColor/cornerRadius, so uniform
  // boxes stay on the fast path; anything else draws through masked
  // CAShapeLayer trapezoids clipped to the rounded outline — banded styles
  // (double/groove/ridge/inset/outset) split each side into shaded bands.
  function syncBorderBox(node: ElementNode, state: BoxPaintState) {
    const view = node.view
    if (!view) {
      return
    }

    const size = view.frame?.size ?? { width: 0, height: 0 }
    const w = Number.isFinite(Number(size.width)) ? Math.max(0, Number(size.width)) : 0
    const h = Number.isFinite(Number(size.height)) ? Math.max(0, Number(size.height)) : 0
    const spec = state.borderSpec
    const resolvedStyle = effectiveStyle(node)
    const sideStyles = borderStyleSides(resolvedStyle)

    const radii = correctProjectionRadii(view, resolveBorderRadii(spec?.radii, w, h), spec?.radii)
    const maxRadius = Math.max(radii.topLeft, radii.topRight, radii.bottomRight, radii.bottomLeft)
    const uniformRadius =
      radii.topLeft === radii.topRight &&
      radii.topRight === radii.bottomRight &&
      radii.bottomRight === radii.bottomLeft
    const scaled = scaleBorderRadii(radii, w, h)

    const widths: Record<BorderSide, number> = {
      top: borderLength(spec?.widths?.top),
      right: borderLength(spec?.widths?.right),
      bottom: borderLength(spec?.widths?.bottom),
      left: borderLength(spec?.widths?.left),
    }
    for (const side of BORDER_SIDES) {
      if (hiddenBorderStyle(sideStyles[side])) {
        widths[side] = 0
      } else if (
        !['solid', 'dashed', 'dotted', 'double', 'groove', 'ridge', 'inset', 'outset'].includes(
          sideStyles[side],
        )
      ) {
        const warned = (state.borderStyleWarnings ??= new Set())
        if (!warned.has(sideStyles[side])) {
          warned.add(sideStyles[side])
          console.warn('[macos-css] Unsupported decorative border style; drawing solid')
        }
      }
    }
    const maxWidth = Math.max(widths.top, widths.right, widths.bottom, widths.left)
    const uniformWidth =
      widths.top === widths.right && widths.right === widths.bottom && widths.bottom === widths.left
    const normColor = (c: any) =>
      c == null ? '' : typeof c === 'string' ? c.trim().toLowerCase() : c
    const uniformColor = BORDER_SIDES.every(
      (side) => normColor(spec?.colors?.[side]) === normColor(spec?.colors?.top),
    )

    const layers = typeof CAShapeLayer !== 'undefined' && typeof CGPathCreateMutable === 'function'
    // An outset shadow painted on the view's own layer (the no-superlayer
    // fallback) cannot render under a mask or masksToBounds — the layer clip
    // loses to the shadow (same CALayer constraint UIKit has). Sibling shadow
    // hosts keep clipping on.
    const outsetShadow = outsetShadowOnSelf(state.boxShadowSpec, view)
    const perCorner = maxRadius > 0 && !uniformRadius && layers && !outsetShadow
    const patterned = BORDER_SIDES.some(
      (side) => borderStrokeStyle(sideStyles[side], widths[side]) != null,
    )
    const uniformPattern =
      patterned &&
      uniformWidth &&
      uniformColor &&
      BORDER_SIDES.every((side) => sideStyles[side] === sideStyles.top)
    // Decorative styles (double/groove/ridge/inset/outset) paint as filled
    // bands per side; a single base band collapses back to the solid path.
    const singleBaseBand = (bands: { from: number; to: number; shade: string }[]) =>
      bands.length === 1 && bands[0].from === 0 && bands[0].to === 1 && bands[0].shade === 'base'
    const banded = BORDER_SIDES.some(
      (side) =>
        widths[side] > 0 && !singleBaseBand(borderBands(sideStyles[side], side, widths[side])),
    )
    const layered =
      maxWidth > 0 && (!(uniformWidth && uniformColor) || patterned || banded) && layers
    if (patterned && !layers) {
      console.warn('[macos-css] Patterned border layers unavailable; drawing solid')
    }
    if (banded && !layers) {
      console.warn('[macos-css] Decorative border layers unavailable; drawing solid')
    }

    if (maxRadius > 0 || maxWidth > 0) {
      view.wantsLayer = true
    }
    // NSView.layer is nil until wantsLayer — a view with only cleared or
    // shadow/transform styles may still lack one.
    const layer = view.layer
    if (!layer) {
      return
    }

    // Corners: a uniform radius stays on cornerRadius; per-corner radii clip
    // through a mask path instead.
    if (perCorner) {
      const mask = (state.cornerMask ??= CAShapeLayer.alloc().init())
      mask.path = roundedBoxCGPath(w, h, scaled)
      layer.mask = mask
      layer.cornerRadius = 0
      state.cornerMaskApplied = true
    } else {
      if (state.cornerMaskApplied) {
        layer.mask = null as any
        state.cornerMaskApplied = false
      }

      // The fast path writes the raw value — CA caps the radius internally,
      // and a 0×0 pre-layout frame must not zero it (the observer-less
      // uniform case never resyncs).
      layer.cornerRadius = maxRadius
    }

    const clip = maxRadius > 0 && !outsetShadow
    if (clip || state.radiusApplied) {
      layer.masksToBounds = clip
    }
    state.radiusApplied = clip

    if (layered) {
      layer.borderWidth = 0
      layer.borderColor = null
      if (!state.borderLayer) {
        state.borderLayer = CALayer.alloc().init()
        layer.insertSublayerAtIndex(
          state.borderLayer,
          (state.bgHost ? 1 : 0) + (state.insetShadowHost ? 1 : 0),
        )
      }

      const box = state.borderLayer
      box.frame = { origin: { x: 0, y: 0 }, size: { width: w, height: h } }
      if (maxRadius > 0) {
        const outline = (state.borderOutline ??= CAShapeLayer.alloc().init())
        outline.frame = { origin: { x: 0, y: 0 }, size: { width: w, height: h } }
        outline.path = roundedBoxCGPath(w, h, scaled)
        box.mask = outline
      } else {
        box.mask = null as any
      }

      const paintStroke = (shape: any, style: string, width: number, color: any) => {
        const stroke = borderStrokeStyle(style, width)!
        shape.fillColor = null
        shape.strokeColor = color
        shape.lineWidth = width
        shape.lineDashPattern = stroke.pattern.map((value) => NSNumber.numberWithDouble(value))
        shape.lineDashPhase = 0
        shape.lineCap = stroke.cap
        shape.path = borderStrokeCGPath(w, h, scaled, width)
      }

      // Chromium Color::Dark() shading for 3D border bands — pattern colors
      // carry no sRGB components and keep the base fill.
      const darkBandColor = (base: NSColor | null, fallback: any) => {
        const components = base && srgbComponents(base, view.effectiveAppearance)
        if (!components) {
          return fallback
        }
        const dark = darkBorderComponents(components)
        return (
          NSColor.colorWithSRGBRedGreenBlueAlpha(dark.red, dark.green, dark.blue, dark.alpha)
            ?.CGColor ?? fallback
        )
      }

      const hideBandExtras = (side: BorderSide) => {
        for (const extra of state.borderBandShapes?.[side] ?? []) {
          extra.hidden = true
        }
      }

      if (uniformPattern) {
        const stroke = (state.borderStroke ??= CAShapeLayer.alloc().init())
        if (stroke.superlayer !== box) {
          box.addSublayer(stroke)
        }

        stroke.frame = { origin: { x: 0, y: 0 }, size: { width: w, height: h } }
        stroke.hidden = false
        paintStroke(
          stroke,
          sideStyles.top,
          widths.top,
          borderNSColor(node, spec?.colors?.top)?.CGColor ?? null,
        )

        for (const shape of Object.values(state.borderSides ?? {}) as any[]) {
          shape.hidden = true
        }

        for (const side of BORDER_SIDES) {
          hideBandExtras(side)
        }
      } else {
        if (state.borderStroke) {
          state.borderStroke.hidden = true
        }

        for (const side of BORDER_SIDES) {
          const shape = ((state.borderSides ??= {})[side] ??= CAShapeLayer.alloc().init())
          if (shape.superlayer !== box) {
            box.addSublayer(shape)
          }

          shape.frame = { origin: { x: 0, y: 0 }, size: { width: w, height: h } }
          shape.hidden = widths[side] === 0
          // Native setters accept nil; these generated bindings omit null.
          Object.assign(shape, { mask: null })
          shape.strokeColor = null
          shape.lineWidth = 0
          Object.assign(shape, { lineDashPattern: null })
          shape.fillColor = null
          if (widths[side] === 0) {
            hideBandExtras(side)
            continue
          }

          const baseNSColor = borderNSColor(node, spec?.colors?.[side])
          const color = baseNSColor?.CGColor ?? null
          if (borderStrokeStyle(sideStyles[side], widths[side])) {
            paintStroke(shape, sideStyles[side], widths[side], color)
            const mask = ((state.borderSideMasks ??= {})[side] ??= CAShapeLayer.alloc().init())
            mask.frame = shape.frame
            mask.path = borderSideCGPath(side, w, h, widths)
            mask.fillColor = borderNSColor(node, '#000')?.CGColor ?? null
            shape.mask = mask
            hideBandExtras(side)
          } else {
            // Decorative styles paint each band as its own trapezoid — the
            // first reuses the side's shape layer, extra bands stack on
            // per-side CAShapeLayers so dark fills stay independent.
            const bands = borderBands(sideStyles[side], side, widths[side])
            shape.path = borderBandCGPath(
              borderBandPoints(side, w, h, widths, bands[0].from, bands[0].to),
            )

            shape.fillColor = bands[0].shade === 'dark' ? darkBandColor(baseNSColor, color) : color
            const extras = ((state.borderBandShapes ??= {})[side] ??= [] as any[])
            for (let i = 1; i < bands.length; i++) {
              const extra = (extras[i - 1] ??= CAShapeLayer.alloc().init())
              if (extra.superlayer !== box) {
                box.addSublayer(extra)
              }

              extra.frame = shape.frame
              extra.hidden = false
              extra.path = borderBandCGPath(
                borderBandPoints(side, w, h, widths, bands[i].from, bands[i].to),
              )

              extra.fillColor =
                bands[i].shade === 'dark' ? darkBandColor(baseNSColor, color) : color
            }

            for (let i = bands.length - 1; i < extras.length; i++) {
              extras[i].hidden = true
            }
          }
        }
      }
    } else {
      removeBorderLayers(node, state)
      // Uniform borders use the CALayer slots; without shape layers the top
      // edge's values stand in — deterministic like the collapsed engine.
      layer.borderWidth = widths.top
      layer.borderColor =
        maxWidth > 0 && widths.top > 0
          ? (borderNSColor(node, spec?.colors?.top)?.CGColor ?? null)
          : null
    }

    state.borderNeedsFrame =
      (spec?.radii != null &&
        BORDER_CORNERS.some((corner) =>
          String(spec.radii?.[corner] ?? '')
            .trim()
            .endsWith('%'),
        )) ||
      perCorner ||
      layered
  }
  return {
    BORDER_WIDTH_KEYS,
    BORDER_COLOR_KEYS,
    BORDER_RADIUS_KEYS,
    BORDER_EDGE_KEYS,
    BORDER_STYLE_KEYS,
    setBorderSlot,
    clearBorderSlot,
    setBorderEdge,
    clearBorderEdge,
    syncBorderBox,
    disposeBorder,
  }
}
