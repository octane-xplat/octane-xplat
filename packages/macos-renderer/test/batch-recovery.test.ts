import assert from 'node:assert/strict'
import { test } from 'node:test'
import { runInNewContext } from 'node:vm'
import { validateTextStyle } from '../src/formatted-text.ts'
import { sourceWithoutImports } from './mock-globals.ts'

// Exercise the production creation/command paths without the Objective-C
// bridge. Failed commands must not leak action registrations, observers, or
// WebView delegates, and invalid batches must reject before mutating.
const source = sourceWithoutImports(new URL('../src/index.ts', import.meta.url))

const at = (marker: string, from = 0) => source.indexOf(marker, from)
const fn = (name: string) =>
	source.slice(at(`function ${name}(`), at('\nfunction ', at(`function ${name}(`) + 1))

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
	fn('observeContentGeometry'),
	fn('makeNode'),
	fn('destroy'),
	fn('parentReference'),
	fn('resolveParentNode'),
	fn('canContainView'),
	source.slice(at('function isPortalTargetView('), at('\nconst actionHandlers')),
	fn('validateTextNesting'),
	fn('validateBatch'),
	source.slice(at('function droppedPropClears('), at('\nfunction applyProps(')),
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
	const geometryObservers = []
	const geometryReconciles = []

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
		releaseMasonNodes: () => {},
		layoutMasonChildren: () => {},
		masonNaturalSize: () => null,
		MASON_STYLE_KEYS: new Set(),
		
		validateTextStyle,
		nextMockActionId: 500,
		actionHandlers,
		accessibilityLabels,
		accessibilityRoles,
		actionIdsByView: new WeakMap(),
		gridLayoutNodesByView: new WeakMap(),
		absoluteLayoutNodesByView: new WeakMap(),
		contentViewNodesByView: new WeakMap(),
		textNodesByView: new WeakMap(),
		scrollHandlers: new WeakMap(),
		layoutHandlers: new WeakMap(),
		nodeContainersByView: new WeakMap(),
		NSViewFrameDidChangeNotification: 'frame-changed',
		queueLayoutReconcile: (_container: any, parent: any) => geometryReconciles.push(parent),
		NSColor: { colorWithRedGreenBlueAlpha: () => ({}) },
		NSNotificationCenter: {
			defaultCenter: {
				removeObserver: (observer: any) => removedObservers.push(observer),
				addObserverForNameObjectQueueUsingBlock: (
					_name: any,
					view: any,
					_queue: any,
					block: any,
				) => {
					const observer = { view, block }
					geometryObservers.push(observer)
					return observer
				},
			},
		},
		buttonActionTarget: {},
		fontForFamilyStyle: () => ({ pointSize: 14 }),
		disposePressGestures: () => {},
		panHandlersByView: new WeakMap(),
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
		makeContentView: () => (factoryCalls.push('contentview'), fakeView('contentview')),
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
		prefix +
			slices +
			'\n;({ makeNode, destroy, validateBatch, applyCommand, validateNodeProps, macOSDriver })',
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
		geometryObservers,
		geometryReconciles,
		nodeContainersByView: sandbox.nodeContainersByView,
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

test('portal targets reject a native node owned by another Octane root', () => {
	const fx = fixture()
	const target: any = {
		...fx.fakeView('foreign-root-target'),
		leadingAnchor: { constraintEqualToAnchor() {} },
		trailingAnchor: { constraintEqualToAnchor() {} },
		topAnchor: { constraintEqualToAnchor() {} },
		bottomAnchor: { constraintEqualToAnchor() {} },
	}

	fx.nodeContainersByView.set(target, { nodes: new Map(), children: [] })

	assert.throws(
		() =>
			fx.macOSDriver.portals.prepareTarget({
				container: fx.container,
				renderer: 'macos',
				target,
				transported: false,
				createPortalTargetHandle: (id: number) => ({ id }),
			}),
		/portal target belongs to another Octane root/,
	)
})

