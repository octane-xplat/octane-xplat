import type { CancelReason } from './types'
import type { InputContact, InputFrame } from './owner'

/** Reconcile native target-split contacts and recover when a disabled host missed its final up. */
export function createNativeContactStream(dispatch: (frame: InputFrame) => void) {
  const contacts = new Map<string, InputContact>()
  let cohort: string | undefined
  let began = false
  let last: InputFrame | null = null
  function cancel(reason: CancelReason) {
    const prior = last
    const active = contacts.size > 0

    contacts.clear()
    cohort = undefined
    began = false
    if (prior && active) {
      dispatch({ ...prior, type: 'cancel', contacts: [], cancelReason: reason })
    }
  }

  return {
    dispatch(frame: InputFrame) {
      if (cohort !== undefined && frame.cohort !== undefined && cohort !== frame.cohort) {
        cancel('system')
      }

      if (!contacts.size) {
        cohort = frame.cohort
        began = frame.type === 'down' && !frame.nativeOwned
      }

      if (!frame.partialContacts || frame.type === 'cancel') {
        contacts.clear()
      }

      for (const contact of frame.contacts) {
        contacts.set(contact.id, contact)
      }

      if (frame.partialContacts && frame.type === 'up') {
        contacts.delete(frame.changed.id)
      }

      last = {
        ...frame,
        contacts: [...contacts.values()],
        nativeOwned: frame.nativeOwned || !began,
      }

      dispatch(last)
      if (!contacts.size) {
        cohort = undefined
        began = false
      }
    },
    cancel,
  }
}

export type NativeContactStream = ReturnType<typeof createNativeContactStream>

export interface ContactBirth {
  readonly id: string
  readonly began: boolean
  readonly time: number
}

let nextCohort = 0

/** UIKit's allTouches is authoritative; timestamps distinguish a reused UITouch after a missed end. */
export function createGlobalContactCohort() {
  let cohort = `contact:${++nextCohort}`
  const births = new Map<string, number>()

  return {
    observe(type: InputFrame['type'], contacts: readonly ContactBirth[]): string {
      if (
        type === 'down' &&
        contacts.length &&
        !contacts.some(
          (contact) =>
            births.has(contact.id) && (!contact.began || births.get(contact.id) === contact.time),
        )
      ) {
        cohort = `contact:${++nextCohort}`
      }

      const previous = new Map(births)

      births.clear()
      for (const contact of contacts) {
        births.set(
          contact.id,
          contact.began ? contact.time : (previous.get(contact.id) ?? contact.time),
        )
      }

      return cohort
    },
  }
}

export type GlobalContactCohort = ReturnType<typeof createGlobalContactCohort>
