import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { stripTypeScriptTypes } from 'node:module'
import { test } from 'node:test'
import { runInNewContext } from 'node:vm'

// Exercise style/className reconciliation without the Objective-C bridge.
// Removed style keys and dropped classes must put back the native state they
// installed — a stale alphaValue, input-transparency, size constraint, or
// background color survives on the view otherwise.
const source = stripTypeScriptTypes(
	readFileSync(new URL('../src/index.ts', import.meta.url), 'utf8'),
)

const slices = [
	source.slice(
		source.indexOf('function stackAlignmentAttribute'),
		source.indexOf('function makeFlexbox'),
	),
	source.slice(
		source.indexOf('function layoutLength'),
		source.indexOf('function performGridAccessibilityAdjustment'),
	),
	source.slice(source.indexOf('const EDGE_INSET_PROPS'), source.indexOf('function textContent')),
	source.slice(
		source.indexOf('function nodeClasses'),
		source.indexOf('function withDrawingAppearance'),
	),
]

function anchor() {
	return {
		constraintEqualToAnchor: () => ({ active: false, constant: 0 }),
		constraintEqualToAnchorConstant: (_other, constant) => ({ active: false, constant }),
		constraintEqualToAnchorMultiplier: (_other, multiplier) => ({ active: false, multiplier }),
		constraintEqualToConstant: (constant) => ({ active: false, constant }),
	}
}

function view({ orientation } = {}) {
	return {
		orientation,
		spacing: 0,
		alignment: null,
		distribution: null,
		edgeInsets: { top: 0, right: 0, bottom: 0, left: 0 },
		wantsLayer: false,
		layer: {
			setValueForKeyPath(key, value) {
				this['kvc:' + key] = value
			},
		},
		alphaValue: 1,
		font: { pointSize: 16, familyName: null },
		textColor: null,
		leadingAnchor: anchor(),
		trailingAnchor: anchor(),
		topAnchor: anchor(),
		bottomAnchor: anchor(),
		widthAnchor: anchor(),
		heightAnchor: anchor(),
		subviews: [],
		addedSubviews: [],
		addSubview(v) {
			this.addedSubviews.push(v)
		},
		removed: false,
		removeFromSuperview() {
			this.removed = true
		},
		setContentHuggingPriorityForOrientation() {},
		setContentCompressionResistancePriorityForOrientation() {},
	}
}

const inputTransparentViews = new Set()

const sandbox = {
	console,
	inputTransparentViews,
	NSTextAlignment: { Left: 0, Center: 1, Right: 2 },
	NSUserInterfaceLayoutOrientation: { Horizontal: 0, Vertical: 1 },
	NSStackViewGravity: { Top: 1, Leading: 2, Center: 3, Bottom: 4, Trailing: 5 },
	NSStackViewDistribution: { GravityAreas: -1, Fill: 0, EqualSpacing: 3 },
	NSLayoutAttribute: { Top: 3, Left: 1, CenterX: 9, CenterY: 10, FirstBaseline: 11 },
	NSColor: {
		colorWithRedGreenBlueAlpha: (r, g, b, a) => ({ CGColor: { r, g, b, a } }),
		colorWithCGColor: (cg) => ({ CGColor: cg }),
	},
	NSView: { alloc: () => ({ initWithFrame: () => view() }) },
	fontForFamilyStyle: (size, weight, family) => ({
		pointSize: Number(size),
		weight: String(weight ?? 400),
		familyName: family ?? null,
	}),
	setLabelText: () => {},
	setTextFieldPlaceholder: () => {},
}

const { applyStyle, applyClassName } = runInNewContext(
	slices.join('\n') + '\n({ applyStyle, applyClassName })',
	sandbox,
)

const container = { fontFamily: undefined }

function node(type, { orientation, props = {}, parent = null } = {}) {
	const item = {
		id: Math.random(),
		type,
		view: view({ orientation }),
		props,
		parent,
		children: [],
		container,
	}

	parent?.children.push(item)
	return item
}

// applyProps merges the incoming bag before dispatching — mirrors do the same
// so the class/style readers inside the slice see the current values.
function setClass(item, className) {
	item.props = { ...item.props, className }
	applyClassName(item, className)
}

function setStyle(item, style) {
	item.props = { ...item.props, style }
	applyStyle(item, style)
}

// edgeInsets literals are built inside the vm realm — re-home for deepEqual.
function insets(value) {
	return { ...value }
}

test('removed style keys reset alpha, input transparency, and size constraints', () => {
	const item = node('flexboxlayout', { orientation: 1 })
	setStyle(item, { width: 100, opacity: 0.2, pointerEvents: 'none' })

	assert.equal(item.view.alphaValue, 0.2)
	assert.ok(inputTransparentViews.has(item.view))
	assert.equal(item.sizeConstraints.width.active, true)

	setStyle(item, {})

	assert.equal(item.view.alphaValue, 1)
	assert.ok(!inputTransparentViews.has(item.view))
	assert.equal(item.sizeConstraints.width, undefined)
	assert.equal(item.sizeConstraintSpecs.width, undefined)
})

