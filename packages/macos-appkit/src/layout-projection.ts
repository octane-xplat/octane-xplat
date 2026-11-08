import type { BoxPaint } from './box-paint'
import type { Registry } from './registry'
import { setProjectionScale, type ProjectionScale } from './projection-paint'

interface Dependencies {
  boxPaint: Pick<BoxPaint, 'syncProjection'>
  registry: Pick<Registry, 'cssNodesByView'>
}

export type LayoutProjection = ReturnType<typeof createLayoutProjection>

export function createLayoutProjection(deps: Dependencies) {
  /** Temporary paint compensation without changing authored styles or layout.
   * Pass null to restore. Scalar radii/blur are exact only under uniform scale. */
  function setLayoutProjectionScale(view: object, scale: ProjectionScale | null): void {
    const node = deps.registry.cssNodesByView.get(view)

    if (!node) {
      return
    }

    const transaction = (globalThis as any).CATransaction

    transaction.begin()
    try {
      transaction.setDisableActions(true)
      setProjectionScale(view, scale)
      deps.boxPaint.syncProjection(node)
    } finally {
      transaction.commit()
    }
  }

  return { setLayoutProjectionScale }
}
