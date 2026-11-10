import { expect, it } from 'vitest'
import {
  androidContactFrame,
  type AndroidContactEvent,
  type AndroidContactSpace,
} from './android-contact'

const space: AndroidContactSpace = {
  density: 2,
  windowOrigin: { x: 10, y: 20 },
  indexedRawCoordinates: true,
  vector: (x, y) => ({ x, y }),
}

function motion(action: number, index: number, ids: number[]): AndroidContactEvent {
  return {
    getActionMasked: () => action,
    getActionIndex: () => index,
    getPointerCount: () => ids.length,
    getPointerId: (i) => ids[i],
    getToolType: (i) => (ids[i] === 9 ? 2 : 1),
    getX: (i) => i * 20,
    getY: (i) => i * 40,
    getRawX: (i = 0) => 100 + i * 20,
    getRawY: (i = 0) => 200 + i * 40,
    getEventTime: () => 1234,
    getDownTime: () => 1200,
  }
}

it('retains MotionEvent pointer identities through index changes and excludes lifted pointers', () => {
  const frame = androidContactFrame(motion(6, 0, [9, 4]), space, [{}])!

  expect(frame.contacts.map((contact) => contact.id)).toEqual(['4'])
  expect(frame.changed.id).toBe('9')
  expect(frame.changed.kind).toBe('pen')
  expect(frame.contacts[0].screen).toEqual({ x: 60, y: 120 })
  expect(frame.contacts[0].window).toEqual({ x: 50, y: 100 })
  expect(frame.time).toBe(1234)
  expect(androidContactFrame(motion(2, 0, [4]), space, [])!.contacts[0].id).toBe('4')
  expect(androidContactFrame(motion(3, 0, [4]), space, [])!.contacts).toEqual([])
  expect(androidContactFrame(motion(1, 0, [4]), space, [])!.contacts).toEqual([])
})

it('maps older Android local pointer deltas through the native affine basis before converting density', () => {
  const rotated: AndroidContactSpace = {
    ...space,
    indexedRawCoordinates: false,
    vector: (x, y) => ({ x: -y, y: x }),
  }

  const frame = androidContactFrame(motion(5, 1, [4, 9]), rotated, [])!

  expect(frame.changed.screen).toEqual({ x: 30, y: 110 })
  expect(frame.changed.window).toEqual({ x: 20, y: 90 })
  expect(frame.contacts).toHaveLength(2)
})
