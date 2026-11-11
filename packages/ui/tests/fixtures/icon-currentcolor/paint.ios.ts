/// <reference path="../../../src/vendor/ui-svg/src/typings/SVGKit.d.ts" />
import type { SVGView } from '../../../src/vendor/ui-svg/src/index.common'

// Native vector properties only: no raster representation or pixel access.
export function paint(host: SVGView | null, id: string, property: string): string | null {
  const image: SVGKImage | undefined = host?.nativeViewProtected?.image
  if (!image) {
    return null
  }
  const layer = image.layerWithIdentifier(id)
  if (!(layer instanceof CAShapeLayer)) {
    throw new Error(`Missing shape ${id}`)
  }
  const color = property === 'fill' ? layer.fillColor : layer.strokeColor
  if (!color) {
    return 'none'
  }
  const r = new interop.Reference<number>()
  const g = new interop.Reference<number>()
  const b = new interop.Reference<number>()
  const a = new interop.Reference<number>()
  if (!UIColor.colorWithCGColor(color).getRedGreenBlueAlpha(r, g, b, a)) {
    throw new Error('Non-RGB paint')
  }
  if (a.value !== 1) {
    throw new Error(`Unexpected alpha ${a.value}`)
  }
  return '#' + [r.value, g.value, b.value]
    .map((v) => Math.round(v * 255).toString(16).padStart(2, '0'))
    .join('')
}
