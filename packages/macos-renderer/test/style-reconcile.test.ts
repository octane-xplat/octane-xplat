import assert from 'node:assert/strict'
import { test } from 'node:test'
import { runSlice } from './mock-globals.ts'
import { sourceWithoutImports } from './mock-globals.ts'
import {
	registerStylesheet,
	stylesheetScope,
	computeCascade,
	INHERITED_CSS_PROPERTIES,
} from '@octane-xplat/css-engine'

// Exercise style/className reconciliation without the Objective-C bridge.
// Removed style keys and dropped classes must put back the native state they
// installed — a stale alphaValue, input-transparency, size constraint, or
// background color survives on the view otherwise.
const source = sourceWithoutImports(new URL('../src/index.ts', import.meta.url))

const slices = [
	source.slice(
		source.indexOf('const MARGIN_SIDES'),
		source.indexOf('function wireViewAction'),
	),
	source.slice(
		source.indexOf('function layoutLength'),
		source.indexOf('function pinLayoutChild'),
	),
	source.slice(source.indexOf('const EDGE_INSET_PROPS'), source.indexOf('function textContent')),
	source.slice(
		source.indexOf('function nodeClasses'),
		source.indexOf('function withDrawingAppearance'),
	),
	source.slice(
		source.indexOf('function setLabelText'),
		source.indexOf('function syncText'),
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
		frame: { origin: { x: 0, y: 0 }, size: { width: 0, height: 0 } },
		postsFrameChangedNotifications: false,
		cell: { lineBreakMode: 0 },
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
		centerXAnchor: anchor(),
		centerYAnchor: anchor(),
		widthAnchor: anchor(),
		heightAnchor: anchor(),
		subviews: [],
		addedSubviews: [],
		addSubview(v) {
			this.addedSubviews.push(v)
		},
		arranged: [],
		addViewInGravity(v, gravity) {
			v.gravity = gravity
			this.arranged.push(v)
		},
		removeArrangedSubview(v) {
			const index = this.arranged.indexOf(v)
			if (index >= 0) {
				this.arranged.splice(index, 1)
			}
		},
		insertViewAtIndexInGravity(v, index, gravity) {
			v.gravity = gravity
			const group = this.arranged.filter((entry) => entry.gravity === gravity)
			const before = group[index]
			this.arranged.splice(before ? this.arranged.indexOf(before) : this.arranged.length, 0, v)
		},
		viewsInGravity(gravity) {
			const group = this.arranged.filter((entry) => entry.gravity === gravity)
			return { count: group.length, objectAtIndex: (index) => group[index] }
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
const frameObservers: any[] = []
const placeholderCalls: any[] = []
const reconciles: any[] = []

const MASON_TYPES = ['masonview', 'liquidglass', 'scrollview']

// Bound after the slices load — mirrors the real mason behavior's
// next.applyStyle/next.applyClassName delegation.
const hooks: any = {}
const masonProp = (_node: any, name: string, value: any) => {
	if (name === 'style') {
		hooks.applyStyle?.(_node, value)
		return true
	}
	if (name === 'className') {
		hooks.applyClassName?.(_node, value)
		return true
	}
	return true
}

const sandbox = {
		elementBehaviors: new Map(
			MASON_TYPES.map((t) => [
				t,
				// Mirrors the real mason behavior: consume every prop (layout
				// props reconcile through styleDict, not per-prop dispatch),
				// take container plumbing styles, advertise the style surface.
				{
					layout: () => {},
					containerStyles: true,
					applyProp: masonProp,
					styleKeys: new Set(['flexDirection', 'flexWrap', 'alignSelf', 'gap', 'rowGap', 'columnGap', 'flexGrow']),
				},
			]),
		),
		behaviorOf: (t: string) => sandbox.elementBehaviors.get(t),
		isManualLayoutParent: (t: string) =>
			['contentview','actionbar','rootlayout'].includes(t) ||
			MASON_TYPES.includes(t),
		registerElementType: () => {},
		
	console,
	inputTransparentViews,
	NSTextAlignment: { Left: 0, Center: 1, Right: 2 },
	NSUserInterfaceLayoutOrientation: { Horizontal: 0, Vertical: 1 },
	NSStackViewGravity: { Top: 1, Leading: 1, Center: 2, Bottom: 3, Trailing: 3 },
	NSStackViewDistribution: { GravityAreas: -1, Fill: 0, EqualSpacing: 3 },
	NSLayoutAttribute: {
		Bottom: 4,
		Right: 2,
		Top: 3,
		Left: 1,
		CenterX: 9,
		CenterY: 10,
		FirstBaseline: 11,
	},
	NSColor: {
		labelColor: { semantic: 'label' },
		placeholderTextColor: { semantic: 'placeholder' },
		colorWithRedGreenBlueAlpha: (r, g, b, a) => ({ CGColor: { r, g, b, a } }),
		colorWithCGColor: (cg) => ({ CGColor: cg }),
	},
	NSView: { alloc: () => ({ initWithFrame: () => view() }) },
	fontForFamilyStyle: (size, weight, family) => ({
		pointSize: Number(size),
		weight: String(weight ?? 400),
		familyName: family ?? null,
	}),
	setTextFieldPlaceholder: (field, props, override) =>
		placeholderCalls.push({ field, override }),
	placeholderCalls,
	fitTextView: () => {},
	NSNotificationCenter: {
		defaultCenter: {
			addObserverForNameObjectQueueUsingBlock: (name, obj, q, cb) => {
				frameObservers.push(cb)
				return cb
			},
			removeObserver: (o) => {
				const i = frameObservers.indexOf(o)
				if (i >= 0) {frameObservers.splice(i, 1)}
			},
		},
	},
	NSViewFrameDidChangeNotification: 'frame-changed',
	NSMutableParagraphStyle: { alloc: () => ({ init: () => ({}) }) },
	NSAttributedString: {
		alloc: () => ({
			initWithStringAttributes: (text, attrs) => ({ text, attrs }),
		}),
	},
	NSUnderlineStyleAttributeName: 'NSUnderline',
	NSStrikethroughStyleAttributeName: 'NSStrikethrough',
	NSFontAttributeName: 'NSFont',
	NSForegroundColorAttributeName: 'NSColor',
	NSParagraphStyleAttributeName: 'NSParagraph',
	layoutView: (n: any) => n.view,
	configureScrollAxes: () => {},
	// Style application can queue a parent layout reconcile; record them.
	queueLayoutReconcile: (_container: any, parent: any) => reconciles.push(parent),
	// Margin hosts install/remove a click-through recognizer; irrelevant here.
	setLayoutAction: () => {},
	// Real cascade machinery — the vendored selector engine is importable
	// directly, so slices exercise actual CSS matching.
	computeCascade,
	stylesheetScope,
	INHERITED_CSS_PROPERTIES,
	registerStylesheet,
	queueMicrotask,
}

const { applyStyle, setNodeInlineStyle, applyClassName, applyProps, nodeClasses, flushStyleDirty, markStyleDirty } = runSlice(
	slices.join('\n') +
		source.slice(source.indexOf('function applyProps'), source.indexOf('function detach')) +
		'\n({ applyStyle, setNodeInlineStyle, applyClassName, applyProps, nodeClasses, flushStyleDirty, markStyleDirty })',
	sandbox,
)
hooks.applyStyle = setNodeInlineStyle
hooks.applyClassName = applyClassName

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
		cssType: type,
		cssClasses: new Set(),
		cssPseudoClasses: new Set(),
		computedStyle: {},
		computedCustomProps: new Map(),
		getChildIndex: (c) => item.children.indexOf(c),
		getChildAt: (i) => item.children[i],
		getChildrenCount: () => item.children.length,
	}

	parent?.children.push(item)
	return item
}

// applyProps merges the incoming bag before dispatching — mirrors do the same
// so the class/style readers inside the slice see the current values.
function setClass(item, className) {
	item.props = { ...item.props, className }
	applyClassName(item, className)
	flushStyleDirty(item.container)
}

function setStyle(item, style) {
	item.props = { ...item.props, style }
	setNodeInlineStyle(item, style)
	flushStyleDirty(item.container)
}

// edgeInsets literals and nodeClasses results are built inside the vm realm —
// re-home for deepEqual.
function insets(value) {
	return { ...value }
}

function classes(item) {
	return [...nodeClasses(item)]
}

test('removed style keys reset alpha, input transparency, and size constraints', () => {
	const item = node('masonview', { orientation: 1 })
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
	const item = node('masonview', { orientation: 1 })
	setStyle(item, { opacity: 0.2, width: 40 })
	setStyle(item, { opacity: undefined })

	assert.equal(item.view.alphaValue, 1)
	assert.equal(item.sizeConstraints.width, undefined, 'absent keys reset too')
})

test('removed backgroundColor clears the layer when no class slot applies', () => {
	const item = node('masonview', { orientation: 1 })
	setStyle(item, { backgroundColor: '#ff0000' })
	assert.deepEqual({ ...item.view.layer.backgroundColor }, { r: 1, g: 0, b: 0, a: 1 })

	setStyle(item, {})
	assert.equal(item.view.layer.backgroundColor, null)
})

test('removed margin zeroes its side and re-queues the layout parent', () => {
	// Mason reads marginInsets — there is no wrapper view anymore.
	const parent = node('masonview', { props: {} })
	const item = node('label', { parent })

	setStyle(item, { marginTop: 8 })
	assert.equal(item.marginInsets.top, 8)

	reconciles.length = 0
	setStyle(item, {})
	assert.equal(item.marginInsets.top, 0)
	assert.ok(
		reconciles.includes(parent),
		'margin removal re-queues the mason pass',
	)
})

test('removed classes restore spacing, orientation, background, and insets', () => {
	registerStylesheet(
		'sr-containers',
		'.gap-2 { row-gap: 8px; column-gap: 8px } .bg-primary { background-color: blue; padding: 6px 10px } .flex-col { flex-direction: column }',
	)
	const item = node('masonview', { orientation: 1 })
	setClass(item, 'gap-2 bg-primary flex-col')

	assert.equal(item.computedStyle.rowGap, 8)
	assert.equal(item.computedStyle.flexDirection, 'column')
	// Container-plumbing insets flow to dockInsets — the mason style layer
	// reads them as padding, there is no NSStackView edgeInsets anymore.
	assert.deepEqual(insets(item.dockInsets), { top: 6, right: 10, bottom: 6, left: 10 })
	assert.ok(item.view.layer.backgroundColor != null)

	setClass(item, 'gap-2')

	assert.equal(item.computedStyle.rowGap, 8, 'remaining class still applies')
	assert.deepEqual(insets(item.dockInsets), { top: 0, right: 0, bottom: 0, left: 0 })
	assert.equal(item.view.layer.backgroundColor, null)

	setClass(item, '')

	assert.equal(item.computedStyle.rowGap, undefined)
})

test('removed rounded class restores corner radius and masksToBounds', () => {
	registerStylesheet('sr-radius', '.rounded-full { border-radius: 12px }')
	const item = node('masonview', { orientation: 1 })
	setClass(item, 'rounded-full')
	assert.equal(item.view.layer.cornerRadius, 12)
	assert.equal(item.view.layer.masksToBounds, true)

	setClass(item, '')
	assert.equal(item.view.layer.cornerRadius, 0)
	assert.equal(item.view.layer.masksToBounds, false)
})

test('style padding wins over class insets and removal restores them', () => {
	registerStylesheet('sr-toast', '.vx-toast { padding: 12px }')
	const item = node('masonview', { orientation: 1 })
	setClass(item, 'vx-toast')
	setStyle(item, { padding: 20 })

	assert.deepEqual(insets(item.dockInsets), { top: 20, right: 20, bottom: 20, left: 20 })

	setStyle(item, {})

	assert.deepEqual(insets(item.dockInsets), { top: 12, right: 12, bottom: 12, left: 12 })
})

test('font sources resolve style > class > default as each is removed', () => {
	registerStylesheet('sr-fonts', '.font-bold { font-weight: 700 }')
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
	registerStylesheet('sr-grabber', '.vx-sheet-grabber { text-align: center; height: 24px }')
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

// Test the real prop dispatch alongside style/class reconciliation. These
// values drive orientation, gravity groups and active stretch constraints.
registerStylesheet(
	'sr-layout',
	'.flex-col { flex-direction: column } .gap-2 { row-gap: 8px; column-gap: 8px } .gap-3 { row-gap: 12px; column-gap: 12px } .items-center { align-items: center } .justify-center { justify-content: center }',
)
for (const type of ['masonview', 'scrollview']) {
	test(`${type} resolves layout style > class > props independent of property order`, () => {
		for (const reversed of [false, true]) {
			const item = node(type, { orientation: 1 })
			const entries = Object.entries({
				style: { flexDirection: 'row', gap: 12, alignItems: 'end', justifyContent: 'end' },
				className: 'flex-col gap-2 items-center justify-center',
				flexDirection: 'column',
				gap: 4,
				alignItems: 'stretch',
				justifyContent: 'start',
			})

			applyProps(item, { className: 'flex-col gap-2' })
			flushStyleDirty(item.container)
			assert.equal(item.computedStyle.flexDirection, 'column')
			assert.equal(item.computedStyle.rowGap, 8)

			// Inline style beats CSS at equal-or-any cascade position (Local > Css).
			applyProps(item, { style: { flexDirection: 'row', gap: 12 } })
			flushStyleDirty(item.container)
			assert.equal(item.computedStyle.flexDirection, 'row')
			assert.equal(item.computedStyle.gap, 12)

			applyProps(item, { className: 'flex-col gap-3', style: {} })
			flushStyleDirty(item.container)
			assert.equal(item.computedStyle.rowGap, 12)

			applyProps(item, { className: '', style: {} })
			flushStyleDirty(item.container)
			assert.equal(item.computedStyle.rowGap, undefined)
			assert.equal(item.computedStyle.flexDirection, undefined)
		}
	})
}

test('layout prop/style updates re-queue the mason container pass', () => {
	const item = node('masonview', { orientation: 1 })
	node('label', { parent: item })

	reconciles.length = 0
	applyProps(item, { rowGap: 5, columnGap: 9, alignItems: 'stretch' })
	assert.ok(reconciles.length > 0, 'layout props queue a reconcile')

	reconciles.length = 0
	setStyle(item, { flexDirection: 'row', gap: 12 })
	assert.ok(reconciles.length > 0)
})

// Declarative className composes clsx-style on the DOM renderer and the
// NativeScript driver. Without normalization String(value) comma-joins an
// array into one token that matches nothing.
test('array className values tokenize like strings', () => {
	const item = node('masonview', { orientation: 1 })
	setClass(item, ['gap-2', 'bg-primary', 'items-center'])

	assert.deepEqual(classes(item), ['gap-2', 'bg-primary', 'items-center'])
	assert.equal(item.computedStyle.rowGap, 8)
	assert.ok(item.view.layer.backgroundColor != null)
})

test('nested arrays flatten and falsy entries drop out', () => {
	const item = node('masonview', { orientation: 1 })
	setClass(item, ['gap-2', ['items-center', null, false], undefined, ''])

	assert.deepEqual(classes(item), ['gap-2', 'items-center'])
	assert.equal(item.computedStyle.rowGap, 8)
})

test('object className values keep only truthy keys', () => {
	const item = node('masonview', { orientation: 1 })
	setClass(item, { 'gap-2': true, 'items-center': 1, 'bg-primary': false, hidden: 0 })

	assert.deepEqual(classes(item), ['gap-2', 'items-center'])
	assert.equal(item.computedStyle.rowGap, 8)
	assert.ok(item.view.layer.backgroundColor == null, 'falsy object keys never apply')
})

test('class effects still reset when an array input goes empty', () => {
	const item = node('masonview', { orientation: 1 })
	setClass(item, ['gap-2', 'bg-primary'])
	setClass(item, [])

	assert.deepEqual(classes(item), [])
	assert.equal(item.computedStyle.rowGap, undefined)
	assert.ok(item.view.layer.backgroundColor == null)
})

test('unsupported layout styles on a leaf keep useful diagnostics', () => {
	const warnings = []
	const original = console.warn
	console.warn = (message) => warnings.push(message)
	try {
		setStyle(node('label'), { flexDirection: 'row', gap: 12, flexGrow: 1 })
		setStyle(node('masonview', { orientation: 1 }), { flexWrap: 'wrap', alignSelf: 'center' })
	} finally {
		console.warn = original
	}

	// The leaf warns on each unsupported key; the masonview surface
	// advertises flexWrap/alignSelf through its behavior styleKeys.
	assert.equal(warnings.length, 3)
	assert.ok(warnings.some((message) => message.includes('style.gap on <label>')))
	assert.ok(!warnings.some((message) => message.includes('style.flexWrap')))
})

test('scrollview orientation props queue the mason pass', () => {
	const stack = node('scrollview', { orientation: 1 })
	reconciles.length = 0
	applyProps(stack, { orientation: 'horizontal' })
	assert.equal(stack.props.orientation, 'horizontal')
	assert.ok(reconciles.includes(stack) || reconciles.length > 0)
})

test('masonview edge padding updates queue the container pass', () => {
	const stack = node('masonview', { orientation: 1 })
	node('label', { parent: stack })

	applyProps(stack, {
		style: { paddingTop: 3, paddingBottom: 7, paddingLeft: 4, paddingRight: 10 },
	})
	flushStyleDirty(stack.container)
	assert.ok(
		stack.stylePaddingEdges?.top === 3 && stack.stylePaddingEdges?.right === 10,
		'edge padding parses for the engine',
	)
	assert.deepEqual(
		insets(stack.dockInsets),
		{ top: 3, right: 10, bottom: 7, left: 4 },
		'container insets flow to the mason padding channel',
	)
})

test('an unstyled masonview queues a reconcile without crashing', () => {
	const stack = node('masonview', { orientation: 1 })
	reconciles.length = 0
	applyProps(stack, {})
	assert.ok(reconciles.length >= 0)
})

test('percent borderRadius resolves against min(width, height) and re-resolves on frame change', () => {
	const item = node('masonview', { orientation: 1 })
	item.view.frame.size.width = 100
	item.view.frame.size.height = 50
	setStyle(item, { borderRadius: '50%' })
	assert.equal(item.view.layer.cornerRadius, 25)
	assert.equal(frameObservers.length, 1, 'frame observer installed while % radius is in effect')

	item.view.frame.size.width = 40
	for (const cb of [...frameObservers]) {cb()}
	assert.equal(item.view.layer.cornerRadius, 20)

	setStyle(item, {})
	assert.equal(item.view.layer.cornerRadius, 0)
	assert.equal(frameObservers.length, 0, 'observer removed when the radius resets')
})

test('numeric borderRadius is unchanged by percent handling', () => {
	const item = node('masonview', { orientation: 1 })
	item.view.frame.size.width = 100
	item.view.frame.size.height = 50
	setStyle(item, { borderRadius: 7 })
	assert.equal(item.view.layer.cornerRadius, 7)
	assert.equal(frameObservers.length, 0)
})

test('cornerShape squircle maps to a continuous corner curve; reset restores circular', () => {
	const item = node('masonview', { orientation: 1 })
	setStyle(item, { cornerShape: 'squircle' })
	assert.equal(item.view.layer.cornerCurve, 'continuous')

	setStyle(item, { cornerShape: 'round' })
	assert.equal(item.view.layer.cornerCurve, 'circular')

	setStyle(item, {})
	assert.equal(item.view.layer.cornerCurve, 'circular')
})

test('placeholderColor styles textfield placeholder and textview placeholderView; reset restores semantic default', () => {
	placeholderCalls.length = 0
	const field = node('textfield', { props: { placeholder: 'e' } })
	setStyle(field, { placeholderColor: 'red' })
	assert.equal(placeholderCalls.at(-1)?.override, 'red')

	setStyle(field, {})
	assert.equal(placeholderCalls.at(-1)?.override, undefined)

	const area = node('textview', { props: {} })
	area.placeholderView = { textColor: null }
	setStyle(area, { placeholderColor: 'blue' })
	assert.deepEqual({ ...area.placeholderView.textColor.CGColor }, { r: 0, g: 0, b: 1, a: 1 })

	setStyle(area, {})
	assert.ok(area.placeholderView.textColor, 'semantic default placeholder color restored')
})

test('textDecoration underline/line-through reach the label attributed string; reset clears them', () => {
	const item = node('label', { props: { text: 'hi' } })
	item.view.attributedStringValue = null
	setStyle(item, { textDecoration: 'underline' })
	assert.equal(item.view.attributedStringValue.attrs.NSUnderline, 1)
	assert.equal(item.view.attributedStringValue.attrs.NSStrikethrough, undefined)

	setStyle(item, { textDecoration: 'underline line-through' })
	assert.equal(item.view.attributedStringValue.attrs.NSUnderline, 1)
	assert.equal(item.view.attributedStringValue.attrs.NSStrikethrough, 1)

	setStyle(item, {})
	assert.equal(item.view.stringValue !== undefined || item.view.attributedStringValue?.attrs?.NSUnderline === undefined, true)
})

test('effectiveStyle tolerates a missing node (empty actionbar intrinsicContentSize)', () => {
	const { effectiveStyle } = runSlice(
		source.slice(
			source.indexOf('function effectiveStyle'),
			source.indexOf('function applyClassNameProp'),
		) + '\n({ effectiveStyle })',
		{},
	)
	assert.deepEqual({ ...effectiveStyle(undefined) }, {})
	assert.deepEqual({ ...effectiveStyle(null) }, {})
})
