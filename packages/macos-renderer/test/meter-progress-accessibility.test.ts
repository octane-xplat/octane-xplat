import { readFileSync } from 'node:fs'
import { stripTypeScriptTypes } from 'node:module'
import { runInNewContext } from 'node:vm'
import { test } from 'node:test'
import assert from 'node:assert/strict'

// ARIA 'meter' maps to AXLevelIndicator and 'progressbar' to
// AXProgressIndicator on both stack and grid hosts, each reporting a numeric
// value within the declared range plus the human-readable description.
const source = stripTypeScriptTypes(
	readFileSync(new URL('../src/index.ts', import.meta.url), 'utf8'),
)

const stack = source.slice(
	source.indexOf('class AccessibleStackView'),
	source.indexOf('// The macOS Slider'),
)

const grid = source.slice(
	source.indexOf('// The macOS Slider'),
	source.indexOf('class AbsoluteLayoutView'),
)

const apply = source.slice(
	source.indexOf('function applyAccessibility('),
	source.indexOf('function applyProps('),
)

test('AppKit meter and progressbar roles report range, value, and description', () => {
	const ids = new WeakMap()
	const roles = new Map()
	const labels = new Map()
	const stackProps = new WeakMap()
	const gridNodes = new WeakMap()
	const { AccessibleStackView, GridLayoutView, applyAccessibility } = runInNewContext(
		stack +
			'\n' +
			grid +
			'\n' +
			apply +
			'\n({ AccessibleStackView, GridLayoutView, applyAccessibility })',
		{
			NSStackView: class {},
			NSView: class {},
			NativeClass() {},
			interop: { types: { bool: 'bool', id: 'id' } },
			NSNumber: { numberWithDouble: (value) => value },
			actionIdsByView: ids,
			actionHandlers: new Map(),
			accessibilityRoles: roles,
			accessibilityLabels: labels,
			stackAccessibilityPropsByView: stackProps,
			gridLayoutNodesByView: gridNodes,
			invokeAction: () => {},
			inputTransparentViews: new WeakSet(),
		},
	)

	const stackView = new AccessibleStackView()
	const stackNode = { type: 'flexboxlayout', view: stackView, actionId: 1 }
	ids.set(stackView, 1)
	const setStack = (name, value) => applyAccessibility(stackNode, name, value)
	setStack('accessibilityRole', 'meter')
	setStack('accessibilityLabel', 'Storage used')
	setStack('accessibilityValue', 6)
	setStack('accessibilityMinValue', 0)
	setStack('accessibilityMaxValue', 10)
	setStack('accessibilityValueDescription', '6 GB of 10 GB used')
	assert.equal(stackView.accessibilityRole(), 'AXLevelIndicator')
	assert.equal(stackView.accessibilityLabel(), 'Storage used')
	assert.equal(stackView.accessibilityValue(), 6)
	assert.equal(stackView.accessibilityMinValue(), 0)
	assert.equal(stackView.accessibilityMaxValue(), 10)
	assert.equal(stackView.accessibilityValueDescription(), '6 GB of 10 GB used')
	assert.equal(stackView.accessibilityIsIgnored(), false)

	setStack('accessibilityRole', 'progressbar')
	setStack('accessibilityValueDescription', undefined)
	assert.equal(stackView.accessibilityRole(), 'AXProgressIndicator')
	assert.equal(stackView.accessibilityValueDescription(), '')

	const gridView = new GridLayoutView()
	const gridNode = { type: 'gridlayout', view: gridView, props: {} }
	gridNodes.set(gridView, gridNode)
	gridNode.props.accessibilityRole = 'meter'
	gridNode.props.accessibilityValue = 3
	gridNode.props.accessibilityValueDescription = '3 of 4 bars'
	assert.equal(gridView.accessibilityRole(), 'AXLevelIndicator')
	assert.equal(gridView.accessibilityValue(), 3)
	assert.equal(gridView.accessibilityValueDescription(), '3 of 4 bars')
	assert.equal(gridView.accessibilityIsIgnored(), false)

	gridNode.props.accessibilityRole = 'progressbar'
	assert.equal(gridView.accessibilityRole(), 'AXProgressIndicator')

	gridNode.props.accessibilityRole = 'adjustable'
	assert.equal(gridView.accessibilityRole(), 'AXSlider')
})
