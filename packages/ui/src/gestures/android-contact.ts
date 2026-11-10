import type { InputContact, InputFrame } from './owner'
import type { Point } from './types'

/** Public MotionEvent methods only; pointer indices are never contact identities. */
export interface AndroidContactEvent {
  getActionMasked(): number
  getActionIndex(): number
  getPointerCount(): number
  getPointerId(index: number): number
  getToolType(index: number): number
  getX(index: number): number
  getY(index: number): number
  getRawX(index?: number): number
  getRawY(index?: number): number
  getEventTime(): number
  getDownTime(): number
}

export interface AndroidContactSpace {
  readonly density: number
  readonly windowOrigin: Point // screen origin in logical units
  readonly indexedRawCoordinates: boolean // Android API 29+
  /** On older hosts, map local pixel deltas through the current native transform. */
  vector(x: number, y: number): Point
}

export function androidContactFrame(
  event: AndroidContactEvent,
  space: AndroidContactSpace,
  hitPath: readonly object[],
): InputFrame | null {
  const action = event.getActionMasked()
  const type: InputFrame['type'] | null =
    action === 0 || action === 5
      ? 'down'
      : action === 2
        ? 'move'
        : action === 1 || action === 6
          ? 'up'
          : action === 3
            ? 'cancel'
            : null

  if (!type) {
    return null
  }

  if (!Number.isFinite(space.density) || space.density <= 0) {
    throw new Error('Android gesture density must be positive and finite')
  }

  const count = event.getPointerCount(),
    changedIndex = event.getActionIndex()

  if (count < 1 || changedIndex < 0 || changedIndex >= count) {
    throw new Error('Invalid Android contact indices')
  }

  const contact = (index: number): InputContact => {
    let rawX: number, rawY: number

    if (space.indexedRawCoordinates) {
      rawX = event.getRawX(index)
      rawY = event.getRawY(index)
    } else {
      const offset = space.vector(
        event.getX(index) - event.getX(0),
        event.getY(index) - event.getY(0),
      )

      rawX = event.getRawX() + offset.x
      rawY = event.getRawY() + offset.y
    }

    const screen = { x: rawX / space.density, y: rawY / space.density }
    const tool = event.getToolType(index)

    return {
      id: String(event.getPointerId(index)),
      kind: tool === 2 || tool === 4 ? 'pen' : tool === 3 ? 'mouse' : 'touch',
      screen,
      window: { x: screen.x - space.windowOrigin.x, y: screen.y - space.windowOrigin.y },
    }
  }

  const contacts: InputContact[] = []

  if (type !== 'cancel') {
    for (let index = 0; index < count; index++) {
      if (type !== 'up' || index !== changedIndex) {
        contacts.push(contact(index))
      }
    }
  }

  return {
    type,
    time: event.getEventTime(),
    changed: contact(changedIndex),
    contacts,
    hitPath,
    cohort: `android:${event.getDownTime()}`,
    partialContacts: true,
  }
}
