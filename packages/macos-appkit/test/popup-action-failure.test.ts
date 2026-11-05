import assert from 'node:assert/strict'
import { after, test } from 'node:test'
import { createActionStore } from '../src/action-store.ts'
import { mockNativeBoundary } from './native-boundary.ts'

const hooks = mockNativeBoundary()
const { createPickerElements } = await import('../src/picker-elements.ts')
const { NSPopUpButton } = await import('@octane-xplat/platform/macos')

test('popup allocation retires its action if the native tag write fails before adoption', (context) => {
  const failure = Error('native tag write')
  const view = {
    target: null,
    action: null,
    translatesAutoresizingMaskIntoConstraints: true,
    set tag(_value: number) {
      throw failure
    },
  }
  context.mock.method(NSPopUpButton, 'alloc', () => ({ initWithFramePullsDown: () => view }))
  const store = createActionStore()
  const pickers = createPickerElements({
    actions: {
      allocate: store.allocate,
      buttonActionTarget: {},
      acquireAction() {
        throw Error('not used')
      },
      adoptAction() {
        throw Error('not used')
      },
      setControlAction() {},
    },
    layout: { queueLayoutReconcile() {} },
    cssCascade: { setNodeInlineStyle() {}, applyClassName() {} },
    accessibility: { applyAccessibility() {} },
    tree: { detach() {} },
  })
  assert.throws(() => pickers.makePopUpControl(), error => error === failure)
  assert.equal(store.idForView(view), undefined)
})

// This test process owns only its native-boundary hook.
after(() => hooks.deregister())
