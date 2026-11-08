import { FailureCollector } from './failures.ts'
import type { BoxPaintState } from './box-paint-state'
import type { BorderCorner } from './box-geometry'
import {
  resolveBorderRadii,
  scaleBorderRadii,
  roundedBoxCGPath,
  borderNSColor,
} from './box-geometry.ts'

import { splitStyleTokens, splitTopLevelCommas } from './css-text.ts'
import type { ElementNode } from './model'
import { CALayer, CAShapeLayer, CGPathCreateMutable, NSView } from '@octane-xplat/platform/macos'
import { correctProjectionRadii, correctProjectionShadows } from './projection-paint'

// ---- box-shadow --------------------------------------------------------------

export interface ParsedBoxShadow {
  inset: boolean
  dx: number
  dy: number
  blur: number
  spread: number
  color: string
}

export type ShadowPaint = ReturnType<typeof createShadowPaint>

export function createShadowPaint() {
  const SHADOW_LENGTH_RE = /^[+-]?(?:\d+\.?\d*|\.\d+)(?:px|dip|pt)?$/

  // splitTopLevelCommas comes from ./css-text.ts.

  // `box-shadow: [inset] dx dy [blur] [spread] color` — CALayer takes one
  // shadow, so the first entry of each kind wins; `none` clears.
  function parseBoxShadow(value: any): ParsedBoxShadow[] {
    const text = String(value ?? '').trim()

    if (!text || text === 'none') {
      return []
    }

    const shadows: ParsedBoxShadow[] = []

    for (const part of splitTopLevelCommas(text)) {
      let inset = false
      const lengths: number[] = []
      let color = ''

      for (const token of splitStyleTokens(part)) {
        if (token.toLowerCase() === 'inset') {
          inset = true
          continue
        }

        if (lengths.length < 4 && SHADOW_LENGTH_RE.test(token)) {
          lengths.push(parseFloat(token))
          continue
        }

        color = color ? `${color} ${token}` : token
      }

      if (lengths.length >= 2) {
        shadows.push({
          inset,
          dx: lengths[0],
          dy: lengths[1],
          blur: lengths[2] ?? 0,
          spread: lengths[3] ?? 0,
          color: color || '#000',
        })
      }
    }

    return shadows
  }

  // `box-shadow` paints every list entry. Outset shadows live on sibling
  // CALayers inserted below view.layer so corner clipping (masksToBounds/mask)
  // stays on; a root view with no superlayer/superview falls back to its own
  // shadow props and keeps the no-clip limit. Inset shadows are CAShapeLayer
  // walls — an even-odd silhouette (huge rect minus the box hole inset by
  // spread) whose own layer shadow bleeds into the hole while masksToBounds
  // clips it to the interior; this carries real blur.
  const ZERO_RADII = { topLeft: 0, topRight: 0, bottomRight: 0, bottomLeft: 0 } as Record<
    BorderCorner,
    number
  >

  function siblingShadowSuperlayer(view: NSView): any | null {
    const superlayer = view.layer?.superlayer

    if (superlayer) {
      return superlayer
    }

    const superview = (view as any).superview

    if (!superview) {
      return null
    }

    superview.wantsLayer = true
    return superview.layer ?? null
  }

  function syncBoxShadow(node: ElementNode, state: BoxPaintState) {
    const view = node.view

    if (!view) {
      return
    }

    const shadows = correctProjectionShadows<ParsedBoxShadow>(view, state.boxShadowSpec ?? [])
    const outsets = shadows.filter((s: ParsedBoxShadow) => !s.inset)
    const insets = shadows.filter((s: ParsedBoxShadow) => s.inset)

    if (
      !outsets.length &&
      !insets.length &&
      !state.shadowApplied &&
      !state.insetShadowHost &&
      !state.outsetShadowHosts?.length
    ) {
      return
    }

    if (outsets.length || insets.length) {
      view.wantsLayer = true
    }

    const layer = view.layer

    if (!layer) {
      return
    }

    const size = view.frame?.size ?? { width: 0, height: 0 }
    const w = Math.max(0, Number(size.width) || 0)
    const h = Math.max(0, Number(size.height) || 0)
    const radii = scaleBorderRadii(
      correctProjectionRadii(
        view,
        resolveBorderRadii(state.borderSpec?.radii, w, h),
        state.borderSpec?.radii,
      ),
      w,
      h,
    )

    const superlayer = outsets.length ? siblingShadowSuperlayer(view) : null

    if (superlayer) {
      // One empty sibling layer per outset shadow; the first CSS shadow sits
      // closest to the view (topmost).
      const hosts = (state.outsetShadowHosts ??= [])

      outsets.forEach((s, index) => {
        const host = (hosts[index] ??= CALayer.alloc().init())

        // `frame` is already transformed. Match the backing layer's local box
        // and transform so inverse projection correction paints in that space.
        host.bounds = layer.bounds
        host.anchorPoint = layer.anchorPoint
        host.position = layer.position
        host.transform = layer.transform

        const s2 = s.spread
        const grown = {
          topLeft: Math.max(0, radii.topLeft + s2),
          topRight: Math.max(0, radii.topRight + s2),
          bottomRight: Math.max(0, radii.bottomRight + s2),
          bottomLeft: Math.max(0, radii.bottomLeft + s2),
        }

        host.shadowPath = roundedBoxCGPath(w + 2 * s2, h + 2 * s2, grown)
        host.shadowColor = borderNSColor(node, s.color)?.CGColor ?? null
        host.shadowOffset = { width: s.dx - s2, height: -s.dy - s2 }
        host.shadowRadius = s.blur
        host.shadowOpacity = 1
        superlayer.insertSublayerBelow(host, index === 0 ? layer : hosts[index - 1])
      })

      for (let i = outsets.length; i < hosts.length; i++) {
        hosts[i].removeFromSuperlayer()
      }

      hosts.length = outsets.length
      if (state.shadowApplied) {
        layer.shadowOpacity = 0
        layer.shadowPath = null
        state.shadowApplied = false
      }
    } else if (outsets.length) {
      const s = outsets[0]
      const s2 = s.spread
      const grown = {
        topLeft: Math.max(0, radii.topLeft + s2),
        topRight: Math.max(0, radii.topRight + s2),
        bottomRight: Math.max(0, radii.bottomRight + s2),
        bottomLeft: Math.max(0, radii.bottomLeft + s2),
      }

      layer.shadowPath = roundedBoxCGPath(w + 2 * s2, h + 2 * s2, grown)
      layer.shadowColor = borderNSColor(node, s.color)?.CGColor ?? null
      layer.shadowOffset = { width: s.dx - s2, height: -s.dy - s2 }
      layer.shadowRadius = s.blur
      layer.shadowOpacity = 1
      state.shadowApplied = true
      if (outsets.length > 1) {
        const warned = (state.shadowWarnings ??= new Set<string>())

        if (!warned.has('self')) {
          warned.add('self')
          console.warn('[macos-css] root view: only the first outset box-shadow paints')
        }
      }
    } else if (state.shadowApplied) {
      layer.shadowOpacity = 0
      layer.shadowPath = null
      state.shadowApplied = false
    }

    if (!outsets.length || !superlayer) {
      for (const host of state.outsetShadowHosts ?? []) {
        host.removeFromSuperlayer()
      }

      state.outsetShadowHosts = undefined
    }

    if (insets.length && typeof CAShapeLayer !== 'undefined') {
      const host = (state.insetShadowHost ??= CALayer.alloc().init())

      if (host.superlayer !== layer) {
        layer.insertSublayerAtIndex(host, state.bgHost ? 1 : 0)
      }

      host.frame = { origin: { x: 0, y: 0 }, size: { width: w, height: h } }

      const shapes = (state.insetShadowShapes ??= [])

      insets.forEach((s, index) => {
        const shape = (shapes[index] ??= CAShapeLayer.alloc().init())

        if (shape.superlayer !== host) {
          host.addSublayer(shape)
        }

        shape.zPosition = insets.length - index
        shape.frame = { origin: { x: 0, y: 0 }, size: { width: w, height: h } }
        shape.masksToBounds = true

        const spread = s.spread
        const inner = {
          topLeft: Math.max(0, radii.topLeft - spread),
          topRight: Math.max(0, radii.topRight - spread),
          bottomRight: Math.max(0, radii.bottomRight - spread),
          bottomLeft: Math.max(0, radii.bottomLeft - spread),
        }

        // The wall fills everything except a hole = the box inset by
        // spread. Positive spread leaves a visible solid ring — the
        // shadow's hard core — and the cast shadow continues fading into
        // the hole. Negative spread pushes the caster edge outside.
        const path = CGPathCreateMutable()
        const pad = Math.abs(s.dx) + Math.abs(s.dy) + Math.abs(s.blur) * 4 + Math.abs(spread) + 32

        roundedBoxCGPath(w + 2 * pad, h + 2 * pad, ZERO_RADII, -pad, -pad, path)
        roundedBoxCGPath(
          Math.max(0, w - 2 * spread),
          Math.max(0, h - 2 * spread),
          inner,
          spread,
          spread,
          path,
        )

        shape.path = path
        shape.fillRule = 'even-odd'
        shape.fillColor = borderNSColor(node, s.color)?.CGColor ?? null
        shape.shadowColor = shape.fillColor
        shape.shadowOffset = { width: s.dx, height: -s.dy }
        shape.shadowRadius = s.blur
        shape.shadowOpacity = 1
      })

      for (let i = insets.length; i < shapes.length; i++) {
        shapes[i].removeFromSuperlayer()
      }

      shapes.length = insets.length
    } else if (state.insetShadowHost) {
      state.insetShadowHost.removeFromSuperlayer()
      state.insetShadowHost = null
      state.insetShadowShapes = undefined
    }
  }

  function syncOutsetGeometry(node: ElementNode, state: BoxPaintState) {
    const layer = node.view?.layer

    if (!layer) {
      return
    }

    for (const host of state.outsetShadowHosts ?? []) {
      host.bounds = layer.bounds
      host.anchorPoint = layer.anchorPoint
      host.position = layer.position
      host.transform = layer.transform
    }
  }

  function disposeShadow(node: ElementNode, state: BoxPaintState) {
    const failures = new FailureCollector()
    const hosts = state.outsetShadowHosts ?? []
    const inset = state.insetShadowHost

    state.boxShadowSpec = undefined
    state.outsetShadowHosts = undefined
    state.insetShadowHost = null
    state.insetShadowShapes = undefined
    for (const host of hosts) {
      failures.run('outset shadow', () => host.removeFromSuperlayer())
    }

    failures.run('inset shadow', () => inset?.removeFromSuperlayer())
    failures.throwIfFailed()
  }

  return {
    parseBoxShadow,
    syncBoxShadow,
    syncOutsetGeometry,
    disposeShadow,
  }
}
