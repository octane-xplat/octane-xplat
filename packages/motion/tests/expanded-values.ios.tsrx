// bun run probe run packages/motion/tests/expanded-values.ios.tsrx --target ios --deps @octane-xplat/motion
import { runExpandedValues } from './expanded-values-contract.mobile.tsrx'
import type { ProbeContext } from '../../../tools/probe/context'

type ClipRect = { x: number; y: number; width: number; height: number }
function clipBounds(layer: CALayer, depth = 0, parentX = 0, parentY = 0): ClipRect[] {
  if (!layer || depth > 8) {
    return []
  }

  const found: ClipRect[] = []
  const offsetX = parentX + layer.frame.origin.x
  const offsetY = parentY + layer.frame.origin.y

  if (layer.isKindOfClass(CAShapeLayer.class()) && layer.path) {
    const r = CGPathGetPathBoundingBox(layer.path)

    found.push({
      x: r.origin.x + offsetX,
      y: r.origin.y + offsetY,
      width: r.size.width,
      height: r.size.height,
    })
  }

  if (layer.mask) {
    found.push(...clipBounds(layer.mask, depth + 1, offsetX, offsetY))
  }

  for (let i = 0; i < (layer.sublayers?.count ?? 0); i++) {
    found.push(...clipBounds(layer.sublayers.objectAtIndex(i), depth + 1, offsetX, offsetY))
  }

  return found
}

export async function run(ctx: ProbeContext) {
  await runExpandedValues(ctx, (ctx, host, frame) => {
    const mask = host.ios.layer.mask

    ctx.assert(`redraw ${frame} retains Mason mask`, Boolean(mask), true)

    const bounds = clipBounds(mask)

    ctx.assert(
      `redraw ${frame} retains actual native crop`,
      bounds.some(
        (r) =>
          Math.abs(r.x - (frame === 10 ? 20 : 12)) < 0.5 &&
          Math.abs(r.width - (frame === 10 ? 200 : 216)) < 0.5 &&
          Math.abs(r.height - (frame === 10 ? 80 : 128)) < 0.5,
      ),
      true,
    )
  })
}