test('style keys nulled in place reset the same as absent keys', () => {
	const item = node('flexboxlayout', { orientation: 1 })
	setStyle(item, { opacity: 0.2, width: 40 })
	setStyle(item, { opacity: undefined })

	assert.equal(item.view.alphaValue, 1)
	assert.equal(item.sizeConstraints.width, undefined, 'absent keys reset too')
})

test('removed backgroundColor clears the layer when no class slot applies', () => {
	const item = node('flexboxlayout', { orientation: 1 })
	setStyle(item, { backgroundColor: '#ff0000' })
	assert.deepEqual({ ...item.view.layer.backgroundColor }, { r: 1, g: 0, b: 0, a: 1 })

	setStyle(item, {})
	assert.equal(item.view.layer.backgroundColor, null)
})

test('removed margin zeroes its side and releases the margin host', () => {
	const stackView = view({ orientation: 1 })
	stackView.gravityInserts = []
	stackView.insertViewAtIndexInGravity = (v, index) => stackView.gravityInserts.push({ v, index })
	stackView.addViewInGravity = () => {}
	stackView.removeArrangedSubview = () => {}
	const parent = node('flexboxlayout', { props: {} })
	parent.view = stackView
	const item = node('label', { parent })

	setStyle(item, { marginTop: 8 })
	assert.equal(item.marginInsets.top, 8)
	assert.ok(item.marginHost, 'margin host wraps the view')

	setStyle(item, {})

	assert.equal(item.marginInsets.top, 0)
	assert.equal(item.marginHost, null)
	assert.equal(stackView.gravityInserts.at(-1).v, item.view, 'unwrapped view reinserted')
})

test('removed classes restore spacing, alignment, background, and insets', () => {
	const item = node('flexboxlayout', { orientation: 1 })
	setClass(item, 'gap-2 bg-primary items-center')

	assert.equal(item.view.spacing, 8)
	assert.notEqual(item.view.alignment, null)
	assert.deepEqual(insets(item.view.edgeInsets), { top: 6, right: 10, bottom: 6, left: 10 })
	assert.ok(item.view.layer.backgroundColor != null)

	setClass(item, 'gap-2')

	assert.equal(item.view.spacing, 8, 'remaining class still applies')
	assert.deepEqual(insets(item.view.edgeInsets), { top: 0, right: 0, bottom: 0, left: 0 })
	assert.equal(item.view.layer.backgroundColor, null)
	assert.equal(item.bgSlot, undefined)

	setClass(item, '')

	assert.equal(item.view.spacing, 0)
	assert.equal(item.view.alignment, 1, 'stretch -> NSLayoutAttribute.Left for a vertical stack')
})

test('removed rounded class restores corner radius and masksToBounds', () => {
	const item = node('flexboxlayout', { orientation: 1 })
	setClass(item, 'rounded-full')
	assert.equal(item.view.layer.cornerRadius, 12)
	assert.equal(item.view.layer.masksToBounds, true)

	setClass(item, '')
	assert.equal(item.view.layer.cornerRadius, 0)
	assert.equal(item.view.layer.masksToBounds, false)
})

test('style padding wins over class insets and removal restores them', () => {
	const item = node('flexboxlayout', { orientation: 1 })
	setClass(item, 'vx-toast')
	setStyle(item, { padding: 20 })

	assert.deepEqual(insets(item.view.edgeInsets), { top: 20, right: 20, bottom: 20, left: 20 })

	setStyle(item, {})

	assert.deepEqual(insets(item.view.edgeInsets), { top: 12, right: 12, bottom: 12, left: 12 })
})

test('font sources resolve style > class > default as each is removed', () => {
	const item = node('label')
	setClass(item, 'font-bold')
	setStyle(item, { fontSize: 20 })

	assert.equal(item.view.font.pointSize, 20)
	assert.equal(item.view.font.weight, '700')

	setStyle(item, { fontSize: undefined, fontWeight: '300' })
	assert.equal(item.view.font.weight, '300', 'style weight beats the class weight')

	setStyle(item, {})
	assert.equal(item.view.font.pointSize, 16)
	assert.equal(item.view.font.weight, '700', 'class weight survives style removal')

	setClass(item, '')
	assert.equal(item.view.font.weight, '400')
})

test('grabber class removal returns label alignment to textAlign or left', () => {
	const item = node('label')
	setClass(item, 'vx-sheet-grabber')
	assert.equal(item.view.alignment, 1)
	assert.equal(item.sizeConstraintSpecs.height.points, 24)

	setClass(item, '')
	assert.equal(item.view.alignment, 0)

	setStyle(item, { textAlign: 'right' })
	setClass(item, 'vx-sheet-grabber')
	setClass(item, '')
	assert.equal(item.view.alignment, 2)
})
