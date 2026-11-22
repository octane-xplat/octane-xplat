import type { Color } from '@nativescript/core'
import type { Background } from '@nativescript/core/ui/styling/background-common'
import { layout } from '@nativescript/core/utils'
import { CATransaction, type CALayer } from '@octane-xplat/platform/macos'
import { createBoxPaint } from './box-paint'
import type { BoxPaintNode } from './box-paint-state'
import type { AppKitView, PropBag } from './model'
import { nativeColor } from './native-colors'
import { setProjectionScale, type ProjectionScale } from './projection-paint'

interface CoreBoxPaint {
  node: BoxPaintNode
  style: PropBag
  background: Background | undefined
  solid?: {
    layer: CALayer
    original: CALayer['backgroundColor']
  }
}

const paint = createBoxPaint()
const views = new WeakMap<AppKitView, CoreBoxPaint>()

function colorCss(color: Color) {
  return `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a / 255})`
}

function boxStyle(background: Background): PropBag {
  const style: PropBag = {}
  const image = background.image
  if (image) {
    if (typeof image === 'string') {
      style.backgroundImage = image
    } else {
      const stops = image.colorStops.map(({ color, offset }) =>
        colorCss(color) + (offset ? ` ${offset.value * 100}%` : ''),
      )
      style.backgroundImage = `linear-gradient(${image.angle}rad, ${stops.join(', ')})`
    }
    style.backgroundPosition = background.position
    style.backgroundSize = background.size
    style.backgroundRepeat = background.repeat
  }
  for (const side of ['Top', 'Right', 'Bottom', 'Left'] as const) {
    const width = background[`border${side}Width`]
    const color = background[`border${side}Color`]
    if (width) {
      style[`border${side}Width`] = layout.toDeviceIndependentPixels(width)
    }
    if (color) {
      style[`border${side}Color`] = colorCss(color)
    }
  }
  for (const corner of ['TopLeft', 'TopRight', 'BottomRight', 'BottomLeft'] as const) {
    const radius = background[`border${corner}Radius`]
    if (radius) {
      style[`border${corner}Radius`] = layout.toDeviceIndependentPixels(radius)
    }
  }
  if (background.boxShadows?.length) {
    // Core stores shadows back-to-front. The shared painter accepts CSS order.
    style.boxShadow = [...background.boxShadows].reverse().map((shadow) => {
      const lengths = [shadow.offsetX, shadow.offsetY, shadow.blurRadius, shadow.spreadRadius]
        .map((length) => layout.toDeviceIndependentPixels(length) + 'px')
      return [shadow.inset ? 'inset' : '', ...lengths, colorCss(shadow.color)].join(' ')
    }).join(', ')
  }
  return style
}

/** Apply resolved Core box properties through the AppKit paint coordinator. */
export function paintNativeScriptBackground(view: AppKitView | null, background: Background) {
  if (!view) {
    return
  }
  let state = views.get(view)
  if (state?.background === background) {
    return
  }
  const style = boxStyle(background)
  if (!state) {
    if (!background.color && !Object.keys(style).length) {
      return
    }
    state = { node: { view, props: {} }, style: {}, background: undefined }
    views.set(view, state)
  }
  const previous = state.style
  state.node.appliedStyle = style
  state.node.computedStyle = style
  paint.applyBoxStyle(state.node, previous, style)

  if (background.color) {
    view.wantsLayer = true
    const layer = view.layer
    if (layer) {
      state.solid ??= { layer, original: layer.backgroundColor }
      layer.backgroundColor = nativeColor(colorCss(background.color)).CGColor
    }
  } else if (state.solid) {
    const { layer, original } = state.solid
    state.solid = undefined
    layer.backgroundColor = original
  }
  state.style = style
  state.background = background
}

export function syncNativeScriptProjection(view: AppKitView, scale: ProjectionScale | null) {
  setProjectionScale(view, scale)
  const state = views.get(view)
  if (state) {
    CATransaction.begin()
    try {
      CATransaction.setDisableActions(true)
      paint.syncProjection(state.node)
    } finally {
      CATransaction.commit()
    }
  }
}

export function disposeNativeScriptPaint(view: AppKitView) {
  setProjectionScale(view, null)
  const state = views.get(view)
  if (!state) {
    return
  }
  views.delete(view)
  if (state.solid) {
    const { layer, original } = state.solid
    layer.backgroundColor = original
  }
  paint.dispose(state.node)
}
