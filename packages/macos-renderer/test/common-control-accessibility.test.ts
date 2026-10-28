import { test } from 'node:test'
import assert from 'node:assert/strict'
import { runSlice, sourceWithoutImports } from './mock-globals.ts'

const source = sourceWithoutImports(new URL('../src/index.ts', import.meta.url))
const host = source.slice(source.indexOf('class AccessibleHostView'), source.indexOf('const masonElementRegistration'))
const apply = source.slice(source.indexOf('function applyAccessibility('), source.indexOf('function applyProps('))
function fixture() {
	const ids = new WeakMap(), handlers = new Map(), notifications: unknown[] = [], events: string[] = []
	const { AccessibleHostView, applyAccessibility } = runSlice(host + '\n' + apply + '\n({AccessibleHostView,applyAccessibility})', {
		NSView: class {}, NativeClass() {}, interop: { types: { bool: 'bool', id: 'id' } },
		NSNumber: { numberWithDouble: (value: number) => value }, actionIdsByView: ids, actionHandlers: handlers,
		accessibilityRoles: new Map(), accessibilityLabels: new Map(), stackAccessibilityPropsByView: new WeakMap(),
		scopeFocusTargets: new WeakMap(), inputTransparentViews: new WeakSet(), invokeAction: (id: number) => handlers.get(id)(),
		NSAccessibilityPostNotification: (view: object, name: string) => notifications.push([view, name]),
	})
	const view = new AccessibleHostView()
	ids.set(view, 1)
	const node = { type: 'masonview', view, actionId: 1, props: {} as any,
		container: { root: { eventScope: (kind: string, callback: () => void) => { events.push(kind); callback() } } as any } }
	return { view, node, handlers, notifications, events, set: (name: string, value: unknown) => applyAccessibility(node, name, value) }
}

test('self-drawn switch/tab/adjustable hosts expose native roles and values', () => {
	const f = fixture()
	f.set('accessibilityRole', 'switch'); f.set('accessibilityState', { checked: true })
	assert.equal(f.view.accessibilityRole(), 'AXCheckBox')
	assert.equal(f.view.accessibilityValue(), 1)
	f.set('accessibilityRole', 'tab'); f.set('accessibilityState', { selected: true })
	assert.equal(f.view.accessibilityRole(), 'AXRadioButton')
	assert.equal(f.view.accessibilityValue(), 1)
	f.set('accessibilityState', { selected: false })
	assert.equal(f.view.accessibilityValue(), 0)
	f.set('accessibilityRole', 'tablist')
	assert.equal(f.view.accessibilityRole(), 'AXTabGroup')
	f.set('accessibilityRole', 'link')
	assert.equal(f.view.accessibilityRole(), 'AXLink')
	f.set('accessibilityRole', 'adjustable'); f.set('accessibilityValue', '0.5')
	f.set('accessibilityMinValue', 0); f.set('accessibilityMaxValue', 1)
	assert.equal(f.view.accessibilityRole(), 'AXSlider')
	assert.equal(f.view.accessibilityValue(), 0.5)
	assert.equal(f.view.accessibilityMinValue(), 0)
	assert.equal(f.view.accessibilityMaxValue(), 1)
})

test('native adjustable selectors dispatch current callbacks in a discrete scope', () => {
	const f = fixture(), changes: number[] = []
	f.set('accessibilityRole', 'adjustable')
	f.set('accessibilityValue', 4)
	f.set('onAccessibilityIncrement', () => { changes.push(5); f.set('accessibilityValue', 5) })
	f.set('onAccessibilityDecrement', () => { changes.push(4); f.set('accessibilityValue', 4) })
	assert.equal(f.view.accessibilityPerformIncrement(), true)
	assert.equal(f.view.accessibilityPerformDecrement(), true)
	assert.deepEqual(changes, [5, 4])
	assert.deepEqual(f.events, ['discrete', 'discrete'])
	assert.deepEqual(f.notifications, [[f.view, 'AXValueChanged'], [f.view, 'AXValueChanged']])
	f.set('accessibilityValue', 4)
	assert.equal(f.notifications.length, 2)
	f.set('onAccessibilityIncrement', undefined)
	assert.equal(f.view.accessibilityPerformIncrement(), false)
	f.set('accessibilityState', { readonly: true })
	assert.equal(f.view.accessibilityPerformDecrement(), false)
	f.set('accessibilityState', { disabled: true })
	assert.equal(f.view.accessibilityPerformDecrement(), false)
	f.set('accessibilityState', {})
	f.node.props.disabled = true
	assert.equal(f.view.accessibilityPerformDecrement(), false)
	f.node.props.disabled = false
	f.node.container.root = null
	assert.equal(f.view.accessibilityPerformDecrement(), false)
	assert.deepEqual(changes, [5, 4])
})

test('ignored and read-only hosts reject press/adjustment, and value notifications track selection', () => {
	const f = fixture()
	let presses = 0
	f.handlers.set(1, () => presses++)
	f.set('accessibilityRole', 'tab'); f.set('accessibilityState', { selected: false })
	assert.equal(f.notifications.length, 0)
	f.set('accessibilityState', { selected: true })
	assert.equal(f.notifications.length, 1)
	assert.equal(f.view.accessibilityPerformPress(), true)
	f.set('accessible', false)
	assert.equal(f.view.accessibilityIsIgnored(), true)
	assert.equal(f.view.accessibilityPerformPress(), false)
	f.set('accessible', true); f.set('accessibilityState', { readonly: true })
	assert.equal(f.view.accessibilityPerformPress(), false)
	f.set('accessibilityState', {}); f.set('accessibilityRole', 'none')
	assert.equal(f.view.accessibilityIsIgnored(), true)
	assert.equal(presses, 1)
})
