import type { NSView } from '@octane-xplat/platform/macos'

interface Point {
  x: number
  y: number
}

/** Native view coordinates, including rendered layer transforms. NSView's
 * coordinate conversion alone deliberately ignores its backing transform. */
export function layerViewPoint(
  view: NSView,
  point: Point,
  from: NSView | null = null,
): Point | null {
  const source = from ?? view.window?.contentView

  if (
    view.layer &&
    source?.layer &&
    typeof source.convertPointToLayer === 'function' &&
    typeof view.convertPointFromLayer === 'function' &&
    typeof view.layer.convertPointFromLayer === 'function'
  ) {
    const local = from ? point : source.convertPointFromView(point, null)
    const inLayer = source.convertPointToLayer(local)
    const converted = view.layer.convertPointFromLayer(inLayer, source.layer)
    const result = view.convertPointFromLayer(converted)

    return Number.isFinite(result?.x) && Number.isFinite(result?.y) ? result : null
  }

  const result = view.convertPointFromView(point, from)

  return Number.isFinite(result?.x) && Number.isFinite(result?.y) ? result : null
}
