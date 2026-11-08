/** @jsxImportSource @octane-xplat/jsx */
import { useCallback } from 'octane'
import type { PinchEvent } from '../../props'

/** Shared pinch normalization for native leaves — NS pinch payloads
 *  ({scale, state:int}) map to the shared gesture shape with the same
 *  state coding as pan. Returns undefined when no callback is set so
 *  leaves can spread it straight into the gesture prop. */
const PINCH_STATE = ['cancelled', 'began', 'moved', 'ended'] as const

export function usePinch(cb?: (e: PinchEvent) => void): ((e: any) => void) | undefined {
  // Memoized so the driver's observer doesn't churn per render — each
  // re-subscribe would re-attach a native pinch recognizer.
  const handler = useCallback(
    (e: any) => {
      const focusX = typeof e.getFocusX === 'function' ? e.getFocusX() : undefined
      const focusY = typeof e.getFocusY === 'function' ? e.getFocusY() : undefined

      cb?.({
        scale: typeof e.scale === 'number' ? e.scale : 1,
        focusX: Number.isFinite(focusX) ? focusX : undefined,
        focusY: Number.isFinite(focusY) ? focusY : undefined,
        state: PINCH_STATE[e.state] ?? 'moved',
        target: e.view ?? e.object,
      })
    },
    [cb],
  )

  return cb ? handler : undefined
}
