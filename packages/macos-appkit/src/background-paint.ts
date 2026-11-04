import { FailureCollector } from './failures.ts'
import { parseEdgeInsets, effectiveStyle } from './style-values.ts'
import type { BorderPaint } from './border-paint'
import {
  collectBackground,
  positioningBox,
  resolveImageSize,
  resolveStops,
  tileRects,
} from './background-layers.ts'
import type { BackgroundSpec, BgGradient } from './background-layers.ts'
import type { ElementNode } from './model'
import { borderStyleSides, hiddenBorderStyle } from './border-styles.ts'
import {
  CAGradientLayer,
  CALayer,
  CAShapeLayer,
  NSImage,
  NSNumber,
} from '@octane-xplat/platform/macos'
import { nativeColor } from './native-colors'
import { correctProjectionRadii } from './projection-paint'
import { requestImage } from './image'

export interface BgPainted {
  layer: any
  spec: BackgroundSpec['layers'][number]
  release?: () => void
  active?: boolean
  image?: any
  mask?: any
  renderedW?: number
  renderedH?: number
  renderedScale?: number
}

interface Dependencies {
  borderPaint: Pick<
    BorderPaint,
    | 'borderLength'
    | 'scaleBorderRadii'
    | 'resolveBorderRadii'
    | 'BORDER_CORNERS'
    | 'roundedBoxCGPath'
  >
}

export type BackgroundPaint = ReturnType<typeof createBackgroundPaint>