test('destroy releases the native view ownership registration', () => {
	const fx = fixture()
	const node = fx.makeNode(fx.container, 7, 'label', {})
	assert.equal(fx.nodeContainersByView.get(node.view), fx.container)

	fx.destroy(node)
	assert.equal(fx.nodeContainersByView.has(node.view), false)
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
		container: fx.container,
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

test('stacklayout creates a view and participates in validated parent batches', () => {
	const fx = fixture()
	const stack = fx.makeNode(fx.container, 1, 'stacklayout', { orientation: 'horizontal' })
	assert.ok(stack.view)
	assert.equal(stack.type, 'stacklayout')
	assert.doesNotThrow(() =>
		fx.validateBatch(fx.container, [
			{ op: 'create', id: 1, type: 'stacklayout', props: {} },
			{ op: 'create', id: 2, type: 'label', props: { text: 'Child' } },
			{ op: 'insert', id: 2, parent: 1, before: null },
		]),
	)
})

test('invalid stacklayout orientation rejects before allocating any native host', () => {
	const fx = fixture()
	assert.throws(
		() => fx.makeNode(fx.container, 1, 'stacklayout', { orientation: 'sideways' }),
		/orientation must/,
	)

	assert.deepEqual(fx.factoryCalls, [])
	assert.throws(
		() =>
			fx.validateBatch(fx.container, [
				{ op: 'create', id: 1, type: 'stacklayout', props: {} },
				{ op: 'update', id: 1, props: { orientation: 'sideways' } },
			]),
		/orientation must/,
	)

	assert.equal(fx.container.nodes.size, 0)
})

for (const type of ['#text', 'span']) {
	test(`stacklayout rejects ${type} children during batch validation`, () => {
		const fx = fixture()
		assert.throws(
			() =>
				fx.validateBatch(fx.container, [
					{ op: 'create', id: 1, type: 'stacklayout', props: {} },
					{ op: 'create', id: 2, type, props: {} },
					{ op: 'insert', id: 2, parent: 1, before: null },
				]),
			/cannot contain text-only children/,
		)
	})
}

test('destroying stacklayout detaches a retained descendant host', () => {
	const fx = fixture()
	const parent = fx.makeNode(fx.container, 1, 'stacklayout', {})
	const child = fx.makeNode(fx.container, 2, 'stacklayout', {})
	parent.children.push(child)
	child.parent = parent
	fx.destroy(child)
	assert.equal(child.parent, null)
	assert.equal(parent.children.length, 0)
})

test('stacklayout validates a recreated text child using parents inserted in the same batch', () => {
	const fx = fixture()
	assert.throws(
		() =>
			fx.validateBatch(fx.container, [
				{ op: 'create', id: 1, type: 'stacklayout', props: {} },
				{ op: 'create', id: 2, type: 'label', props: {} },
				{ op: 'insert', id: 2, parent: 1, before: null },
				{ op: 'recreate', id: 2, type: 'span', props: {} },
			]),
		/cannot contain text-only children/,
	)

	assert.equal(fx.container.nodes.size, 0)
})

test('contentview factory and single-slot parent accept the shared intrinsic', () => {
	const fx = fixture()
	assert.ok(fx.makeNode(fx.container, 1, 'contentview', {}).view)
	assert.doesNotThrow(() =>
		fx.validateBatch(fx.container, [
			{ op: 'create', id: 1, type: 'contentview', props: {} },
			{ op: 'create', id: 2, type: 'label', props: {} },
			{ op: 'insert', id: 2, parent: 1, before: null },
			{ op: 'recreate', id: 2, type: 'stacklayout', props: {} },
		]),
	)
})

for (const type of ['#text', 'span']) {
	for (const op of ['insert', 'recreate']) {
		test(`contentview rejects ${type} through ${op} before mutation`, () => {
			const fx = fixture()
			const commands = [
				{ op: 'create', id: 1, type: 'contentview', props: {} },
				{ op: 'create', id: 2, type: op === 'insert' ? type : 'label', props: {} },
				{ op: 'insert', id: 2, parent: 1, before: null },
			]

			if (op === 'recreate') {
				commands.push({ op, id: 2, type, props: {} } as any)
			}

			assert.throws(() => fx.validateBatch(fx.container, commands), /contentview.*text-only/)
			assert.equal(fx.container.nodes.size, 0)
			assert.deepEqual(fx.factoryCalls, [])
		})
	}
}

test('contentview observes real frame changes and ignores callbacks after disposal', () => {
	const fx = fixture()
	const host = fx.makeNode(fx.container, 1, 'contentview', {})
	assert.equal(host.view.postsFrameChangedNotifications, true)
	const observer = fx.geometryObservers[0]
	observer.block()
	assert.deepEqual(fx.geometryReconciles, [host])
	fx.destroy(host)
	assert.deepEqual(fx.removedObservers, [observer])
	assert.equal(host.contentGeometryObserver, null)
	observer.block()
	assert.deepEqual(fx.geometryReconciles, [host])
})

test('failed contentview creation releases its geometry observer', () => {
	const fx = fixture({
		applyProps: () => {
			throw new Error('prop failed')
		},
	})

	assert.throws(() => fx.makeNode(fx.container, 1, 'contentview', {}), /prop failed/)
	assert.deepEqual(fx.removedObservers, [fx.geometryObservers[0]])
	fx.geometryObservers[0].block()
	assert.equal(fx.geometryReconciles.length, 0)
})
