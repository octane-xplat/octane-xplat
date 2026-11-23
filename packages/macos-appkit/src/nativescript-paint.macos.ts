import type { Color } from '@nativescript/core/color'
import type { CoreTypes } from '@nativescript/core/core-types'
/* oxlint-disable xplat/no-ns-deep-import -- The AppKit View loads this registry while Core initializes. Use the defining modules to avoid a cycle through the Core barrel. */
import { CssProperty, ShorthandProperty } from '@nativescript/core/ui/core/properties'
import { Style } from '@nativescript/core/ui/styling/style'
import {
  borderBottomLeftRadiusProperty,
  borderBottomRightRadiusProperty,
  borderTopLeftRadiusProperty,
  borderTopRightRadiusProperty,
} from '@nativescript/core/ui/styling/style-properties'
import { PercentLength } from '@nativescript/core/ui/styling/length-shared'
/* oxlint-enable xplat/no-ns-deep-import */
import type { Background } from '@nativescript/core/ui/styling/background-common'
import { layout } from '@nativescript/core/utils'
import { CATransaction, type CALayer } from '@octane-xplat/platform/macos'
import { createBoxPaint } from './box-paint'
import type { BoxPaintNode } from './box-paint-state'
import type { AppKitView, PropBag } from './model'
import { splitStyleTokens } from './css-text'
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

const additionalPaintProperties = [
  ['borderStyle', 'border-style'],
  ['borderTopStyle', 'border-top-style'],
  ['borderRightStyle', 'border-right-style'],
  ['borderBottomStyle', 'border-bottom-style'],
  ['borderLeftStyle', 'border-left-style'],
  ['outline', 'outline'],
  ['outlineColor', 'outline-color'],
  ['outlineOffset', 'outline-offset'],
  ['outlineStyle', 'outline-style'],
  ['outlineWidth', 'outline-width'],
].map(([name, cssName]) => {
  const property = new CssProperty<Style, unknown>({ name, cssName })
  property.register(Style)
  return property
})

const coreRadiusProperties = [
  borderTopLeftRadiusProperty,
  borderTopRightRadiusProperty,
  borderBottomRightRadiusProperty,
  borderBottomLeftRadiusProperty,
] as readonly CssProperty<Style, CoreTypes.PercentLengthType>[]

const updateBackgroundRadius = [
  (background: Background, value: number) => background.withBorderTopLeftRadius(value),
  (background: Background, value: number) => background.withBorderTopRightRadius(value),
  (background: Background, value: number) => background.withBorderBottomRightRadius(value),
  (background: Background, value: number) => background.withBorderBottomLeftRadius(value),
]

// Core's default radius declarations use fixed lengths. On AppKit, keep
// percentages in the resolved style so painting can use the live layer size.
coreRadiusProperties.forEach((property, index) => {
  property.overrideHandlers({
    name: property.name,
    cssName: property.cssLocalName,
    valueConverter: PercentLength.parse,
    valueChanged(style, _old, radius) {
      const pixels = PercentLength.toDevicePixels(radius, 0, 0)
      if (!Number.isFinite(pixels) || pixels < 0) {
        throw new Error(`Invalid ${property.cssLocalName}: ${String(radius)}`)
      }
      style.backgroundInternal = updateBackgroundRadius[index](style.backgroundInternal, pixels)
    },
  })
})

new ShorthandProperty<Style, CoreTypes.PercentLengthType | symbol>({
  name: 'borderRadius',
  cssName: 'border-radius',
  getter() {
    const [first, ...rest] = coreRadiusProperties.map((property) => radiusValue(this, property.name))
    return rest.every((radius) => PercentLength.equals(first, radius))
      ? first
      : [first, ...rest].map(PercentLength.convertToString).join(' ')
  },
  converter(value) {
    const parts = typeof value === 'string' ? splitStyleTokens(value) : [value]
    const [top, right = top, bottom = top, left = right] = parts
    return coreRadiusProperties.map((property, index) => [property, [top, right, bottom, left][index]])
  },
}).register(Style)

export const coreBoxPaintProperties = [...coreRadiusProperties, ...additionalPaintProperties]

function radiusValue(style: Style, name: string): CoreTypes.PercentLengthType {
  return Reflect.get(style, name)
}

function colorCss(color: Color) {
  return `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a / 255})`
}

function boxStyle(background: Background, resolvedStyle: Style): PropBag {
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
    const key = `border${corner}Radius` as const
    const radius = radiusValue(resolvedStyle, key)
    if (typeof radius === 'object' && radius.unit === '%') {
      // Core's background snapshot converts percentages against size zero.
      // Pass the resolved style to the painter so it can use the live layer.
      style[key] = `${radius.value * 100}%`
    } else if (background[key]) {
      style[key] = layout.toDeviceIndependentPixels(background[key])
    }
  }
  for (const property of additionalPaintProperties) {
    const value = Reflect.get(resolvedStyle, property.name)
    if (value != null) {
      style[property.name] = value
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
export function paintNativeScriptBackground(
  view: AppKitView | null,
  background: Background,
  resolvedStyle: Style,
) {
  if (!view) {
    return
  }
  const existing = views.get(view)
  const style = boxStyle(background, resolvedStyle)
  if (
    existing?.background === background &&
    Object.keys(existing.backgroundStyle).length === Object.keys(style).length &&
    Object.keys(style).every((key) => Object.is(style[key], existing.backgroundStyle[key]))
  ) {
    return
  }
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

export function syncNativeScriptPaintGeometry(view: AppKitView | null) {
  const state = view && views.get(view)
  if (state) {
    CATransaction.begin()
    try {
      CATransaction.setDisableActions(true)
      paint.syncGeometry(state.node)
    } finally {
      CATransaction.commit()
    }
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
