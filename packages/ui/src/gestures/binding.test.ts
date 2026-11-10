import { expect, it } from 'vitest'
import { createGestureBinding } from './binding'
import { createPanController, createPinchController } from './controller'
import { compete, simultaneous } from './composition'

it('retains host ownership across freshly described equivalent composition trees', () => {
  const pan = createPanController({ axis: 'x' }),
    pinch = createPinchController({})

  const calls: string[] = []
  const binding = createGestureBinding<object>({
    gestures() {
      calls.push('attach')
      return () => {
        calls.push('detach')
      }
    },
    scope() {
      throw new Error('Not used')
    },
  })

  const host = {}

  try {
    binding.commit(host, compete(pan.handle, pinch.handle))
    binding.commit(host, compete(pan.handle, pinch.handle))
    expect(calls).toEqual(['attach'])
    binding.commit(host, simultaneous(pan.handle, pinch.handle))
    expect(calls).toEqual(['attach', 'detach', 'attach'])
    binding.commit({}, simultaneous(pan.handle, pinch.handle))
    expect(calls).toEqual(['attach', 'detach', 'attach', 'detach', 'attach'])
    binding.detach()
    binding.detach()
    expect(calls.filter((value) => value === 'detach')).toHaveLength(3)
  } finally {
    binding.detach()
    pan.dispose()
    pinch.dispose()
  }
})

it('leaves a failed attachment detached and permits a later committed retry', () => {
  const pan = createPanController({ axis: 'both' })
  let attempt = 0,
    release = 0

  const binding = createGestureBinding<object>({
    gestures() {
      if (++attempt === 1) {
        throw new Error('unsupported host')
      }

      return () => {
        release++
      }
    },
    scope() {
      throw new Error('Not used')
    },
  })

  const host = {}

  expect(() => binding.commit(host, pan.handle)).toThrow('unsupported host')
  binding.commit(host, pan.handle)
  binding.detach()
  expect(release).toBe(1)
  pan.dispose()
})

it('keeps a reentrant registration when an older gesture cleanup commits another description', () => {
  const first = createPanController({ axis: 'x' }),
    second = createPanController({ axis: 'y' }),
    stale = createPanController({ axis: 'both' })

  const host = {},
    calls: string[] = []

  const binding = createGestureBinding({
    gestures(_host, input) {
      calls.push(input === first.handle ? 'first' : input === second.handle ? 'second' : 'stale')
      return () => {
        if (input === first.handle) {
          binding.commit(host, second.handle)
        }
      }
    },
    scope() {
      return () => {}
    },
  })

  binding.commit(host, first.handle)
  binding.commit(host, stale.handle)
  expect(calls).toEqual(['first', 'second'])
  binding.detach()
  first.dispose()
  second.dispose()
  stale.dispose()
})
