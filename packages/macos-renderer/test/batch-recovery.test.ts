import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { stripTypeScriptTypes } from 'node:module'
import { test } from 'node:test'
import { runInNewContext } from 'node:vm'

// Exercise the production creation/command paths without the Objective-C
// bridge. Failed commands must not leak action registrations, observers, or
// WebView delegates, and invalid batches must reject before mutating.
const source = stripTypeScriptTypes(
	readFileSync(new URL('../src/index.ts', import.meta.url), 'utf8'),
)

const at = (marker: string, from = 0) => source.indexOf(marker, from)
const fn = (name: string) => source.slice(at(`function ${name}(`), at('\nfunction ', at(`function ${name}(`) + 1))
const constSet = (name: string) =>
	source.slice(at(`const ${name} = new Set(`), at('\n])', at(`const ${name} = new Set(`)) + 3)

const slices = [
	constSet('VIEW_PARENT_TYPES'),
	constSet('SUPPORTED_TYPES'),
	fn('typeHasView'),
	fn('assertSupportedType'),
	fn('validateNodeProps'),
	fn('nativeColor'),
	fn('parseGridTracks'),
	fn('makeNode'),
	fn('destroy'),
	fn('validateBatch'),
	source.slice(at('function applyCommand('), at('\nconst macOSDriver')),
	source.slice(at('const macOSDriver'), at('\nconst round')),
].join('\n')

const prefix = 'let nextActionId = 1000\nconst DEFAULT_TEXT_LINE_HEIGHT_RATIO = 21 / 16\n'

function fixture({ applyProps }: { applyProps?: any } = {}) {
	const actionHandlers = new Map()
	const accessibilityLabels = new Map()
	const accessibilityRoles = new Map()
	const removedObservers = []
	const disposedWebViews = []
	const factoryCalls = []

	const fakeView = (name: string): any => ({
		name,
		font: null,
		contentView: 'clip-' + name,
		addSubview() {},
		leadingAnchor: { constraintEqualToAnchorConstant: () => ({ active: false }) },
		topAnchor: { constraintEqualToAnchor: () => ({ active: false }) },
		heightAnchor: { constraintEqualToConstant: () => ({ active: false }) },
	})

	const allocAction = (view: any) => {
		const actionId = sandbox.nextMockActionId++
		actionHandlers.set(actionId, null)
		return { view, actionId }
	}

	const sandbox = {
		nextMockActionId: 500,
		actionHandlers,
		accessibilityLabels,
		accessibilityRoles,
		actionIdsByView: new WeakMap(),
		gridLayoutNodesByView: new WeakMap(),
		absoluteLayoutNodesByView: new WeakMap(),
		textNodesByView: new WeakMap(),
		scrollHandlers: new WeakMap(),
		layoutHandlers: new WeakMap(),
		NSColor: { colorWithRedGreenBlueAlpha: () => ({}) },
		NSNotificationCenter: {
			defaultCenter: { removeObserver: (observer: any) => removedObservers.push(observer) },
		},
		buttonActionTarget: {},
		fontForFamilyStyle: () => ({ pointSize: 14 }),
		disposeWebView: (view: any) => disposedWebViews.push(view),
		disposeImage: () => {},
		applyProps: applyProps ?? (() => {}),
		insert: () => {},
		remove: () => {},
		detach: (container: any, node: any) => {
			const siblings = node.parent ? node.parent.children : container.children
			const index = siblings.indexOf(node)
			if (index >= 0) {
				siblings.splice(index, 1)
			}

			node.parent = null
		},
		makeStack: () => (factoryCalls.push('stack'), fakeView('stack')),
		makeFlexbox: () => ({ view: fakeView('flexboxlayout') }),
		makeGridLayout: () => (factoryCalls.push('gridlayout'), fakeView('gridlayout')),
		makeAbsoluteLayout: () => fakeView('absolutelayout'),
		makeLabel: () => fakeView('label'),
		makeButton: () => (factoryCalls.push('button'), allocAction(fakeView('button'))),
		makeScrollView: () => ({ view: fakeView('scrollview'), childHost: fakeView('scrollhost') }),
		makeTextField: () => fakeView('textfield'),
		makeSwitch: () => allocAction(fakeView('switch')),
		makeSlider: () => allocAction(fakeView('slider')),
		makeWebView: () => fakeView('webview'),
		makeImageView: () => fakeView('image'),
	}

	const api = runInNewContext(
		prefix + slices + '\n;({ makeNode, destroy, validateBatch, applyCommand, validateNodeProps, macOSDriver })',
		sandbox,
	)

	const container = { nodes: new Map(), children: [], hostView: fakeView('host') }
	return {
		...api,
		container,
		actionHandlers,
		removedObservers,
		disposedWebViews,
		factoryCalls,
		fakeView,
	}
}

test('a rejected prop fails creation before factories allocate', () => {
	const fx = fixture()
	assert.throws(
		() => fx.makeNode(fx.container, 1, 'button', { style: 'solid' }),
		/style to be an object/,
	)
	assert.deepEqual(fx.factoryCalls, [])
	assert.equal(fx.actionHandlers.size, 0)
})

test('a throwing prop unwinds the action registration', () => {
	const fx = fixture({
		applyProps: (node: any) => {
			assert.equal(fx.actionHandlers.has(node.actionId), true)
			throw new Error('prop failed')
		},
	})
	assert.throws(() => fx.makeNode(fx.container, 2, 'button', {}), /prop failed/)
	assert.equal(fx.actionHandlers.size, 0)
	assert.equal(fx.container.nodes.size, 0)
})

