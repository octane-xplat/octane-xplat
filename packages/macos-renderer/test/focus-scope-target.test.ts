import { test } from 'node:test'
import assert from 'node:assert/strict'
import { runSlice, sourceWithoutImports } from './mock-globals.ts'
import { createTabStopSuppression } from '../src/tab-stop.ts'

const source = sourceWithoutImports(new URL('../src/index.ts', import.meta.url))
const view = source.slice(source.indexOf('class AccessibleHostView'), source.indexOf('const masonElementRegistration'))
const retain = source.slice(source.indexOf('appKitBridge.retainFocusTarget ='), source.indexOf('appKitBridge.showAnchoredPopup ='))

test('AppKit scope fallback accepts programmatic focus without a Tab stop or fake action', () => {
	let defaults = 0
	let presses = 0
	const ids = new WeakMap()
	const handlers = new Map()
	const bridge: Record<string, any> = {}
	const tabStops = createTabStopSuppression()
	const { AccessibleHostView } = runSlice(view + '\n' + retain + '\n({ AccessibleHostView })', {
		NSView: class {
			get canBecomeKeyView() { return true }
			keyDown() { defaults++ }
		},
		NativeClass() {},
		interop: { types: { bool: 'bool', id: 'id' } },
		actionIdsByView: ids,
		actionHandlers: handlers,
		invokeAction: (id: number) => handlers.get(id)?.(),
		scopeFocusTargets: new WeakMap(),
		tabStopSuppression: tabStops,
		inputTransparentViews: new WeakSet(),
		stackAccessibilityPropsByView: new WeakMap(),
		appKitBridge: bridge,
	})
	const root = new AccessibleHostView()
	assert.equal(root.acceptsFirstResponder(), false)
	const a = bridge.retainFocusTarget(root)
	const b = bridge.retainFocusTarget(root)
	assert.equal(root.acceptsFirstResponder(), true)
	assert.equal(root.canBecomeKeyView(), false)
	root.keyDown({ keyCode: 36 })
	assert.equal(defaults, 1)
	a()
	a() // A stale disposer cannot release the second owner.
	assert.equal(root.acceptsFirstResponder(), true)
	b()
	assert.equal(root.acceptsFirstResponder(), false)
	ids.set(root, 1)
	handlers.set(1, () => presses++)
	assert.equal(root.acceptsFirstResponder(), true)
	assert.equal(root.canBecomeKeyView(), true)
	root.keyDown({ keyCode: 36 })
	assert.equal(presses, 1)
	const first = tabStops.retain(root)
	const second = tabStops.retain(root)
	assert.equal(root.acceptsFirstResponder(), true)
	assert.equal(root.canBecomeKeyView(), false)
	first()
	first()
	assert.equal(root.canBecomeKeyView(), false)
	second()
	assert.equal(root.canBecomeKeyView(), true)
})
