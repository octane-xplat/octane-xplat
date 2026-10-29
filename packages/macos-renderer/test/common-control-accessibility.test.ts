import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createDisabledFocusTargets } from '../src/disabled-focus.ts'
import { createTabStopSuppression } from '../src/tab-stop.ts'
import { runSlice, sourceWithoutImports } from './mock-globals.ts'

const source = sourceWithoutImports(new URL('../src/index.ts', import.meta.url))
const host = source.slice(source.indexOf('class AccessibleHostView'), source.indexOf('const masonElementRegistration'))
const apply = source.slice(source.indexOf('function applyAccessibility('), source.indexOf('function applyProps('))
function fixture() {
	const ids = new WeakMap(), handlers = new Map(), notifications: unknown[] = [], events: string[] = [], forwarded: unknown[] = []
	const disabledFocus = createDisabledFocusTargets(), tabStops = createTabStopSuppression()
	const scopeFocus = new WeakMap()
	const { AccessibleHostView, applyAccessibility } = runSlice(host + '\n' + apply + '\n({AccessibleHostView,applyAccessibility})', {
		NSView: class { get accessibilityTitle() { return 'native title' } get accessibilityOrientation() { return 2 } isAccessibilityEnabled() { return true } keyDown(event: unknown) { forwarded.push(event) } }, NativeClass() {}, interop: { types: { bool: 'bool', id: 'id' } },
		NSNumber: { numberWithDouble: (value: number) => value }, actionIdsByView: ids, actionHandlers: handlers,
		accessibilityRoles: new Map(), accessibilityLabels: new Map(), stackAccessibilityPropsByView: new WeakMap(),
		scopeFocusTargets: scopeFocus, disabledFocusTargets: disabledFocus, tabStopSuppression: tabStops, inputTransparentViews: new WeakSet(), invokeAction: (id: number) => handlers.get(id)(),
		NSAccessibilityPostNotification: (view: object, name: string) => notifications.push([view, name]),
	})
	const view = new AccessibleHostView()
	ids.set(view, 1)
	const node = { type: 'masonview', view, actionId: 1, props: {} as any,
		container: { root: { eventScope: (kind: string, callback: () => void) => { events.push(kind); callback() } } as any } }
	return { applyAccessibility, view, exposed: AccessibleHostView.ObjCExposedMethods, node, handlers, notifications, events, forwarded, disabledFocus, tabStops, scopeFocus, set: (name: string, value: unknown) => applyAccessibility(node, name, value) }
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


test('self-drawn activation preserves modified shortcuts and blocked native key handling', () => {
	const f = fixture()
	let presses = 0
	f.handlers.set(1, () => presses++)
	f.set('accessibilityRole', 'button')
	f.view.keyDown({ keyCode: 36 })
	f.view.keyDown({ keyCode: 49 })
	assert.equal(presses, 2)
	for (const modifierFlags of [1 << 18, 1 << 19, 1 << 20]) {
		for (const keyCode of [36, 49]) f.view.keyDown({ keyCode, modifierFlags })
	}
	assert.equal(presses, 2)
	assert.equal(f.forwarded.length, 6)
	f.view.keyDown({ keyCode: 36, modifierFlags: 1 << 17 }) // Shift alone retains activation.
	assert.equal(presses, 3)
	f.set('accessibilityState', { readonly: true })
	f.view.keyDown({ keyCode: 49 })
	f.set('accessibilityState', { disabled: true })
	f.view.keyDown({ keyCode: 36 })
	assert.equal(presses, 3)
	assert.equal(f.forwarded.length, 8)
	f.set('accessibilityState', {})
	f.handlers.delete(1)
	f.view.keyDown({ keyCode: 36 })
	assert.equal(f.forwarded.length, 9)
})


test('pressed buttons use native checked values and notify only changed pressed states', () => {
	const f = fixture()
	f.set('accessibilityRole', 'button')
	assert.equal(f.view.accessibilityRole(), 'AXButton')
	f.set('accessibilityState', { pressed: false })
	assert.equal(f.view.accessibilityRole(), 'AXCheckBox')
	assert.equal(f.view.accessibilityValue(), 0)
	assert.equal(f.notifications.length, 0)
	f.set('accessibilityState', { pressed: true })
	assert.equal(f.view.accessibilityValue(), 1)
	assert.equal(f.notifications.length, 1)
	f.set('accessibilityState', { pressed: true })
	assert.equal(f.notifications.length, 1)
	f.set('accessibilityState', {})
	assert.equal(f.view.accessibilityRole(), 'AXButton')
	assert.equal(f.view.accessibilityValue(), '')
	assert.equal(f.notifications.length, 2)
})


test('disabled focus claims allow focus without actions and respect suppression, hiding and other owners', () => {
	const f = fixture()
	f.set('accessibilityRole', 'checkbox')
	f.set('accessibilityState', { checked: true, disabled: true })
	assert.equal(f.view.acceptsFirstResponder(), false)
	assert.equal(f.view.canBecomeKeyView(), false)
	const first = f.disabledFocus.retain(f.view), second = f.disabledFocus.retain(f.view)
	assert.equal(f.view.acceptsFirstResponder(), true)
	assert.equal(f.view.canBecomeKeyView(), true)
	assert.equal(f.view.isAccessibilityEnabled(), false)
	assert.equal(f.view.accessibilityPerformPress(), false)
	f.view.keyDown({ keyCode: 49 })
	assert.equal(f.forwarded.length, 1)
	assert.equal(f.handlers.size, 0)
	const unsuppress = f.tabStops.retain(f.view)
	assert.equal(f.view.canBecomeKeyView(), false)
	unsuppress()
	f.view.hiddenOrHasHiddenAncestor = true
	assert.equal(f.view.canBecomeKeyView(), false)
	f.view.hiddenOrHasHiddenAncestor = false
	f.scopeFocus.set(f.view, 1)
	assert.equal(f.view.canBecomeKeyView(), false)
	f.scopeFocus.delete(f.view)
	first(); first()
	assert.equal(f.view.canBecomeKeyView(), true)
	second()
	assert.equal(f.view.canBecomeKeyView(), false)
	assert.equal(f.view.acceptsFirstResponder(), false)
})


test('AppKit enabled protocol getter overrides the native default and follows retained host state', () => {
	const f = fixture()
	assert.equal(f.exposed.isAccessibilityEnabled.returns, 'bool')
	assert.equal(Object.hasOwn(f.exposed, 'accessibilityIsEnabled'), false)
	assert.equal(f.view.isAccessibilityEnabled(), true)
	f.set('accessibilityRole', 'menuitem')
	f.set('accessibilityState', { disabled: true })
	assert.equal(f.view.isAccessibilityEnabled(), false)
	f.set('accessibilityState', { disabled: false })
	assert.equal(f.view.isAccessibilityEnabled(), true)
	f.set('accessibilityState', undefined)
	assert.equal(f.view.isAccessibilityEnabled(), true)
})


test('menu surfaces and row kinds expose native roles and current titles without changing other native titles', () => {
	const f = fixture()
	assert.equal(f.exposed.accessibilityTitle.returns, 'id')
	f.set('accessibilityRole', 'menu'); f.set('accessibilityLabel', 'Actions')
	assert.equal(f.view.accessibilityRole(), 'AXMenu')
	for (const role of ['menuitem', 'menuitemcheckbox', 'menuitemradio']) {
		f.set('accessibilityRole', role)
		assert.equal(f.view.accessibilityRole(), 'AXMenuItem')
		assert.equal(f.view.accessibilityTitle(), 'Actions')
		f.set('accessibilityLabel', 'Updated')
		assert.equal(f.view.accessibilityTitle(), 'Updated')
		f.set('accessibilityLabel', 'Actions')
	}
	f.set('accessibilityLabel', undefined); assert.equal(f.view.accessibilityTitle(), '')
	f.set('accessibilityRole', 'button'); assert.equal(f.view.accessibilityRole(), 'AXButton')
	assert.equal(f.view.accessibilityTitle(), 'native title')
	f.set('accessibilityRole', 'unknown'); assert.equal(f.view.accessibilityRole(), 'AXGroup')
})

test('native selected/expanded getters report parent-owned state without conflating checked state or activation', () => {
	const f = fixture(); let calls = 0
	f.handlers.set(1, () => calls++)
	for (const name of ['isAccessibilitySelected', 'isAccessibilityExpanded']) assert.equal(f.exposed[name].returns, 'bool')
	f.set('accessibilityRole', 'menuitem')
	assert.equal(f.view.isAccessibilitySelected(), false); assert.equal(f.view.isAccessibilityExpanded(), false)
	f.set('accessibilityState', { selected: true, expanded: true })
	assert.equal(f.view.isAccessibilitySelected(), true); assert.equal(f.view.isAccessibilityExpanded(), true)
	f.view.accessibilityPerformPress()
	assert.equal(calls, 1); assert.equal(f.view.isAccessibilitySelected(), true); assert.equal(f.view.isAccessibilityExpanded(), true)
	f.set('accessibilityState', { selected: false, expanded: false, checked: true })
	assert.equal(f.view.isAccessibilitySelected(), false); assert.equal(f.view.isAccessibilityExpanded(), false)
	f.set('accessibilityState', undefined)
	assert.equal(f.view.isAccessibilitySelected(), false); assert.equal(f.view.isAccessibilityExpanded(), false)
})


test('listbox and option hosts expose native list/row roles and current selected state', () => {
	const f = fixture()
	f.set('accessibilityRole', 'listbox'); assert.equal(f.view.accessibilityRole(), 'AXList')
	f.set('accessibilityRole', 'option'); assert.equal(f.view.accessibilityRole(), 'AXRow')
	f.set('accessibilityState', { selected: true }); assert.equal(f.view.isAccessibilitySelected(), true)
	f.set('accessibilityState', { selected: false }); assert.equal(f.view.isAccessibilitySelected(), false)
})

test('editable combobox role restores the specialized native baseline when dropped or unsupported', () => {
	const f = fixture(), view = { accessibilityRole: 'AXTextField' }, node: any = { type: 'textfield', view }
	f.applyAccessibility(node, 'accessibilityRole', 'combobox'); assert.equal(view.accessibilityRole, 'AXComboBox')
	f.applyAccessibility(node, 'accessibilityRole', undefined); assert.equal(view.accessibilityRole, 'AXTextField')
	f.applyAccessibility(node, 'accessibilityRole', 'combobox'); f.applyAccessibility(node, 'accessibilityRole', 'unknown'); assert.equal(view.accessibilityRole, 'AXTextField')
})

test('native expanded state restores its baseline without changing multiline enabled-state mirroring', () => {
	const f = fixture(), enabled: boolean[] = [], view = { accessibilityExpanded: true, setAccessibilityEnabled: (value: boolean) => enabled.push(value) }, node: any = { type: 'textview', view }
	f.applyAccessibility(node, 'accessibilityState', { expanded: false, disabled: true }); assert.equal(view.accessibilityExpanded, false)
	f.applyAccessibility(node, 'accessibilityState', { expanded: true }); assert.equal(view.accessibilityExpanded, true)
	f.applyAccessibility(node, 'accessibilityState', { expanded: false }); f.applyAccessibility(node, 'accessibilityState', undefined); assert.equal(view.accessibilityExpanded, true)
	assert.deepEqual(enabled, [false, true, true, true])
})

test('replacement native inputs release old role/expanded overrides and own a fresh baseline', () => {
	const f = fixture(), previous = { accessibilityRole: 'AXTextField', accessibilityExpanded: false }, node: any = { type: 'textfield', view: previous }
	f.applyAccessibility(node, 'accessibilityRole', 'combobox'); f.applyAccessibility(node, 'accessibilityState', { expanded: true })
	const next = { accessibilityRole: 'AXSearchField', accessibilityExpanded: true }; node.view = next
	f.applyAccessibility(node, 'accessibilityRole', 'combobox'); f.applyAccessibility(node, 'accessibilityState', { expanded: false })
	assert.deepEqual(previous, { accessibilityRole: 'AXTextField', accessibilityExpanded: false })
	f.applyAccessibility(node, 'accessibilityRole', null); f.applyAccessibility(node, 'accessibilityState', {})
	assert.deepEqual(next, { accessibilityRole: 'AXSearchField', accessibilityExpanded: true })
})


test('column resize separators expose native splitter role, vertical orientation, numeric range and current adjustment callbacks', () => {
	const f = fixture(), values: number[] = []
	f.set('accessibilityRole', 'separator'); f.set('accessibilityValue', '240')
	f.set('accessibilityMinValue', 80); f.set('accessibilityMaxValue', 500)
	f.set('accessibilityValueDescription', '240 points wide')
	f.set('onAccessibilityIncrement', () => { values.push(250); f.set('accessibilityValue', '250') })
	assert.equal(f.view.accessibilityRole(), 'AXSplitter')
	assert.equal(f.view.accessibilityOrientation(), 1)
	assert.equal(f.view.accessibilityValue(), 240)
	assert.equal(f.view.accessibilityMinValue(), 80); assert.equal(f.view.accessibilityMaxValue(), 500)
	assert.equal(f.view.accessibilityValueDescription(), '240 points wide')
	assert.equal(f.view.accessibilityPerformIncrement(), true); assert.deepEqual(values, [250])
	f.set('accessibilityRole', 'button'); assert.equal(f.view.accessibilityOrientation(), 2)
})
