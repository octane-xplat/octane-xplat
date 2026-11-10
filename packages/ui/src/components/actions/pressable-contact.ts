/** The tap detector follows view-local coordinates. A panning ancestor can
 * keep those coordinates inside slop while the finger travels across screen.
 * Track only this host's Android contact, in physical screen pixels. */
export interface PressableMotionEvent {
  getActionMasked(): number
  getRawX(): number
  getRawY(): number
  getDownTime(): number
  getPointerCount(): number
}

export function createPressableContact() {
  let contact: { time: number; x: number; y: number; slop: number; rejected: boolean } | undefined

  function update(event: PressableMotionEvent) {
    if (!contact || event.getDownTime() !== contact.time) {
      return
    }

    const dx = event.getRawX() - contact.x
    const dy = event.getRawY() - contact.y

    if (
      event.getActionMasked() === 3 ||
      event.getPointerCount() > 1 ||
      dx * dx + dy * dy > contact.slop * contact.slop
    ) {
      contact.rejected = true
    }
  }

  return {
    touch(event: PressableMotionEvent, slop: number) {
      if (event.getActionMasked() === 0) {
        contact = {
          time: event.getDownTime(),
          x: event.getRawX(),
          y: event.getRawY(),
          slop,
          rejected: false,
        }
      }

      update(event)
    },
    allows(event?: PressableMotionEvent) {
      // Keyboard/accessibility activation has no touch stream. iOS keeps its
      // recognizer arbitration; there is no Android MotionEvent on that path.
      if (!event || !contact) {
        return true
      }

      update(event)
      return event.getDownTime() === contact.time && !contact.rejected
    },
    cancel() {
      if (contact) {
        contact.rejected = true
      }
    },
  }
}

export type PressableContact = ReturnType<typeof createPressableContact>

/** Native payloads carry Android-only members beyond the shared JSX facade.
 * Narrow them at ingress rather than widening the cross-platform event API. */
export function pressableMotion(event: unknown): PressableMotionEvent | undefined {
  if (!event || typeof event !== 'object' || !('android' in event)) {
    return undefined
  }

  const motion = event.android

  if (isPressableMotion(motion)) {
    return motion
  }

  return undefined
}

function isPressableMotion(motion: unknown): motion is PressableMotionEvent {
  return Boolean(
    motion &&
    typeof motion === 'object' &&
    'getActionMasked' in motion &&
    typeof motion.getActionMasked === 'function' &&
    'getRawX' in motion &&
    typeof motion.getRawX === 'function' &&
    'getRawY' in motion &&
    typeof motion.getRawY === 'function' &&
    'getDownTime' in motion &&
    typeof motion.getDownTime === 'function' &&
    'getPointerCount' in motion &&
    typeof motion.getPointerCount === 'function',
  )
}

export function pressableContext(event: unknown): unknown {
  if (event && typeof event === 'object' && 'view' in event) {
    const view = event.view

    if (view && typeof view === 'object' && '_context' in view) {
      return view._context
    }
  }

  return undefined
}
