import type { createNativeStyle } from './native-style'
import type { createTransformPaint } from './transform-paint'
import type { createShadowPaint } from './shadow-paint'
import type { PropBag, ElementNode } from './model'
import { splitStyleTokens } from './css-text.ts'
import {
  CALayer,
  CAShapeLayer,
  CGPathAddArcToPoint,
  CGPathAddLineToPoint,
  CGPathCloseSubpath,
  CGPathCreateMutable,
  CGPathMoveToPoint,
  NSColor,
  NSNotificationCenter,
  NSNumber,
  NSView,
  NSViewFrameDidChangeNotification,
} from '@octane-xplat/platform/macos'
import {
  borderStyleSides,
  hiddenBorderStyle,
  borderStrokeStyle,
  borderBands,
  borderBandPoints,
  darkBorderComponents,
} from './border-styles.ts'
import { nativeColor } from './native-colors'
import { correctProjectionRadii } from './projection-paint'
import { srgbComponents } from './color-components'

export type BorderSide = 'top' | 'right' | 'bottom' | 'left'

export type BorderCorner = 'topLeft' | 'topRight' | 'bottomRight' | 'bottomLeft'

interface Dependencies {
  nativeStyle: Pick<ReturnType<typeof createNativeStyle>, 'effectiveStyle'>
  transformPaint: Pick<
    ReturnType<typeof createTransformPaint>,
    'syncBoxGeometry' | 'hasPercentTranslate'
  >
  shadowPaint: Pick<ReturnType<typeof createShadowPaint>, 'outsetShadowOnSelf'>
}

