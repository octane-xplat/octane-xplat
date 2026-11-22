import type { Color, Style } from '@nativescript/core'
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
  backgroundStyle: PropBag
  transformStyle: PropBag
  background?: Background
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

function acquirePaint(view: AppKitView): CoreBoxPaint {
  const existing = views.get(view)
  if (existing) {
    return existing
  }
  const state = { node: { view, props: {} }, style: {}, backgroundStyle: {}, transformStyle: {} }
  views.set(view, state)
  return state
}

function applyStyle(state: CoreBoxPaint) {
  const style = { ...state.backgroundStyle, ...state.transformStyle }
  state.node.appliedStyle = style
  state.node.computedStyle = style
  paint.applyBoxStyle(state.node, state.style, style)
  state.style = style
}

/** Apply resolved Core box properties through the AppKit paint coordinator. */
export function paintNativeScriptBackground(view: AppKitView | null, background: Background) {
  if (!view) {
    return
  }
  const existing = views.get(view)
  if (existing?.background === background) {
    return
  }
  const style = boxStyle(background)
  if (!existing && !background.color && !Object.keys(style).length) {
    return
  }
  const state = acquirePaint(view)
  state.backgroundStyle = style
  applyStyle(state)

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
  state.background = background
}

function translateInPoints(value: Style['translateX']) {
  if (typeof value !== 'object' || value.unit === '%') {
    return value
  }
  return value.unit === 'px' ? layout.toDeviceIndependentPixels(value.value) : value.value
}

/** Share the AppKit painter's transform order and coordinate conversion. */
export function paintNativeScriptTransform(view: AppKitView | null, style: Style) {
  if (!view) {
    return
  }
  const { rotate, rotateX, rotateY, translateX, translateY, scaleX, scaleY } = style
  const next: PropBag = {}
  if (rotate || rotateX || rotateY || translateX || translateY || scaleX !== 1 || scaleY !== 1) {
    Object.assign(next, {
      rotate, rotateX, rotateY, scaleX, scaleY, perspective: style.perspective,
      translateX: translateInPoints(translateX), translateY: translateInPoints(translateY),
    })
  } else if (!views.has(view)) {
    return
  }
  const state = acquirePaint(view)
  state.transformStyle = next
  CATransaction.begin()
  try {
    CATransaction.setDisableActions(true)
    applyStyle(state)
  } finally {
    CATransaction.commit()
  }
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
