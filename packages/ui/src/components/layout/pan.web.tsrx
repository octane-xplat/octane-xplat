import { useEffect, useRef } from 'octane'
import type { PanEvent, PanState } from '../../props'

const VELOCITY_MAX_AGE_MS = 100
// Distance before the pointer is claimed by the gesture — matches the drag
// activation slop in packages/motion. Below it the press is still a click.
const PAN_SLOP_PX = 8

/** Shared pan plumbing for web leaves — pointerdown/move/up/cancel with
 *  pointer capture, normalized to the shared gesture shape
 *  {x,y,dx,dy,vx,vy,state,target}. `pointermove` isn't in octane's
 *  delegated-event set, so listeners attach to the element directly —
 *  that's why callers pass the bound-element ref.
 *
 *  Capture is deferred until the pointer travels past PAN_SLOP_PX: capturing
 *  at pointerdown retargets the trailing click to this element and swallows
 *  activations of nested controls. Until the slop is crossed the gesture only
 *  observes; once it owns the pointer, the retargeted tail (moves, up, and
 *  the drag's click) lands here, and a one-shot guard suppresses that click
 *  so a drag on a pressable pan host does not activate it. */
export function usePan(el: { current: HTMLElement | null }, cb?: (e: PanEvent) => void): void {
  const callback = useRef(cb)

  // Retain the last observer so disabling can deliver its terminal event.
  if (cb) {
    callback.current = cb
  }

  const enabled = Boolean(cb)

  useEffect(() => {
    const node = el.current

    if (!node || !enabled) {
      return
    }

    const doc = node.ownerDocument

    let sx = 0,
      sy = 0,
      active = false,
      captured = false,
      clickGuard = false,
      pointer = -1

    let last = 0,
      lx = 0,
      t0 = 0

    let vx = 0,
      vy = 0,
      velocityAt = 0

    const emit = (e: Pick<PointerEvent, 'clientX' | 'clientY'>, state: PanState) => {
      const now = performance.now()
      const dt = Math.max(now - t0, 1) / 1000
      const dx = e.clientX - lx
      const dy = e.clientY - last

      if (state === 'began') {
        vx = vy = 0
        velocityAt = now
      } else if (dx !== 0 || dy !== 0) {
        // Preserve this sample for pointer-up when it repeats the final coordinates.
        vx = dx / dt
        vy = dy / dt
        velocityAt = now
      }

      lx = e.clientX
      last = e.clientY
      t0 = now

      const fresh = now - velocityAt <= VELOCITY_MAX_AGE_MS

      callback.current?.({
        x: e.clientX - sx,
        y: e.clientY - sy,
        dx: e.clientX - sx,
        dy: e.clientY - sy,
        vx: fresh ? vx : 0,
        vy: fresh ? vy : 0,
        state,
        target: node,
      })
    }

    const detach = () => {
      doc.removeEventListener('pointermove', move)
      doc.removeEventListener('pointerup', up)
      doc.removeEventListener('pointercancel', cancel)
    }

    const down = (e: PointerEvent) => {
      if (active || e.isPrimary === false || e.button !== 0) {
        return
      }

      active = true
      captured = false
      clickGuard = false
      pointer = e.pointerId
      sx = e.clientX
      sy = e.clientY
      t0 = performance.now()
      lx = sx
      last = sy
      doc.addEventListener('pointermove', move)
      doc.addEventListener('pointerup', up)
      doc.addEventListener('pointercancel', cancel)
      emit(e, 'began')
    }

    const move = (e: PointerEvent) => {
      if (!active || e.pointerId !== pointer) {
        return
      }

      // A nested recognizer can replace pending capture before the browser
      // ever delivers got/lostpointercapture to this node.
      if (captured && node.hasPointerCapture && !node.hasPointerCapture(pointer)) {
        finishAtLast('cancelled')
        return
      }

      if (!captured && Math.hypot(e.clientX - sx, e.clientY - sy) > PAN_SLOP_PX) {
        try {
          node.setPointerCapture?.(e.pointerId)
        } catch (error) {
          // Synthetic pointer dispatch has no active browser pointer.
          if (e.isTrusted || (error as Error).name !== 'NotFoundError') {
            throw error
          }
        }

        captured = true
      }

      emit(e, 'moved')
    }

    const terminate = (
      e: Pick<PointerEvent, 'clientX' | 'clientY'>,
      state: 'ended' | 'cancelled',
    ) => {
      active = false
      detach()

      const wasCaptured = captured

      captured = false
      clickGuard = wasCaptured && state === 'ended'
      // Clear ownership before release or user code can reenter this adapter.
      if (wasCaptured && node.hasPointerCapture?.(pointer)) {
        node.releasePointerCapture(pointer)
      }

      emit(e, state)
    }

    const finishAtLast = (state: 'cancelled') => {
      if (active) {
        terminate({ clientX: lx, clientY: last }, state)
      }
    }

    const finish = (e: PointerEvent, state: 'ended' | 'cancelled') => {
      if (!active || e.pointerId !== pointer) {
        return
      }

      if (captured && node.hasPointerCapture && !node.hasPointerCapture(pointer)) {
        finishAtLast('cancelled')
        return
      }

      terminate(e, state)
    }

    const lost = (e: PointerEvent) => {
      if (e.target === node && e.pointerId === pointer) {
        finishAtLast('cancelled')
      }
    }

    const up = (e: PointerEvent) => finish(e, 'ended')
    const cancel = (e: PointerEvent) => finish(e, 'cancelled')

    const click = (e: MouseEvent) => {
      if (!clickGuard) {
        return
      }

      clickGuard = false
      e.stopPropagation()
      e.preventDefault()
    }

    node.addEventListener('pointerdown', down)
    node.addEventListener('click', click, true)
    node.addEventListener('lostpointercapture', lost)
    return () => {
      node.removeEventListener('pointerdown', down)
      node.removeEventListener('click', click, true)
      node.removeEventListener('lostpointercapture', lost)
      finishAtLast('cancelled')
      detach()
    }
  }, [el, enabled])
}
