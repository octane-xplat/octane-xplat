import assert from 'node:assert/strict'
import { test, mock } from 'node:test'
import { mockNativeBoundary } from './native-boundary.ts'
const hooks = mockNativeBoundary()
const { makePagerView, disposePagerView } = await import('../src/pager.ts')
const { NSScrollView, NSView, NSNotificationCenter } = await import('@octane-xplat/platform/macos')
hooks.deregister()

test('pager retires a token acquired after reentrant disposal and held delivery schedules nothing', () => {
  const node: any = { view: null }
  const released: object[] = []
  const token = {}
  let held: () => void
  Object.assign(NSView.prototype, {
    initWithFrame() {
      return this
    },
  })
  Object.assign(NSScrollView.prototype, {
    initWithFrame() {
      this.contentView = {}
      return this
    },
  })
  Object.assign(NSNotificationCenter.defaultCenter, {
    addObserverForNameObjectQueueUsingBlock(_name, _view, _queue, callback) {
      held = callback
      assert.ok(node.view, 'native host must be published before fallible observation')
      disposePagerView(node.view)
      return token
    },
    removeObserver(value) {
      released.push(value)
    },
  })
  const view = makePagerView(node)
  assert.equal(view.documentView, null)
  assert.deepEqual(released, [token])
  const schedule = mock.method(globalThis, 'setTimeout', () => {
    throw Error('retired pager scheduled work')
  })
  try {
    held!()
    disposePagerView(view)
    assert.equal(schedule.mock.callCount(), 0)
    assert.deepEqual(released, [token])
  } finally {
    schedule.mock.restore()
  }
})
