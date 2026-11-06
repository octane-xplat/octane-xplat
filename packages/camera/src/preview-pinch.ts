import type { CameraPinchEvent } from './types'

const PINCH_STATE = ['cancelled', 'began', 'moved', 'ended'] as const

/** Attach a notification-only 'pinch' observer to a preview host view and
 *  report each event as a `CameraPinchEvent`: NS's cumulative scale plus
 *  the focal point normalized into preview space (the same space
 *  `observePreviewTap` uses). The recognizer never consumes the gesture —
 *  layered recognizers still see the touches. Platforms whose runtime
 *  never dispatches 'pinch' simply never fire the callback. */
export function observePreviewPinch(
  view: any,
  onPinch: ((event: CameraPinchEvent) => void) | undefined,
): () => void {
  if (!view || !onPinch || typeof view.on !== 'function') {
    return () => {}
  }

  const handler = (args: any) => {
    const size = view.getActualSize?.()
    const width = size?.width ?? 0
    const height = size?.height ?? 0
    const fx = typeof args?.getFocusX === 'function' ? args.getFocusX() : NaN
    const fy = typeof args?.getFocusY === 'function' ? args.getFocusY() : NaN
    const hasFocus = width > 0 && height > 0 && Number.isFinite(fx) && Number.isFinite(fy)

    onPinch({
      scale: typeof args?.scale === 'number' ? args.scale : 1,
      state: PINCH_STATE[args?.state] ?? 'moved',
      focus: hasFocus
        ? {
            x: Math.min(1, Math.max(0, fx / width)),
            y: Math.min(1, Math.max(0, fy / height)),
          }
        : { x: 0.5, y: 0.5 },
    })
  }

  view.on('pinch', handler)
  return () => view.off?.('pinch', handler)
}
