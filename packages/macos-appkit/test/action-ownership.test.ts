import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createActionStore } from '../src/action-store.ts'
import { createAccessibilityState } from '../src/accessibility-state.ts'
import { mockNativeBoundary } from './native-boundary.ts'
const hooks = mockNativeBoundary()
const { createActions } = await import('../src/actions.ts')
const { createAccessibleHost } = await import('../src/accessible-host.ts')
const { createAccessibility } = await import('../src/accessibility.ts')
const { createTextElements } = await import('../src/text-elements.ts')
hooks.deregister()

function fixture() {
  const store = createActionStore(), state = createAccessibilityState()
  const registry = { cssNodesByView: new WeakMap() }
  const textNodesByView = new WeakMap()
  const events: unknown[] = [], scopes: string[] = []
  const actions = createActions({ store, registry,
    textElements: { primaryClickBoundary: () => () => false, textLinkCharacterIndex: () => 1 },
    cssPseudoState: { syncPseudoState() {} },
    inputElements: { textNodesByView, notifySearchTextChange() {}, syncTextViewPlaceholder() {}, fitTextView() {}, dispatchTextEvent(node, name) {
      if (node?.lifecycle === 'live') { node.props[name]?.() }
    } },
  })
  const host = createAccessibleHost({ actions, state, subscriptions: { fileDropRegistry: {} as any } })
  const accessibility = createAccessibility({ accessibleHost: host, state })
  const node = (type = 'masonview', view: any = new host.AccessibleHostView()): any => ({
    type, view, props: {}, lifecycle: 'live', children: [],
    container: { root: { eventScope(kind, callback) { scopes.push(kind); return callback() } } },
  })
  return { actions, host, accessibility, state, registry, store, textNodesByView, node, events, scopes }
}

test('production action owner keeps tag replacement, native disable and retirement guards at the event boundary', () => {
  const f = fixture(), node = f.node('button', { enabled: true, isEnabled() { return this.enabled } })
  f.actions.acquireAction(node, node.view)
  const tag = node.actionId, target = f.actions.buttonActionTarget
  f.actions.setControlAction(node, value => f.events.push(value), () => 'first')
  target.controlChanged({ ...node.view, tag } as any)
  f.actions.setControlAction(node, value => f.events.push(value), () => 'current')
  target.controlChanged({ tag } as any)
  for (const patch of [{ disabled: true }, { enabled: false }, { isEnabled: false }, { editable: false }, { accessibilityState: { readonly: true } }]) {
    node.props = patch
    target.controlChanged({ tag } as any)
  }
  node.props = {}; node.view.enabled = false
  target.controlChanged({ tag } as any)
  node.view.enabled = true
  const held = () => target.controlChanged({ tag } as any)
  node.lifecycle = 'disposing'; held()
  f.actions.disposeActions(node); f.actions.disposeActions(node)
  node.lifecycle = 'live'; held()
  assert.deepEqual(f.events, ['first', 'current'])
  assert.deepEqual(f.scopes, ['discrete', 'discrete'])
  assert.equal(f.store.idForView(node.view), undefined)
})

test('production text delegate separates editing/submission and leaves IME confirmation to native input', () => {
  const f = fixture(), editor = { hasMarkedText: true }
  const node = f.node('textfield', { currentEditor: () => editor })
  f.textNodesByView.set(node.view, node)
  f.actions.acquireAction(node, node.view)
  f.actions.setControlAction(node, () => f.events.push('edit'), () => '')
  f.actions.setTextSubmitAction(node, () => f.events.push('submit'))
  const target = f.actions.buttonActionTarget
  target.controlTextDidChange({ object: node.view } as any)
  target.textFieldSubmitted(node.view)
  editor.hasMarkedText = false
  target.textFieldSubmitted(node.view)
  node.props.editable = false
  target.textFieldSubmitted(node.view)
  target.controlTextDidChange({ object: node.view } as any)
  const held = node.submitHandler
  f.actions.disposeActions(node)
  node.lifecycle = 'disposing'; held()
  assert.deepEqual(f.events, ['edit', 'submit'])
})

