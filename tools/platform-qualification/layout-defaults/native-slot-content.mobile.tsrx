/** @jsxImportSource @octane-xplat/jsx */
import type { View } from '@nativescript/core'

export type SlotName = 'effect' | 'trigger' | 'preview' | 'sheet'
export const slots = new Map<SlotName, { first: View | null; second: View | null }>()

const refs = new Map<
  SlotName,
  { first: (view: View | null) => void; second: (view: View | null) => void }
>()

export function Slot(props: { name: SlotName }) {
  let callbacks = refs.get(props.name)

  if (!callbacks) {
    const entry: { first: View | null; second: View | null } = { first: null, second: null }

    slots.set(props.name, entry)
    callbacks = {
      first: (view) => {
        entry.first = view
      },
      second: (view) => {
        entry.second = view
      },
    }

    refs.set(props.name, callbacks)
  }

  return (
    <>
      <masonview className="native-slot-child" ref={callbacks.first} />
      <masonview className="native-slot-child" ref={callbacks.second} />
    </>
  )
}