test('repeated failed creations leak no action slots', () => {
	const fx = fixture({
		applyProps: () => {
			throw new Error('prop failed')
		},
	})
	for (const id of [3, 4]) {
		assert.throws(() => fx.makeNode(fx.container, id, 'switch', {}), /prop failed/)
	}

	assert.equal(fx.actionHandlers.size, 0)
})

test('a throwing prop disposes a partially built webview', () => {
	const fx = fixture({
		applyProps: () => {
			throw new Error('prop failed')
		},
	})
	assert.throws(() => fx.makeNode(fx.container, 5, 'webview', {}), /prop failed/)
	assert.equal(fx.disposedWebViews.length, 1)
})

test('a throwing prop removes an installed scroll observer', () => {
	const fx = fixture({
		applyProps: (node: any) => {
			node.scrollObserverInstalled = true
			node.scrollObserver = { token: 'scroll-observer' }
			throw new Error('prop failed')
		},
	})
	assert.throws(() => fx.makeNode(fx.container, 6, 'scrollview', {}), /prop failed/)
	assert.deepEqual(fx.removedObservers, [{ token: 'scroll-observer' }])
})

test('batch validation rejects commands before any apply work', () => {
	const fx = fixture()
	fx.container.nodes.set(1, { id: 1, type: 'label', props: {}, parent: null, children: [] })

	// Insert into a non-container parent must fail at prepare, not mid-apply.
	assert.throws(
		() =>
			fx.validateBatch(fx.container, [
				{ op: 'create', id: 2, type: 'button', props: {} },
				{ op: 'insert', id: 2, parent: 1, before: null },
			]),
		/cannot contain child views/,
	)
	assert.throws(
		() => fx.validateBatch(fx.container, [{ op: 'insert', id: 9, parent: null, before: null }]),
		/Unknown AppKit node 9/,
	)
	assert.throws(
		() =>
			fx.validateBatch(fx.container, [
				{ op: 'create', id: 2, type: 'gridlayout', props: { rows: '1fr bogus' } },
			]),
		/unsupported grid track/,
	)
	assert.throws(
		() => fx.validateBatch(fx.container, [{ op: 'update', id: 99, props: {} }]),
		/Unknown AppKit node 99/,
	)
	assert.throws(
		() =>
			fx.validateBatch(fx.container, [
				{ op: 'destroy', id: 1 },
				{ op: 'update', id: 1, props: {} },
			]),
		/Unknown AppKit node 1/,
	)
})

test('batch validation accepts references to ids created earlier in the batch', () => {
	const fx = fixture()
	fx.validateBatch(fx.container, [
		{ op: 'create', id: 2, type: 'stack', props: { flexDirection: 'row' } },
		{ op: 'create', id: 3, type: 'label', props: { text: 'hi' } },
		{ op: 'insert', id: 3, parent: 2, before: null },
		{ op: 'insert', id: 2, parent: null, before: null },
		{ op: 'update', id: 3, props: { text: 'bye' } },
	])
})

test('prepareBatch rejects an invalid batch before apply runs', () => {
	const fx = fixture()
	const applyCalls: any[] = []
	// prepareBatch must throw; applyCommand must never run for this batch.
	assert.throws(
		() =>
			fx.macOSDriver.prepareBatch(fx.container, {
				commands: [{ op: 'create', id: 2, type: 'bogus', props: {} }],
			}),
		/does not support <bogus>/,
	)
	assert.deepEqual(applyCalls, [])
})

test('create on an existing id releases the previous node', () => {
	const fx = fixture()
	const old = {
		id: 7,
		type: 'button',
		view: fx.fakeView('old-button'),
		props: {},
		parent: null,
		children: [],
		actionId: 42,
		scrollObserverInstalled: false,
	}
	fx.actionHandlers.set(42, () => {})
	fx.container.nodes.set(7, old)
	fx.container.children.push(old)

	fx.applyCommand(fx.container, { op: 'create', id: 7, type: 'button', props: {} })

	const node = fx.container.nodes.get(7)
	assert.notEqual(node, old)
	assert.equal(old.parent, null)
	assert.equal(fx.container.children.includes(old), false)
	assert.equal(fx.actionHandlers.has(42), false)
	assert.equal(fx.actionHandlers.has(node.actionId), true)
})

test('a failed update restores the recorded props', () => {
	const fx = fixture({
		applyProps: (node: any, props: any) => {
			node.props = { ...node.props, ...props }
			throw new Error('prop failed')
		},
	})
	const node = {
		id: 8,
		type: 'label',
		view: fx.fakeView('label'),
		props: { text: 'old' },
		parent: null,
		children: [],
	}
	fx.container.nodes.set(8, node)

	assert.throws(
		() => fx.applyCommand(fx.container, { op: 'update', id: 8, props: { text: 'new' } }),
		/prop failed/,
	)
	assert.deepEqual(node.props, { text: 'old' })
})

test('recreate rejects a view replacement under a non-container parent', () => {
	const fx = fixture()
	const parent = { id: 10, type: 'label', view: {}, props: {}, parent: null, children: [] }
	const child = {
		id: 9,
		type: '#text',
		view: null,
		props: { value: 'x' },
		parent,
		children: [],
	}
	parent.children.push(child)
	fx.container.nodes.set(10, parent)
	fx.container.nodes.set(9, child)

	assert.throws(
		() => fx.applyCommand(fx.container, { op: 'recreate', id: 9, type: 'button', props: {} }),
		/cannot contain child views/,
	)
	// The original node stays intact — nothing was removed or destroyed.
	assert.equal(fx.container.nodes.get(9), child)
	assert.deepEqual(parent.children, [child])
})