test('AX-only hosts own semantic leases without click IDs and scoped adjustments stop on replacement/retirement', () => {
  const f = fixture(), node = f.node(), view = node.view
  node.props = { onAccessibilityIncrement() {} }
  f.accessibility.applyAccessibility(node, 'accessibilityRole', 'adjustable')
  f.accessibility.applyAccessibility(node, 'accessibilityLabel', 'Volume')
  f.accessibility.applyAccessibility(node, 'onAccessibilityIncrement', () => f.events.push('increment'))
  assert.equal(f.store.idForView(view), undefined)
  assert.equal(view.accessibilityIsIgnored(), false)
  assert.equal(view.acceptsFirstResponder(), false)
  assert.equal(view.accessibilityPerformPress(), false)
  assert.equal(view.accessibilityRole(), 'AXSlider')
  assert.equal(view.accessibilityPerformIncrement(), true)
  const held = f.state.get(view)!.onAccessibilityIncrement!
  f.accessibility.applyAccessibility(node, 'accessibilityState', { readonly: true })
  assert.equal(view.accessibilityPerformIncrement(), false)
  f.accessibility.applyAccessibility(node, 'accessibilityState', { disabled: true })
  assert.equal(view.accessibilityPerformIncrement(), false)
  const replacement = f.node('masonview', view)
  f.accessibility.applyAccessibility(replacement, 'accessibilityLabel', 'New owner')
  held()
  f.accessibility.disposeAccessibility(node)
  assert.equal(view.accessibilityLabel(), 'New owner')
  f.accessibility.disposeAccessibility(replacement)
  assert.equal(view.accessibilityIsIgnored(), true)
  assert.deepEqual(f.events, ['increment'])
})

test('AX press queries the current action and observes readonly, hidden and disabled semantic state', () => {
  const f = fixture(), node = f.node(), view = node.view
  f.accessibility.applyAccessibility(node, 'accessibilityRole', 'button')
  f.actions.acquireAction(node, view)
  f.actions.setNodeHandler(node, () => f.events.push('press'))
  assert.equal(view.acceptsFirstResponder(), true)
  assert.equal(view.accessibilityPerformPress(), true)
  for (const state of [{ readonly: true }, { disabled: true }]) {
    f.accessibility.applyAccessibility(node, 'accessibilityState', state)
    assert.equal(view.accessibilityPerformPress(), false)
  }
  f.accessibility.applyAccessibility(node, 'accessibilityState', {})
  view.hiddenOrHasHiddenAncestor = true
  assert.equal(view.accessibilityPerformPress(), false)
  view.hiddenOrHasHiddenAncestor = false
  f.actions.setNodeHandler(node, undefined)
  assert.equal(view.accessibilityPerformPress(), false)
  assert.deepEqual(f.events, ['press'])
})

test('production pan delegate preserves local coordinates, velocity, swipe and stale callback suppression', () => {
  const f = fixture(), node = f.node('masonview', { addGestureRecognizer() {}, removeGestureRecognizer() {}, flipped: false,
    bounds: { origin: { x: 2, y: 3 }, size: { width: 100, height: 90 } } })
  node.props = { onPan: event => f.events.push(event), onSwipe: event => f.events.push(event) }
  f.actions.setPanAction(node, node.props.onPan)
  f.actions.buttonActionTarget.viewPanned({ view: node.view, state: 2, translationInView: () => ({ x: 4, y: 5 }), velocityInView: () => ({ x: 6, y: 7 }), locationInView: () => ({ x: 12, y: 13 }) } as any)
  assert.deepEqual(f.events[0], { x: 10, y: 80, deltaX: 4, deltaY: -5, velocityX: 6, velocityY: -7, state: 2, view: node.view })
  f.actions.disposeActions(node)
  assert.equal(f.actions.dispatchPan(node.view, {} as any), false)
})