export function createBorderPaint(deps: Dependencies) {
  const BORDER_SIDES: readonly BorderSide[] = ['top', 'right', 'bottom', 'left']

  const BORDER_CORNERS: readonly BorderCorner[] = [
    'topLeft',
    'topRight',
    'bottomRight',
    'bottomLeft',
  ]

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

  // `1px`/`1`/`thin` → points; CSS keyword widths map like the web.
  function borderLength(value: any): number {
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
  function borderRadiusPoints(value: any, width: number, height: number): number {
    if (typeof value === 'string' && value.trim().endsWith('%')) {
      const pct = parseFloat(value)
      return Number.isFinite(pct) ? Math.max(0, (pct / 100) * Math.min(width, height)) : 0
    }
    return borderLength(value)
  }

  // Resolve the four corner radii in points (pre-clamp — uniformity is judged
  // here so a zero-size frame cannot collapse distinct radii).
  function resolveBorderRadii(spec: PropBag | undefined, w: number, h: number) {
    return {
      topLeft: borderRadiusPoints(spec?.topLeft, w, h),
      topRight: borderRadiusPoints(spec?.topRight, w, h),
      bottomRight: borderRadiusPoints(spec?.bottomRight, w, h),
      bottomLeft: borderRadiusPoints(spec?.bottomLeft, w, h),
    }
  }

  // CSS pairwise scale-down when adjacent radii overflow their shared edge.
  function scaleBorderRadii(radii: Record<BorderCorner, number>, w: number, h: number) {
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

  const BORDER_STYLE_WORDS = new Set([
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

  // Per-corner rounded-rect CGPath in the layer's y-up space — CSS top corners
  // sit at y = height. `into` appends the subpath (ring building); dx/dy shift
  // the whole rect. Null when the runtime globals are absent (slice tests).
  function roundedBoxCGPath(
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
  function borderStrokeCGPath(
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

  function borderBandCGPath(points: [number, number][]): any {
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

  // Unparseable colors (color-mix, unknown functions) read as no color rather
  // than throwing mid-apply — nativeColor is strict by design elsewhere.
  function borderNSColor(node: ElementNode, value: any): NSColor | null {
    const raw = value ?? deps.nativeStyle.effectiveStyle(node).color ?? '#000'
    try {
      return nativeColor(raw)
    } catch {
      return null
    }
  }

  function setBorderSlot(
    node: ElementNode,
    group: 'widths' | 'colors' | 'radii',
    slot: BorderSide | BorderCorner | 'all',
    value: any,
  ) {
    const spec = (node.borderSpec ??= {})
    const bag = (spec[group] ??= {})
    if (slot === 'all') {
      for (const key of group === 'radii' ? BORDER_CORNERS : BORDER_SIDES) {
        bag[key] = value
      }
    } else {
      bag[slot] = value
    }
    syncBorderBox(node)
  }

  function clearBorderSlot(
    node: ElementNode,
    group: 'widths' | 'colors' | 'radii',
    slot: BorderSide | BorderCorner | 'all',
  ) {
    const bag = node.borderSpec?.[group]
    if (bag) {
      if (slot === 'all') {
        for (const key of group === 'radii' ? BORDER_CORNERS : BORDER_SIDES) {
          delete bag[key]
        }
      } else {
        delete bag[slot]
      }
    }
    syncBorderBox(node)
  }

  // `border`/`border-{side}` shorthand text feeds the same width/color slots.
  function setBorderEdge(node: ElementNode, slot: BorderSide | 'all', value: any) {
    const { width, color } = parseBorderEdge(value)
    const spec = (node.borderSpec ??= {})
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
    syncBorderBox(node)
  }

  function clearBorderEdge(node: ElementNode, slot: BorderSide | 'all') {
    const spec = node.borderSpec
    for (const side of slot === 'all' ? BORDER_SIDES : [slot]) {
      delete spec?.widths?.[side]
      delete spec?.colors?.[side]
    }
    syncBorderBox(node)
  }

  function removeBorderLayers(node: ElementNode) {
    if (node.borderLayer) {
      node.borderLayer.removeFromSuperlayer()
    }
    node.borderLayer = null
    node.borderSides = undefined
    node.borderOutline = undefined
    node.borderStroke = undefined
    node.borderSideMasks = undefined
    for (const extras of Object.values(node.borderBandShapes ?? {})) {
      for (const shape of extras as any[]) {
        shape.removeFromSuperlayer()
      }
    }
    node.borderBandShapes = undefined
  }

  function removeBoxFrameToken(owner: any, token: any) {
    try {
      owner.remove.call(owner.center, token)
    } catch {
      try {
        console.warn('[macos-css] Box frame cleanup failed')
      } catch {}
    }
  }

  function retireBoxFrameOwner(node: ElementNode, owner: any) {
    if (!owner?.active) {
      return
    }
    owner.active = false
    if (node.boxFrameOwner === owner) {
      node.boxFrameOwner = null
      node.boxFrameObserver = null
    }
    const token = owner.token
    owner.token = null
    if (token != null) {
      removeBoxFrameToken(owner, token)
    }
  }

  function clearBoxFrameObserver(node: ElementNode) {
    retireBoxFrameOwner(node, node.boxFrameOwner)
  }

  function observeBoxFrame(node: ElementNode, view: NSView) {
    const previous = node.boxFrameOwner
    const owner = {
      center: null as any,
      remove: null as any,
      token: null as any,
      active: true,
      ready: false,
      view,
    }
    const current = () => owner.active && node.boxFrameOwner === owner && node.view === view
    node.boxFrameOwner = owner
    node.boxFrameObserver = null
    retireBoxFrameOwner(node, previous)
    try {
      if (!current()) {
        retireBoxFrameOwner(node, owner)
        return
      }

      owner.center = NSNotificationCenter.defaultCenter
      owner.remove = owner.center.removeObserver
      const add = owner.center.addObserverForNameObjectQueueUsingBlock
      if (typeof add !== 'function' || typeof owner.remove !== 'function') {
        throw new Error('Box frame observation unavailable')
      }

      if (!current()) {
        retireBoxFrameOwner(node, owner)
        return
      }

      view.postsFrameChangedNotifications = true
      if (!current()) {
        retireBoxFrameOwner(node, owner)
        return
      }

      const token = add.call(owner.center, NSViewFrameDidChangeNotification, view, null, () => {
        if (!owner.active || !owner.ready || node.boxFrameOwner !== owner) {
          return
        }
        if (node.view !== view) {
          retireBoxFrameOwner(node, owner)
          return
        }
        try {
          deps.transformPaint.syncBoxGeometry(node)
        } catch {
          try {
            console.warn('[macos-css] Box geometry update failed')
          } catch {}
        }
      })

      if (!current()) {
        if (token != null) {
          removeBoxFrameToken(owner, token)
        }

        retireBoxFrameOwner(node, owner)
        return
      }

      if (token == null) {
        throw new Error('Box frame observation unavailable')
      }

      owner.token = token
      node.boxFrameObserver = token
      owner.ready = true
    } catch {
      retireBoxFrameOwner(node, owner)
      try {
        console.warn('[macos-css] Box frame observation unavailable')
      } catch {}
    }
  }

  // borderRadius styles and per-side border slots resolve on the node and sync
  // here. CALayer takes one borderWidth/borderColor/cornerRadius, so uniform
  // boxes stay on the fast path; anything else draws through masked
  // CAShapeLayer trapezoids clipped to the rounded outline — banded styles
  // (double/groove/ridge/inset/outset) split each side into shaded bands.
  function syncBorderBox(node: ElementNode) {
    const view = node.view
    if (!view) {
      return
    }

    const size = view.frame?.size ?? { width: 0, height: 0 }
    const w = Number.isFinite(Number(size.width)) ? Math.max(0, Number(size.width)) : 0
    const h = Number.isFinite(Number(size.height)) ? Math.max(0, Number(size.height)) : 0
    const spec = node.borderSpec
    const resolvedStyle = deps.nativeStyle.effectiveStyle(node)
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
        const warned = (node.borderStyleWarnings ??= new Set())
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
    const outsetShadow = deps.shadowPaint.outsetShadowOnSelf(node, view)
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
      const mask = (node.cornerMask ??= CAShapeLayer.alloc().init())
      mask.path = roundedBoxCGPath(w, h, scaled)
      layer.mask = mask
      layer.cornerRadius = 0
      node.cornerMaskApplied = true
    } else {
      if (node.cornerMaskApplied) {
        layer.mask = null as any
        node.cornerMaskApplied = false
      }

      // The fast path writes the raw value — CA caps the radius internally,
      // and a 0×0 pre-layout frame must not zero it (the observer-less
      // uniform case never resyncs).
      layer.cornerRadius = maxRadius
    }

    const clip = maxRadius > 0 && !outsetShadow
    if (clip || node.radiusApplied) {
      layer.masksToBounds = clip
    }
    node.radiusApplied = clip

    if (layered) {
      layer.borderWidth = 0
      layer.borderColor = null
      if (!node.borderLayer) {
        node.borderLayer = CALayer.alloc().init()
        layer.insertSublayerAtIndex(
          node.borderLayer,
          (node.bgHost ? 1 : 0) + (node.insetShadowHost ? 1 : 0),
        )
      }

      const box = node.borderLayer
      box.frame = { origin: { x: 0, y: 0 }, size: { width: w, height: h } }
      if (maxRadius > 0) {
        const outline = (node.borderOutline ??= CAShapeLayer.alloc().init())
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
        for (const extra of node.borderBandShapes?.[side] ?? []) {
          extra.hidden = true
        }
      }

      if (uniformPattern) {
        const stroke = (node.borderStroke ??= CAShapeLayer.alloc().init())
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

        for (const shape of Object.values(node.borderSides ?? {}) as any[]) {
          shape.hidden = true
        }

        for (const side of BORDER_SIDES) {
          hideBandExtras(side)
        }
      } else {
        if (node.borderStroke) {
          node.borderStroke.hidden = true
        }

        for (const side of BORDER_SIDES) {
          const shape = ((node.borderSides ??= {})[side] ??= CAShapeLayer.alloc().init())
          if (shape.superlayer !== box) {
            box.addSublayer(shape)
          }

          shape.frame = { origin: { x: 0, y: 0 }, size: { width: w, height: h } }
          shape.hidden = widths[side] === 0
          shape.mask = null
          shape.strokeColor = null
          shape.lineWidth = 0
          shape.lineDashPattern = null
          shape.fillColor = null
          if (widths[side] === 0) {
            hideBandExtras(side)
            continue
          }

          const baseNSColor = borderNSColor(node, spec?.colors?.[side])
          const color = baseNSColor?.CGColor ?? null
          if (borderStrokeStyle(sideStyles[side], widths[side])) {
            paintStroke(shape, sideStyles[side], widths[side], color)
            const mask = ((node.borderSideMasks ??= {})[side] ??= CAShapeLayer.alloc().init())
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
            const extras = ((node.borderBandShapes ??= {})[side] ??= [] as any[])
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
      removeBorderLayers(node)
      // Uniform borders use the CALayer slots; without shape layers the top
      // edge's values stand in — deterministic like the collapsed engine.
      layer.borderWidth = widths.top
      layer.borderColor =
        maxWidth > 0 && widths.top > 0
          ? (borderNSColor(node, spec?.colors?.top)?.CGColor ?? null)
          : null
    }

    // Percent radii, per-corner masks and layered borders all resolve against
    // the box — resync on frame changes while any is in effect.
    const percentRadius =
      spec?.radii != null &&
      BORDER_CORNERS.some((corner) =>
        String(spec.radii[corner] ?? '')
          .trim()
          .endsWith('%'),
      )
    const needsSync =
      Boolean(percentRadius) ||
      perCorner ||
      layered ||
      (node.boxShadowSpec?.length ?? 0) > 0 ||
      node.bgHost != null ||
      deps.transformPaint.hasPercentTranslate(node)
    if (node.boxFrameOwner && node.boxFrameOwner.view !== view) {
      clearBoxFrameObserver(node)
    }
    if (node.view !== view || deps.nativeStyle.effectiveStyle(node) !== resolvedStyle) {
      return
    }
    if (needsSync && !node.boxFrameOwner) {
      observeBoxFrame(node, view)
    } else if (!needsSync) {
      clearBoxFrameObserver(node)
    }
  }
  return {
    BORDER_SIDES,
    BORDER_CORNERS,
    BORDER_WIDTH_KEYS,
    BORDER_COLOR_KEYS,
    BORDER_RADIUS_KEYS,
    BORDER_EDGE_KEYS,
    BORDER_STYLE_KEYS,
    borderLength,
    borderRadiusPoints,
    resolveBorderRadii,
    scaleBorderRadii,
    BORDER_STYLE_WORDS,
    roundedBoxCGPath,
    borderStrokeCGPath,
    borderBandCGPath,
    borderNSColor,
    setBorderSlot,
    clearBorderSlot,
    setBorderEdge,
    clearBorderEdge,
    clearBoxFrameObserver,
    syncBorderBox,
  }
}
