import { expect, it } from 'vitest'
import { createGlobalContactCohort, createNativeContactStream } from './native-contact-stream'
import { isRawRecognizer, retainRawRecognizer } from './raw-recognizers'
import type { InputFrame } from './owner'

function frame(
  type: InputFrame['type'],
  ids: string[],
  changed = ids[0] ?? '1',
  cohort = 'first',
): InputFrame {
  const contact = (id: string) => ({
    id,
    kind: 'touch' as const,
    window: { x: Number(id) * 10, y: 20 },
    screen: null,
  })

  return {
    type,
    time: 10,
    cohort,
    partialContacts: true,
    contacts: ids.map(contact),
    changed: contact(changed),
    hitPath: [],
  }
}

it('merges native target-split pointers without mistaking the second target for a new contact sequence', () => {
  const received: InputFrame[] = [],
    stream = createNativeContactStream((value) => received.push(value))

  stream.dispatch(frame('down', ['1']))
  stream.dispatch(frame('down', ['2']))
  stream.dispatch(frame('up', [], '1'))
  stream.dispatch(frame('up', [], '2'))
  expect(received.map((value) => value.contacts.map((contact) => contact.id))).toEqual([
    ['1'],
    ['1', '2'],
    ['2'],
    [],
  ])
})

it('closes a missed native end before admitting a fresh down even when the pointer ID is reused', () => {
  const received: InputFrame[] = [],
    stream = createNativeContactStream((value) => received.push(value))

  stream.dispatch(frame('down', ['1']))
  stream.dispatch(frame('move', ['1']))
  stream.dispatch(frame('down', ['1'], '1', 'next-down-time'))
  expect(received.map((value) => value.type)).toEqual(['down', 'move', 'cancel', 'down'])
  expect(received[2].contacts).toEqual([])
  expect(received[2].cancelReason).toBe('system')
  expect(received[3].nativeOwned).toBe(false)
})

it('does not activate midway through a sequence whose original down was never observed', () => {
  const received: InputFrame[] = [],
    stream = createNativeContactStream((value) => received.push(value))

  stream.dispatch(frame('move', ['1']))
  stream.dispatch(frame('down', ['2']))
  expect(received.every((value) => value.nativeOwned)).toBe(true)
  stream.dispatch(frame('up', [], '1'))
  stream.dispatch(frame('up', [], '2'))
  stream.dispatch(frame('down', ['1'], '1', 'fresh'))
  expect(received.at(-1)?.nativeOwned).toBe(false)
})

it('recovers cleanup after a cancellation observer throws', () => {
  const received: InputFrame[] = [],
    stream = createNativeContactStream((value) => {
      received.push(value)
      if (value.type === 'cancel') {
        throw new Error('observer')
      }
    })

  stream.dispatch(frame('down', ['1']))
  expect(() => stream.cancel('detached')).toThrow('observer')
  stream.cancel('detached')
  stream.dispatch(frame('down', ['2'], '2', 'next'))
  expect(received.map((value) => value.type)).toEqual(['down', 'cancel', 'down'])
})

it('keeps UIKit simultaneous down and move callbacks in one cohort and detects a reused touch after a missed end', () => {
  const tracker = createGlobalContactCohort()
  const first = tracker.observe('down', [{ id: '1', began: true, time: 100 }])

  expect(tracker.observe('down', [{ id: '1', began: true, time: 100 }])).toBe(first)
  expect(tracker.observe('move', [{ id: '1', began: false, time: 120 }])).toBe(first)
  expect(
    tracker.observe('down', [
      { id: '1', began: false, time: 120 },
      { id: '2', began: true, time: 130 },
    ]),
  ).toBe(first)

  const fresh = tracker.observe('down', [{ id: '1', began: true, time: 200 }])

  expect(fresh).not.toBe(first)
  tracker.observe('up', [])
  expect(tracker.observe('down', [{ id: '1', began: true, time: 200 }])).not.toBe(fresh)
})

it('retains a shared raw recognizer until all observers release it', () => {
  const recognizer = {},
    a = retainRawRecognizer(recognizer),
    b = retainRawRecognizer(recognizer)

  a()
  a()
  expect(isRawRecognizer(recognizer)).toBe(true)
  b()
  expect(isRawRecognizer(recognizer)).toBe(false)
})