export function createBackgroundPaint(deps: Dependencies) {
  // ---- Background layers -----------------------------------------------------
  // `background`/`background-image`/`-repeat`/`-position`/`-size`/`-origin`/
  // `-clip` paint one CALayer subtree under the border: a host at sublayer 0
  // holding per-layer gradient or image layers. url() images composite into a
  // pre-rendered CGImage so all repeat modes resolve with Quartz math.

  const BACKGROUND_STYLE_KEYS = new Set([
    'background',
    'backgroundImage',
    'backgroundRepeat',
    'backgroundPosition',
    'backgroundSize',
    'backgroundOrigin',
    'backgroundClip',
    'backgroundAttachment',
    'backgroundBlendMode',
  ])

  function backgroundEdges(node: ElementNode) {
    const spec = node.borderSpec
    const style = effectiveStyle(node)
    const sideStyles = borderStyleSides(style)
    const edge = (side: 'top' | 'right' | 'bottom' | 'left') =>
      hiddenBorderStyle(sideStyles[side]) ? 0 : deps.borderPaint.borderLength(spec?.widths?.[side])
    const padding = parseEdgeInsets(style.padding ?? 0)
    return {
      border: {
        top: edge('top'),
        right: edge('right'),
        bottom: edge('bottom'),
        left: edge('left'),
      },
      padding: {
        top: Number(style.paddingTop ?? padding.top) || 0,
        right: Number(style.paddingRight ?? padding.right) || 0,
        bottom: Number(style.paddingBottom ?? padding.bottom) || 0,
        left: Number(style.paddingLeft ?? padding.left) || 0,
      },
    }
  }

  function clearBackgrounds(node: ElementNode) {
    const failures = new FailureCollector()
    const paintedLayers: BgPainted[] = node.bgPainted ?? []
    const host = node.bgHost
    node.bgPainted = undefined
    node.bgHost = undefined
    node.bgSpec = undefined
    for (const painted of paintedLayers) { painted.active = false }
    for (const painted of paintedLayers) {
      const release = painted.release
      painted.release = undefined
      failures.run('background image', () => release?.())
    }
    failures.run('background host', () => host?.removeFromSuperlayer())
    failures.throwIfFailed()
  }

  // Render the clip area of one url() layer at the window's backing scale; the
  // result lands as the child layer's CGImage contents.
  function renderBackgroundImage(
    image: any,
    spec: BgPainted['spec'],
    clip: { x: number; y: number; width: number; height: number },
    scale: number,
  ): any {
    const iw = Number(image?.size?.width ?? 0)
    const ih = Number(image?.size?.height ?? 0)
    const drawn = resolveImageSize(spec.size, iw, ih, clip)
    if (!(drawn.w > 0) || !(drawn.h > 0) || !(scale > 0)) {
      return null
    }
    const rects = tileRects(spec, drawn, clip)
    if (!rects.length) {
      return null
    }
    const w = Math.max(1, Math.round(clip.width * scale))
    const h = Math.max(1, Math.round(clip.height * scale))
    const out = NSImage.alloc().initWithSize({ width: w, height: h })
    out.lockFocusFlipped(true)
    try {
      for (const rect of rects) {
        image.drawInRect({
          origin: { x: rect.x * scale, y: rect.y * scale },
          size: { width: rect.width * scale, height: rect.height * scale },
        })
      }
    } finally {
      out.unlockFocus()
    }
    return out.CGImageForProposedRectContextHints(null, null, null)
  }

  // Gradient endpoint mapping in the child's unit space. The gradient extent
  // lives in the origin box while the layer covers the clip box, so points can
  // land outside [0,1].
  function paintGradientLayer(
    child: any,
    gradient: BgGradient,
    clip: any,
    origin: any,
    flipped: boolean,
  ) {
    const unit = (x: number, y: number) => ({
      x: clip.width ? (x - clip.x) / clip.width : 0,
      y: clip.height ? ((flipped ? y : clip.y + clip.height - y) - clip.y) / clip.height : 0,
    })
    if (gradient.type === 'linear') {
      const radians = (gradient.angle * Math.PI) / 180
      const dx = Math.sin(radians)
      const dy = -Math.cos(radians)
      const length = Math.abs(origin.width * dx) + Math.abs(origin.height * dy)
      const x = origin.width ? (dx * length) / origin.width / 2 : 0
      const y = origin.height ? (dy * length) / origin.height / 2 : 0
      const cx = origin.x + origin.width / 2
      const cy = origin.y + origin.height / 2
      child.type = (globalThis as any).kCAGradientLayerAxial ?? 'axial'
      child.startPoint = unit(cx - x * origin.width, cy - y * origin.height)
      child.endPoint = unit(cx + x * origin.width, cy + y * origin.height)
      var resolved = resolveStops(gradient.stops, length || 1, gradient.repeating)
      child.locations = resolved.map((s) => NSNumber.numberWithDouble(s.at))
    } else if (gradient.type === 'radial') {
      const cx = origin.x + origin.width * gradient.center.x.fraction + gradient.center.x.offset
      const cy = origin.y + origin.height * gradient.center.y.fraction + gradient.center.y.offset
      const size = (token: any, extent: number) =>
        token == null ? null : 'frac' in token ? token.frac * extent : token.len

      let rx = size(gradient.rx, origin.width)
      let ry = size(gradient.ry, origin.height)
      if (rx == null && ry == null) {
        const dxs = [Math.abs(cx - origin.x), Math.abs(origin.x + origin.width - cx)]
        const dys = [Math.abs(cy - origin.y), Math.abs(origin.y + origin.height - cy)]
        const near = gradient.size.startsWith('closest')
        const dx = near ? Math.min(...dxs) : Math.max(...dxs)
        const dy = near ? Math.min(...dys) : Math.max(...dys)
        if (gradient.size.endsWith('side')) {
          rx = dx
          ry = dy
        } else if (gradient.shape === 'circle') {
          rx = ry = Math.sqrt(dx * dx + dy * dy)
        } else {
          rx = dx * Math.SQRT2
          ry = dy * Math.SQRT2
        }
      }

      if (gradient.shape === 'circle' && ry == null) {
        ry = rx
      }

      if (rx == null || ry == null || !(rx > 0) || !(ry > 0)) {
        child.hidden = true
        return
      }

      child.hidden = false
      child.type = (globalThis as any).kCAGradientLayerRadial ?? 'radial'
      child.startPoint = unit(cx, cy)
      child.endPoint = unit(cx + rx, cy + ry)
      var resolved = resolveStops(gradient.stops, Math.max(rx, ry), gradient.repeating)
      child.locations = resolved.map((s) => NSNumber.numberWithDouble(s.at))
    } else {
      const cx = origin.x + origin.width * gradient.center.x.fraction + gradient.center.x.offset
      const cy = origin.y + origin.height * gradient.center.y.fraction + gradient.center.y.offset
      const radians = (gradient.angle * Math.PI) / 180
      const dx = Math.sin(radians) * origin.width
      const dy = -Math.cos(radians) * origin.height
      child.type = (globalThis as any).kCAGradientLayerConic ?? 'conic'
      child.startPoint = unit(cx, cy)
      child.endPoint = unit(cx + dx, cy + dy)
      var resolved = resolveStops(gradient.stops, 1, gradient.repeating)
      child.locations = resolved.map((s) => NSNumber.numberWithDouble(s.at))
    }
    child.colors = resolved.map((s) => nativeColor(s.color).CGColor)
  }

  function paintBackgrounds(node: ElementNode) {
    const view = node.view
    const painted = node.bgPainted
    if (!view || !painted?.length || !node.bgSpec) {
      return
    }
    const bounds = view.bounds
    const w = Number(bounds?.size?.width ?? 0)
    const h = Number(bounds?.size?.height ?? 0)
    const host = node.bgHost
    if (host) {
      host.frame = { origin: { x: 0, y: 0 }, size: { width: w, height: h } }
    }
    const flipped = view.flipped === true
    const { border, padding } = backgroundEdges(node)
    const spec = node.borderSpec
    const radii = deps.borderPaint.scaleBorderRadii(
      correctProjectionRadii(
        view,
        deps.borderPaint.resolveBorderRadii(spec?.radii, w, h),
        spec?.radii,
      ),
      w,
      h,
    )
    // CSS paints layers first-on-top; children keep reverse order.
    ;(painted as BgPainted[]).forEach((entry) => {
      const clip = positioningBox(entry.spec.clip, w, h, border, padding)
      const origin = positioningBox(entry.spec.origin, w, h, border, padding)
      const layer = entry.layer
      layer.frame = {
        origin: { x: clip.x, y: flipped ? clip.y : h - clip.y - clip.height },
        size: { width: clip.width, height: clip.height },
      }
      if (entry.spec.clip !== 'border-box' && clip.width > 0 && clip.height > 0) {
        const inset = Math.max(border.top, border.left, border.right, border.bottom)
        const inner = Object.fromEntries(
          deps.borderPaint.BORDER_CORNERS.map((c) => [c, Math.max(0, radii[c] - inset)]),
        )

        const mask = (entry.mask ??= CAShapeLayer.alloc().init())
        mask.frame = { origin: { x: 0, y: 0 }, size: { width: clip.width, height: clip.height } }
        mask.path = deps.borderPaint.roundedBoxCGPath(clip.width, clip.height, inner as any)
        layer.mask = mask
      } else if (entry.mask) {
        layer.mask = null
      }
      const image = entry.spec.image
      if (image.kind === 'gradient') {
        paintGradientLayer(layer, image.gradient, clip, origin, flipped)
      } else if (entry.image != null) {
        const scale = Number(view.window?.backingScaleFactor ?? 1) || 1
        if (
          entry.renderedW !== clip.width ||
          entry.renderedH !== clip.height ||
          entry.renderedScale !== scale
        ) {
          layer.contents = renderBackgroundImage(entry.image, entry.spec, clip, scale)
          layer.contentsScale = scale
          entry.renderedW = clip.width
          entry.renderedH = clip.height
          entry.renderedScale = scale
        }
      }
    })
  }

  function syncBackgrounds(node: ElementNode) {
    const view = node.view
    if (!view) {
      return
    }
    const warnings: string[] = []
    const spec = collectBackground(effectiveStyle(node), warnings)
    const warned = (node.bgWarnings ??= new Set<string>())
    for (const message of warnings) {
      if (!warned.has(message)) {
        warned.add(message)
        console.warn('[macos-css] unsupported background value: ' + message)
      }
    }
    if (spec?.color != null) {
      node.styleBg = String(spec.color)
      node.bgApplied = true
      view.wantsLayer = true
      try {
        view.layer.backgroundColor = nativeColor(spec.color).CGColor
      } catch {
        console.warn('[macos-css] unsupported background color: ' + spec.color)
      }
    }
    const layers = spec?.layers ?? []
    if (!layers.length) {
      clearBackgrounds(node)
      return
    }
    node.bgSpec = spec
    view.wantsLayer = true
    if (!node.bgHost) {
      node.bgHost = CALayer.alloc().init()
    }
    const host = node.bgHost
    const parentLayer = view.layer
    if (host.superlayer !== parentLayer) {
      parentLayer.insertSublayerAtIndex(host, 0)
    }
    // Reconcile children against the spec — layer kind/order changes rebuild,
    // same-kind entries repaint.
    const previous = node.bgPainted ?? []
    const next: BgPainted[] = []
    layers.forEach((specLayer, index) => {
      let entry =
        previous[index] && previous[index].spec.image.kind === specLayer.image.kind &&
        (specLayer.image.kind !== 'url' ||
          (previous[index].spec.image.kind === 'url' && previous[index].spec.image.url === specLayer.image.url))
          ? previous[index]
          : undefined
      if (!entry) {
        const layer =
          specLayer.image.kind === 'gradient'
            ? (CAGradientLayer as any).layer()
            : CALayer.alloc().init()

        entry = { layer, spec: specLayer, active: true }
        if (specLayer.image.kind === 'url') {
          entry.release = requestImage(specLayer.image.url, (image) => {
            if (node.lifecycle === 'disposing' || node.lifecycle === 'disposed' || !entry!.active || node.view !== view) {
              return
            }
            entry!.image = image
            entry!.renderedW = undefined
            paintBackgrounds(node)
          })
        }
      }
      if (JSON.stringify(entry.spec) !== JSON.stringify(specLayer)) { entry.renderedW = undefined }
      entry.spec = specLayer
      next.push(entry)
    })
    for (const entry of previous) {
      if (!next.includes(entry)) {
        entry.active = false
        const release = entry.release
        entry.release = undefined
        release?.()
        entry.layer.removeFromSuperlayer()
      }
    }
    node.bgPainted = next
    // Children sit above the host in CSS first-on-top order.
    next.forEach((entry, index) => {
      if (entry.layer.superlayer !== host) {
        host.addSublayer(entry.layer)
      }
      entry.layer.zPosition = next.length - index
    })
    paintBackgrounds(node)
  }
  return {
    BACKGROUND_STYLE_KEYS,
    clearBackgrounds,
    paintBackgrounds,
    syncBackgrounds,
  }
}
