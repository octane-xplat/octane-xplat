import { expect, it } from 'vitest'
import { attachNativeGesture, type NativeGestureSurface } from './input.native'
import { createPanController } from './controller'
import type { InputFrame } from './owner'

function fixture(root: object, host: object) {
  let send: ((frame: InputFrame, key: string) => void) | null = null
  let observed = 0,
    unobserved = 0,
    reserved = 0,
    restored = 0

  const surface: NativeGestureSurface = {
    root,
    host,
    space: {
      target: { id: 'native-test' },
      local: (point) => point,
      freeze: () => (point) => point,
    },
    scheduler: {
      frame: () => () => {},
      error(error) {
        throw error
      },
    },
    observe(listener) {
      observed++
      send = listener
      return () => {
        unobserved++
        send = null
      }
    },
    reserve() {
      reserved++
      return () => {
        restored++
      }
    },
  }

  return {
    surface,
    send(frame: InputFrame) {
      send?.(frame, `${frame.type}:${frame.time}`)
    },
    counts() {
      return { observed, unobserved, reserved, restored }
    },
  }
}

it('arbitrates once when native input bubbles through multiple registered surfaces', () => {
  const root = {},
    child = {},
    parent = {}

  const a = fixture(root, child),
    b = fixture(root, parent)

  const calls: string[] = []
  const inner = createPanController({
    axis: 'x',
    onStart() {
      calls.push('inner')
    },
    onUpdate() {
      calls.push('move')
    },
    onCancel() {
      calls.push('cancel')
    },
  })

  const outer = createPanController({
    axis: 'x',
    onStart() {
      calls.push('outer')
    },
  })

  const offA = attachNativeGesture(a.surface, inner.handle),
    offB = attachNativeGesture(b.surface, outer.handle)

  const dispatch = (type: InputFrame['type'], time: number, x: number) => {
    const contact = { id: '1', kind: 'touch' as const, window: { x, y: 0 }, screen: null }
    const frame: InputFrame = {
      type,
      time,
      changed: contact,
      contacts: [contact],
      hitPath: [child, parent],
    }

    a.send(frame)
    b.send(frame)
  }

  try {
    dispatch('down', 0, 0)
    dispatch('move', 20, 20)
    expect(calls).toEqual(['inner', 'move'])
    expect(() => attachNativeGesture(a.surface, inner.handle)).toThrow('already attached')
    dispatch('move', 30, 30)
    expect(calls).toEqual(['inner', 'move', 'move'])
    offA()
    offA()
    expect(calls.at(-1)).toBe('cancel')
    expect(a.counts()).toEqual({ observed: 1, unobserved: 1, reserved: 1, restored: 1 })
  } finally {
    offA()
    offB()
    inner.dispose()
    outer.dispose()
  }
})

it('rolls back registration when the native reservation fails', () => {
  const a = fixture({}, {}),
    pan = createPanController({ axis: 'x' })

  const surface: NativeGestureSurface = {
    ...a.surface,
    reserve() {
      throw new Error('unsupported reservation')
    },
  }

  expect(() => attachNativeGesture(surface, pan.handle)).toThrow('unsupported reservation')

  // The failed attempt did not leave the handle owned or leak a root registration.
  const detach = attachNativeGesture(a.surface, pan.handle)

  detach()
  pan.dispose()
  expect(a.counts()).toEqual({ observed: 2, unobserved: 2, reserved: 1, restored: 1 })
})
