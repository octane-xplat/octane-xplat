import { readFileSync } from 'node:fs'
import { stripTypeScriptTypes } from 'node:module'
import { runInNewContext } from 'node:vm'
import { test } from 'node:test'
import assert from 'node:assert/strict'

const source = stripTypeScriptTypes(
	readFileSync(new URL('../src/index.ts', import.meta.url), 'utf8'),
)

const stack = source.slice(
	source.indexOf('class AccessibleStackView'),
	source.indexOf('// The macOS Slider'),
)

const apply = source.slice(
	source.indexOf('function applyAccessibility('),
	source.indexOf('function applyProps('),
)

test('AppKit checkbox role/value/help update and disabled controls reject AX press', () => {
	const ids = new WeakMap()
	const handlers = new Map()
	let presses = 0
	const { AccessibleStackView, applyAccessibility } = runInNewContext(
		stack + '\n' + apply + '\n({ AccessibleStackView, applyAccessibility })',
		{
			NSStackView: class {},
			NativeClass() {},
			interop: { types: { bool: 'bool', id: 'id' } },
			NSNumber: { numberWithDouble: (value) => value },
			actionIdsByView: ids,
			actionHandlers: handlers,
			accessibilityRoles: new Map(),
			accessibilityLabels: new Map(),
			stackAccessibilityPropsByView: new WeakMap(),
			invokeAction: (id) => handlers.get(id)(),
			inputTransparentViews: new WeakSet(),
		},
	)

	const view = new AccessibleStackView()
	const node = { type: 'flexboxlayout', view, actionId: 1 }
	ids.set(view, 1)
	handlers.set(1, () => presses++)
	const set = (name, value) => applyAccessibility(node, name, value)
	set('accessibilityRole', 'checkbox')
	set('accessibilityLabel', 'Select Alice')
	set('accessibilityHint', 'Row 31 of 100')
	set('accessibilityState', { checked: 'mixed' })
	set('accessibilityValue', 'Sélection partielle')
	assert.equal(view.accessibilityRole(), 'AXCheckBox')
	assert.equal(view.accessibilityLabel(), 'Select Alice')
	assert.equal(view.accessibilityValue(), 2)
	assert.equal(view.accessibilityHelp(), 'Row 31 of 100')
	assert.equal(view.accessibilityIsIgnored(), false)
	assert.equal(view.accessibilityPerformPress(), true)
	assert.equal(presses, 1)
	set('accessibilityValue', undefined)
	set('accessibilityState', { checked: true })
	assert.equal(view.accessibilityValue(), 1)
	set('accessibilityValue', 'Partially selected')
	assert.equal(view.accessibilityValue(), 1)
	set('accessibilityState', { checked: false, disabled: true })
	assert.equal(view.accessibilityValue(), 0)
	set('accessibilityValue', 'Sélection partielle')
	assert.equal(view.accessibilityValue(), 0)
	assert.equal(view.accessibilityIsEnabled(), false)
	assert.equal(view.accessibilityPerformPress(), false)
	set('accessibilityState', { checked: false })
	handlers.set(1, null)
	assert.equal(view.accessibilityPerformPress(), false)
	assert.equal(presses, 1)
})
