import type { PanCallbacks } from './host-types'
import type { DragInfo } from './types'

export function attachPan(
  node: HTMLElement,
  axis: true | 'x' | 'y',
  callbacks: PanCallbacks,
): () => void {
  const touchAction = node.style.touchAction

  node.style.touchAction = axis === 'x' ? 'pan-y' : axis === 'y' ? 'pan-x' : 'none'

  let pointer: number | undefined
  let active = false
  let clickPointer: number | undefined
  // A new contact anywhere starts an independent interaction, even if the
  // previous drag never produced a click. Keyboard clicks do not consume it.
  const clearClick = () => {
    clickPointer = undefined
  }
  const click = (event: MouseEvent) => {
    if (clickPointer === undefined || event.detail === 0) {
      return
    }
    if ('pointerId' in event && event.pointerId !== clickPointer) {
      return
    }

    clearClick()
    event.preventDefault()
    event.stopImmediatePropagation()
  }
  let start = { x: 0, y: 0 }
  let last = start
  let time = 0
  let velocity = { x: 0, y: 0 }
  let velocityTime = 0
  const sample = (event: PointerEvent, cancelled = false): DragInfo => {
    const point = cancelled ? last : { x: event.clientX, y: event.clientY }
    const delta = { x: point.x - last.x, y: point.y - last.y }
    const elapsed = event.timeStamp - time

    if (elapsed > 0 && (delta.x || delta.y)) {
      velocity = {
        x: (delta.x * 1000) / elapsed,
        y: (delta.y * 1000) / elapsed,
      }
      velocityTime = event.timeStamp
    } else if (event.timeStamp - velocityTime > 100) {
      velocity = { x: 0, y: 0 }
    }

    last = point
    time = event.timeStamp
    return {
      point,
      delta,
      offset: { x: point.x - start.x, y: point.y - start.y },
      velocity,
      cancelled,
    }
  }

  const down = (event: PointerEvent) => {
    if (pointer !== undefined || event.button !== 0 || event.isPrimary === false) {
      return
    }

    pointer = event.pointerId
    start = last = { x: event.clientX, y: event.clientY }
    time = velocityTime = event.timeStamp
    velocity = { x: 0, y: 0 }
  }

  const move = (event: PointerEvent) => {
    if (event.pointerId !== pointer) {
      return
    }

    const info = sample(event)

    if (!active) {
      const primary = axis === 'y' ? info.offset.y : info.offset.x
      const other = axis === 'y' ? info.offset.x : info.offset.y

      if (axis !== true && Math.abs(other) > 8 && Math.abs(primary) <= 8) {
        finish(event, true)
        return
      }

      if (
        (axis === true ? Math.hypot(info.offset.x, info.offset.y) : Math.abs(primary)) <= 8
      ) {
        return
      }

      try {
        node.setPointerCapture?.(event.pointerId)
      } catch (error) {
        // Synthetic pointer dispatch has no active browser pointer.
        if (event.isTrusted || (error as Error).name !== 'NotFoundError') {
          throw error
        }
      }
      active = true
      callbacks.start(event, info)
    }

    callbacks.move(event, info)
  }

  const finish = (event: PointerEvent, cancelled: boolean) => {
    if (pointer === undefined || event.pointerId !== pointer) {
      return
    }

    const id = pointer

    clickPointer = active && !cancelled ? id : undefined
    pointer = undefined
    if (active) {
      active = false
      callbacks.end(event, sample(event, cancelled))
    }

    if (node.hasPointerCapture?.(id)) {
      node.releasePointerCapture(id)
    }
  }

  const up = (event: PointerEvent) => finish(event, false)
  const cancel = (event: PointerEvent) => finish(event, true)

  node.ownerDocument.addEventListener('pointerdown', clearClick, true)
  node.addEventListener('click', click, true)
  node.addEventListener('pointerdown', down)
  node.ownerDocument.addEventListener('pointermove', move)
  node.ownerDocument.addEventListener('pointerup', up)
  node.ownerDocument.addEventListener('pointercancel', cancel)
  node.addEventListener('lostpointercapture', cancel)
  return () => {
    clearClick()
    node.ownerDocument.removeEventListener('pointerdown', clearClick, true)
    node.removeEventListener('click', click, true)
    node.removeEventListener('pointerdown', down)
    node.ownerDocument.removeEventListener('pointermove', move)
    node.ownerDocument.removeEventListener('pointerup', up)
    node.ownerDocument.removeEventListener('pointercancel', cancel)
    node.removeEventListener('lostpointercapture', cancel)
    if (pointer !== undefined && node.hasPointerCapture?.(pointer)) {
      node.releasePointerCapture(pointer)
    }

    node.style.touchAction = touchAction
  }
}
