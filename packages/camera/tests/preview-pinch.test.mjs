import assert from 'node:assert/strict'
import { test } from 'node:test'
import { observePreviewPinch } from '../src/preview-pinch.ts'

function preview(size = { width: 200, height: 100 }) {
  const listeners = new Map()

  return {
    listeners,
    getActualSize: () => size,
    on: (name, handler) => listeners.set(name, handler),
    off: (name, handler) => {
      assert.equal(listeners.get(name), handler)
      listeners.delete(name)
    },
  }
}

test('preview pinch normalizes phases, cumulative scale and bounded focus', () => {
  const host = preview()
  const events = []
  const dispose = observePreviewPinch(host, (event) => events.push(event))

  for (const state of [1, 2, 3, 0]) {
    host.listeners.get('pinch')({
      state,
      scale: 1.5,
      getFocusX: () => 50,
      getFocusY: () => 200,
    })
  }

  assert.deepEqual(
    events,
    ['began', 'moved', 'ended', 'cancelled'].map((state) => ({
      state,
      scale: 1.5,
      focus: { x: 0.25, y: 1 },
    })),
  )

  dispose()
  assert.equal(host.listeners.size, 0)
})

test('preview pinch uses center focus when coordinates or preview bounds are unavailable', () => {
  for (const size of [
    { width: 0, height: 0 },
    { width: 200, height: 100 },
  ]) {
    const host = preview(size)
    const events = []
    const dispose = observePreviewPinch(host, (event) => events.push(event))

    host.listeners.get('pinch')({})
    assert.deepEqual(events, [{ state: 'moved', scale: 1, focus: { x: 0.5, y: 0.5 } }])
    dispose()
  }
})

test('preview pinch does not subscribe without a view or callback', () => {
  const host = preview()

  observePreviewPinch(undefined, () => {})()
  observePreviewPinch(host, undefined)()
  assert.equal(host.listeners.size, 0)
})
