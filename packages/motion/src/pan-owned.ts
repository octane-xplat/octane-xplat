import { attachOwnedPan } from '@octane-xplat/ui/internal/gesture-input'
import type { PanSample } from '@octane-xplat/ui'
import type { PanCallbacks } from './host-types'
import type { DragInfo } from './types'

export function attachPan(
  node: object,
  axis: true | 'x' | 'y',
  callbacks: PanCallbacks,
): () => void {
  let last = { x: 0, y: 0 }
  const sample = (event: PanSample, cancelled = false): DragInfo => {
    const offset = event.translation
    const delta = { x: offset.x - last.x, y: offset.y - last.y }

    last = offset
    return {
      point: event.position.window,
      offset,
      delta,
      velocity: event.velocity ?? { x: 0, y: 0 },
      cancelled,
    }
  }

  return attachOwnedPan(node, {
    axis: axis === true ? 'both' : axis,
    onStart(event) {
      last = { x: 0, y: 0 }

      const info = sample(event)

      callbacks.start(event, info)
      callbacks.move(event, info)
    },
    onUpdate: (event) => callbacks.move(event, sample(event)),
    onFinalize: (terminal) =>
      callbacks.end(terminal.sample, sample(terminal.sample, terminal.outcome === 'cancelled')),
  })
}
