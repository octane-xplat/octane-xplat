import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createActionStore } from '../src/action-store.ts'
import { createAccessibilityState } from '../src/accessibility-state.ts'
import { mockNativeBoundary } from './native-boundary.ts'

const hooks = mockNativeBoundary()
const { createActions } = await import('../src/actions.ts')
const { createAccessibleHost } = await import('../src/accessible-host.ts')
const { createAccessibility } = await import('../src/accessibility.ts')

hooks.deregister()

// The bridged class resolves NSAccessibility property accessors against
// native storage, so semantic state has to be pushed through the
// setAccessibility* setters — ObjC dispatch (KVC, the AX server) never sees
// the JS getters. These tests pin that push contract.

function fixture() {
  const store = createActionStore(),
    state = createAccessibilityState()

  const calls: [string, unknown][] = []
  const actions = createActions({
    store,
    registry: { cssNodesByView: new WeakMap() },
    textElements: {
      primaryClickBoundary: () => () => false,
      textLinkCharacterIndex: () => 1,
    },
    cssPseudoState: { syncPseudoState() {} },
    inputElements: {
      textNodesByView: new WeakMap(),
      notifySearchTextChange() {},
      syncTextViewPlaceholder() {},
      fitTextView() {},
      dispatchTextEvent() {},
    },
    syncViewAccessibility(view: object) {
      host.syncNativeAccessibility(view)
    },
  })

  const host = createAccessibleHost({
    actions,
    state,
    subscriptions: { fileDropRegistry: {} as any },
  })

  const view = new host.AccessibleHostView() as any
  for (const name of [
    'setAccessibilityElement',
    'setAccessibilityRole',
    'setAccessibilityLabel',
    'setAccessibilityTitle',
    'setAccessibilityValue',
    'setAccessibilityValueDescription',
    'setAccessibilityMinValue',
    'setAccessibilityMaxValue',
    'setAccessibilityHelp',
    'setAccessibilityEnabled',
    'setAccessibilitySelected',
    'setAccessibilityExpanded',
  ]) {
    view[name] = (value: unknown) => calls.push([name, value])
  }

  const accessibility = createAccessibility({ accessibleHost: host, state })

  const node = (type = 'masonview'): any => ({
    type,
    view,
    props: {},
    lifecycle: 'live',
    children: [],
    container: {
      root: {
        eventScope(_kind: string, callback: () => void) {
          return callback()
        },
      },
    },
  })

  const pushed = (name: string) =>
    calls.filter(([key]) => key === name).map(([, value]) => value)
  const last = (name: string) => pushed(name).at(-1)

  return { store, state, host, view, actions, accessibility, node, calls, pushed, last }
}

test('applyAccessibility pushes semantics through the native setAccessibility* setters', () => {
  const f = fixture()
  const n = f.node()

  f.accessibility.applyAccessibility(n, 'accessibilityRole', 'button')
  f.accessibility.applyAccessibility(n, 'accessibilityLabel', 'Submit')

  assert.equal(f.last('setAccessibilityRole'), 'AXButton')
  assert.equal(f.last('setAccessibilityLabel'), 'Submit')
  assert.equal(f.last('setAccessibilityElement'), true)
})

test('applyAccessibility pushes accessible=false as a non-element', () => {
  const f = fixture()
  const n = f.node()

  f.accessibility.applyAccessibility(n, 'accessibilityRole', 'button')
  f.accessibility.applyAccessibility(n, 'accessible', false)

  assert.equal(f.last('setAccessibilityElement'), false)
})

test('a handler attach re-pushes element-ness through the actions dep', () => {
  const f = fixture()
  const n = f.node()

  f.accessibility.applyAccessibility(n, 'accessibilityRole', 'button')
  assert.deepEqual(f.pushed('setAccessibilityElement'), [true])

  f.actions.acquireAction(n, f.view)
  f.actions.setNodeHandler(n, () => {})

  assert.deepEqual(f.pushed('setAccessibilityElement'), [true, true, true])
})

test('a bare interactive view becomes an element once a handler lands', () => {
  const f = fixture()
  const n = f.node()

  // No accessibility props at all: ignored while it has neither state nor a
  // handler, an element once the action's handler attaches.
  f.actions.acquireAction(n, f.view)
  assert.deepEqual(f.pushed('setAccessibilityElement'), [false])

  f.actions.setNodeHandler(n, () => {})
  assert.deepEqual(f.pushed('setAccessibilityElement'), [false, true])
})
