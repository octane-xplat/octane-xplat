import { expect, it } from 'vitest'
import { createInteractionBinding } from './host-binding'
import { createPanController } from './controller'

it('updates semantic handlers without replacing raw host ownership during ordinary commits', () => {
  const calls: string[] = [],
    host = {},
    pan = createPanController({ axis: 'x' })

  let callback = () => calls.push('old')
  const binding = createInteractionBinding({
    gestures() {
      calls.push('gesture')
      return () => {
        calls.push('off-gesture')
      }
    },
    scope() {
      return () => {}
    },
    viewport() {
      calls.push('viewport')
      return () => {
        calls.push('off-viewport')
      }
    },
    press(_host, _options) {
      calls.push('press')
      return {
        commit(next) {
          callback = () => next.onPressIn?.()
        },
        dispose() {
          calls.push('off-press')
        },
      }
    },
  })

  binding.commit(host, { gestures: pan.handle, viewport: true, press: { slop: 8 } })
  binding.commit(host, {
    gestures: pan.handle,
    viewport: true,
    press: {
      slop: 8,
      onPressIn: () => {
        calls.push('new')
      },
    },
  })

  callback()
  expect(calls).toEqual(['gesture', 'press', 'viewport', 'new'])
  binding.detach()
  binding.detach()
  expect(calls.slice(4)).toEqual(['off-press', 'off-gesture', 'off-viewport'])
  pan.dispose()
})

it('cleans old gesture ownership when press-out reenters with an empty host', () => {
  let gestures = 0,
    viewports = 0

  const pan = createPanController({ axis: 'x' }),
    host = {}

  const binding = createInteractionBinding({
    gestures() {
      gestures++
      return () => {
        gestures--
      }
    },
    scope() {
      return () => {}
    },
    viewport() {
      viewports++
      return () => {
        viewports--
      }
    },
    press() {
      return {
        commit() {},
        dispose() {
          binding.commit(null, {})
        },
      }
    },
  })

  binding.commit(host, { gestures: pan.handle, viewport: true, press: { slop: 8 } })
  binding.detach()
  expect(gestures).toBe(0)
  expect(viewports).toBe(0)
  pan.dispose()
})
