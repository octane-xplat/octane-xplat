import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { stripTypeScriptTypes } from 'node:module'
import { test } from 'node:test'
import { runInNewContext } from 'node:vm'

// Exercise the production slot and placement paths, not a replica of them.
const source = stripTypeScriptTypes(
	readFileSync(new URL('../src/index.ts', import.meta.url), 'utf8'),
)

const fn = (name: string) => {
	const start = source.indexOf(`function ${name}(`)
	const rest = source.slice(start)
	return rest.slice(0, rest.search(/\n(?:function |const |class |export )/))
}

function fixture() {
	const noop = () => {}
	const anchor = () => ({
		constraintEqualToAnchorConstant: (_other: any, constant: number) => ({
			constant,
			active: false,
		}),
		constraintEqualToConstant: (constant: number) => ({ constant, active: false }),
	})

	const view = () => ({
		bounds: { size: { width: 200, height: 100 } },
		intrinsicContentSize: { width: 40, height: 20 },
		subviews: [] as any[],
		superview: null as any,
		leadingAnchor: anchor(),
		topAnchor: anchor(),
		widthAnchor: anchor(),
		heightAnchor: anchor(),
		invalidateIntrinsicContentSize: noop,
		setContentCompressionResistancePriorityForOrientation: noop,
		addSubview(child: any) {
			this.subviews.push(child)
			child.superview = this
		},
		removeFromSuperview() {
			if (this.superview) {
				this.superview.subviews.splice(this.superview.subviews.indexOf(this), 1)
			}

			this.superview = null
		},
	})

	const parent = {
		id: 1,
		type: 'wraplayout',
		props: {},
		view: view(),
		children: [] as any[],
		contentChild: null as any,
	}

	const container = { nodes: new Map([[1, parent]]), children: [] }

	;(parent as any).container = container
	const api = runInNewContext(
		[
			'layoutLength',
			'pinLayoutChild',
			'releasePlacementPins',
			'layoutWrapChildren',
			'layoutContentChild',
			'dockChildSize',
			'wrapMeasure',
			'setWrapSizingPriorities',
			'layoutDockChildren',
			'dockNaturalSize',
			'wrapNaturalSize',
			'detach',
			'queueLayoutReconcile',
			'reconcileLayoutParent',
			'validateTextNesting',
			'insert',
			'remove',
			'destroy',
			'validateNodeProps',
			'applyCommand',
			'applyProps',
			'clearOnUpdate',
			'staleEventClears',
		]
			.map(fn)
			.join('\n') +
			source.slice(
				source.indexOf('const CLEAR_ON_UPDATE'),
				source.indexOf('function clearOnUpdate'),
			) +
			'\n;({insert,remove,destroy,layoutWrapChildren,wrapNaturalSize,validateNodeProps,applyCommand})',
		{
			dockLayoutNodesByView: new WeakMap(),
			wrapLayoutNodesByView: new WeakMap(),
			NSUserInterfaceLayoutOrientation: { Horizontal: 0, Vertical: 1 },
			contentViewNodesByView: new WeakMap(),
			disposePressGestures: noop,
			panHandlersByView: new WeakMap(),
			layoutHandlers: new WeakMap(),
			VIEW_PARENT_TYPES: new Set(['contentview', 'stacklayout', 'wraplayout']),
			layoutView: (node: any) => node.view,
			arrangedView: (node: any) => node.marginHost ?? node.view,
			deactivateSizeConstraints: noop,
			syncText: noop,
			syncScheme: noop,
			setLayoutAction: noop,
			isStackLayoutInput: () => false,
			applyAccessibility: noop,
			applyStyle: noop,
		},
	)

	const child = (id: number, props: any = {}) => ({
		id,
		type: 'label',
		container,
		props,
		view: view(),
		children: [],
		parent: null as any,
	})

	const insert = (node: any, parentId = 1, before: number | null = null) =>
		api.insert(container, parentId, node, before)

	const remove = (node: any) => api.remove(container, 1, node)
	const fxRegister = (node: any) => container.nodes.set(node.id, node)
	return {
		parent,
		container,
		child,
		insert,
		remove,
		destroy: api.destroy,
		layout: () => api.layoutWrapChildren(parent),
		natural: () => api.wrapNaturalSize(parent),
		validate: api.validateNodeProps,
		update: (node: any, props: any) => {
			fxRegister(node)
			api.applyCommand(container, { op: 'update', id: node.id, props })
		},
	}
}

const rect = (node: any) =>
	['leading', 'top', 'width', 'height'].map((key) => node.placementPins[key].constant)

test('default horizontal layout wraps at available width using each row maximum height', () => {
	const fx = fixture()
	const a = fx.child(2, { style: { width: 120, height: 10 } })
	const b = fx.child(3, { style: { width: 80, height: 30 } })
	const c = fx.child(4, { style: { width: 50, height: 20 } })

	;[a, b, c].forEach((node) => fx.insert(node))
	assert.deepEqual(
		[rect(a), rect(b), rect(c)],
		[
			[0, 10, 120, 10],
			[120, 0, 80, 30],
			[0, 30, 50, 20],
		],
	)

	assert.deepEqual(JSON.parse(JSON.stringify(fx.natural())), { width: 200, height: 50 })
})

test('vertical layout fills columns using their maximum width', () => {
	const fx = fixture()
	fx.parent.props = { orientation: 'vertical' }
	const a = fx.child(2, { style: { width: 20, height: 60 } })
	const b = fx.child(3, { style: { width: 40, height: 40 } })
	const c = fx.child(4, { style: { width: 30, height: 20 } })

	;[a, b, c].forEach((node) => fx.insert(node))
	assert.deepEqual(
		[rect(a), rect(b), rect(c)],
		[
			[10, 0, 20, 60],
			[0, 60, 40, 40],
			[40, 0, 30, 20],
		],
	)
})

test('positive item lengths create slots, fixed children center and natural children stretch', () => {
	const fx = fixture()
	fx.parent.props = { itemWidth: 80, itemHeight: 30 }
	const a = fx.child(2, { style: { width: 40, height: 10 } }),
		b = fx.child(3),
		c = fx.child(4)

	;[a, b, c].forEach((node) => fx.insert(node))
	assert.deepEqual(
		[rect(a), rect(b), rect(c)],
		[
			[20, 10, 40, 10],
			[80, 0, 80, 30],
			[0, 30, 80, 30],
		],
	)
})

test('zero and removed item lengths restore natural measurement; removed direction restores horizontal', () => {
	const fx = fixture(),
		a = fx.child(2),
		b = fx.child(3),
		c = fx.child(4)

	;[a, b, c].forEach((node) => fx.insert(node))
	fx.update(fx.parent, { orientation: 'vertical', itemWidth: 80, itemHeight: 60 })
	assert.deepEqual(rect(b), [80, 0, 80, 60])
	fx.update(fx.parent, { itemWidth: 0, itemHeight: 0 })
	assert.deepEqual(
		[rect(a), rect(b), rect(c)],
		[
			[0, 0, 40, 20],
			[40, 0, 40, 20],
			[80, 0, 40, 20],
		],
	)

	fx.update(fx.parent, {})
	assert.deepEqual(rect(c), [80, 0, 40, 20])
})

test('padding, margins and alignment consume space inside slots', () => {
	const fx = fixture()
	fx.parent.dockInsets = { left: 10, right: 10, top: 5, bottom: 5 }
	fx.parent.props = { itemWidth: 100, itemHeight: 40 }
	const a = fx.child(2, {
		style: { width: 30, height: 10 },
		horizontalAlignment: 'right',
		verticalAlignment: 'bottom',
	})

	a.marginInsets = { left: 3, right: 7, top: 4, bottom: 6 }
	const b = fx.child(3)
	fx.insert(a)
	fx.insert(b)
	assert.deepEqual(rect(a), [73, 29, 30, 10])
	assert.deepEqual(rect(b), [10, 45, 100, 40])
	a.type = 'contentview'
	fx.update(a, { style: { width: 30, height: 10 } })
	assert.deepEqual(rect(a), [43, 19, 30, 10])
})

test('resize reflows while keeping host and constraint identity', () => {
	const fx = fixture()
	fx.parent.props = { itemWidth: 80, itemHeight: 30 }
	const nodes = [fx.child(2), fx.child(3), fx.child(4)]
	nodes.forEach((node) => fx.insert(node))
	const pins = nodes[2].placementPins
	fx.parent.view.bounds.size.width = 300
	fx.layout()
	assert.deepEqual(rect(nodes[2]), [160, 0, 80, 30])
	assert.equal(nodes[2].placementPins, pins)
	fx.parent.view.bounds.size.width = 100
	fx.layout()
	assert.deepEqual(rect(nodes[2]), [0, 60, 80, 30])
})

test('moves preserve identities and removal reflows remaining children', () => {
	const fx = fixture()
	fx.parent.props = { itemWidth: 80, itemHeight: 30 }
	const a = fx.child(2),
		b = fx.child(3),
		c = fx.child(4)

	;[a, b, c].forEach((node) => fx.insert(node))
	fx.insert(c, 1, 2)
	assert.deepEqual(fx.parent.children, [c, a, b])
	assert.deepEqual(
		[rect(c), rect(a), rect(b)],
		[
			[0, 0, 80, 30],
			[80, 0, 80, 30],
			[0, 30, 80, 30],
		],
	)

	fx.remove(a)
	assert.equal(a.view.superview, null)
	assert.deepEqual(rect(b), [80, 0, 80, 30])
})

test('reparenting releases placement pins and uses the new parent bounds', () => {
	const fx = fixture(),
		a = fx.child(2)

	const second = {
		...fx.parent,
		id: 10,
		view: fx.child(11).view,
		children: [],
		props: { itemWidth: 100, itemHeight: 50 },
	}

	fx.container.nodes.set(10, second)
	fx.insert(a)
	const pins = Object.values(a.placementPins) as any[]
	fx.insert(a, 10)
	assert.equal(a.parent, second)
	assert.equal(a.view.superview, second.view)
	assert.deepEqual(fx.parent.children, [])
	assert.ok(pins.every((pin) => !pin.active))
	assert.deepEqual(rect(a), [0, 0, 100, 50])
})

test('explicit host width determines natural wrapped height before frame assignment', () => {
	const fx = fixture()
	fx.parent.sizeConstraintSpecs = { width: { kind: 'points', points: 80 } }

	;[2, 3, 4].forEach((id) => fx.insert(fx.child(id)))
	assert.deepEqual(JSON.parse(JSON.stringify(fx.natural())), { width: 80, height: 40 })
})

test('percentage sizes use full parent basis and fixed sizes are capped by item slots', () => {
	const fx = fixture()
	fx.parent.dockInsets = { left: 10, right: 10 }
	const a = fx.child(2, { style: { width: '50%', height: 10 } })
	fx.insert(a)
	assert.deepEqual(rect(a), [10, 0, 100, 10])
	fx.parent.props = { itemWidth: 50, itemHeight: 30 }
	fx.layout()
	assert.deepEqual(rect(a), [10, 10, 50, 10])
})

test('invalid direction/item lengths and viewless children fail before tree mutation', () => {
	const fx = fixture()
	assert.throws(() => fx.validate('wraplayout', { orientation: 'diagonal' }), /orientation must/)
	for (const value of [NaN, Infinity, '30']) {
		assert.throws(() => fx.validate('wraplayout', { itemWidth: value }), /finite number/)
		assert.throws(() => fx.validate('wraplayout', { itemHeight: value }), /finite number/)
	}

	const a = fx.child(2)
	a.view = null as any
	assert.throws(() => fx.insert(a), /wraplayout.*text-only/)
	assert.deepEqual(fx.parent.children, [])
})

test('nested layout child updates reconcile both subtree and outer wrap geometry', () => {
	const fx = fixture(),
		a = fx.child(2)

	a.type = 'contentview'
	fx.insert(a)
	fx.update(a, { style: { width: 100, height: 40 } })
	assert.deepEqual(rect(a), [0, 0, 100, 40])
})

test('destroy releases descendant edges and placement pins', () => {
	const fx = fixture(),
		a = fx.child(2)

	fx.insert(a)
	const pins = Object.values(a.placementPins) as any[]
	fx.destroy(fx.parent)
	assert.equal(a.view.superview, null)
	assert.equal(a.parent, null)
	assert.ok(pins.every((pin) => !pin.active))
})

test('negative numeric item lengths retain the upstream natural-size behavior', () => {
	const fx = fixture(),
		a = fx.child(2)

	fx.update(fx.parent, { itemWidth: -1, itemHeight: -10 })
	fx.insert(a)
	assert.deepEqual(rect(a), [0, 0, 40, 20])
})

test('full cross-axis bounds prevent another wrap and retain out-of-bounds child frames', () => {
	const fx = fixture()
	fx.parent.props = { itemWidth: 80, itemHeight: 30 }
	fx.parent.view.bounds.size = { width: 200, height: 40 }
	const nodes = [2, 3, 4, 5, 6].map((id) => fx.child(id))
	nodes.forEach((node) => fx.insert(node))
	assert.deepEqual(rect(nodes[2]), [0, 30, 80, 30])
	assert.deepEqual(rect(nodes[3]), [80, 30, 80, 30])
	assert.deepEqual(rect(nodes[4]), [160, 30, 80, 30])
	fx.parent.view.bounds.size.height = 30
	fx.layout()
	assert.deepEqual(rect(nodes[2]), [0, 30, 80, 30])
})

test('a first oversized item follows the pinned NativeScript measure and layout rules', () => {
	const fx = fixture()
	fx.parent.props = { itemWidth: 250, itemHeight: 30 }
	const a = fx.child(2),
		b = fx.child(3)

	fx.insert(a)
	fx.insert(b)
	assert.deepEqual(rect(a), [0, 0, 250, 30])
	assert.deepEqual(rect(b), [0, 30, 250, 30])
	assert.deepEqual(JSON.parse(JSON.stringify(fx.natural())), { width: 250, height: 90 })
})

test('WrapLayout geometry observer releases on disposal and ignores late callbacks', () => {
	let callback: () => void = () => {}
	const released: any[] = []
	const queued: any[] = []
	const map = new WeakMap()
	const noop = () => {}
	const view = {
		removeFromSuperview: noop,
		setContentCompressionResistancePriorityForOrientation: noop,
	}

	const observer = {}
	const node: any = {
		id: 1,
		type: 'wraplayout',
		props: {},
		children: [],
		parent: null,
		container: { children: [] },
	}

	const api = runInNewContext(
		['makeWrapLayout', 'setWrapSizingPriorities', 'destroy', 'detach', 'releasePlacementPins']
			.map(fn)
			.join('\n') + '\n;({makeWrapLayout,destroy})',
		{
			NSUserInterfaceLayoutOrientation: { Horizontal: 0, Vertical: 1 },
			WrapLayoutView: { alloc: () => ({ initWithFrame: () => view }) },
			wrapLayoutNodesByView: map,
			NSViewFrameDidChangeNotification: 'frame',
			NSNotificationCenter: {
				defaultCenter: {
					addObserverForNameObjectQueueUsingBlock: (
						_name: any,
						_view: any,
						_queue: any,
						handler: () => void,
					) => {
						callback = handler
						return observer
					},
					removeObserver: (value: any) => released.push(value),
				},
			},
			queueLayoutReconcile: (_container: any, parent: any) => {
				if (parent) {
					queued.push(parent)
				}
			},
			layoutView: (value: any) => value.view,
			arrangedView: (value: any) => value.view,
			deactivateSizeConstraints: noop,
			setLayoutAction: noop,
			syncText: noop,
			disposePressGestures: noop,
			panHandlersByView: new WeakMap(),
			layoutHandlers: new WeakMap(),
		},
	)

	node.view = api.makeWrapLayout(node)
	callback()
	assert.deepEqual(queued, [node])
	api.destroy(node)
	assert.deepEqual(released, [observer])
	assert.equal(map.has(view), false)
	assert.equal(node.wrapGeometryObserver, null)
	callback()
	assert.deepEqual(queued, [node])
})

test('WrapLayout flow-axis compression yields to resizing and switches on orientation updates', () => {
	const values = new Map()
	const view = {
		setContentHuggingPriorityForOrientation: () => {},
		setContentCompressionResistancePriorityForOrientation: (priority: number, axis: number) =>
			values.set(axis, priority),
	}

	const api = runInNewContext(fn('setWrapSizingPriorities') + '\n;({setWrapSizingPriorities})', {
		NSUserInterfaceLayoutOrientation: { Horizontal: 0, Vertical: 1 },
	})

	const node = { props: {}, view }
	api.setWrapSizingPriorities(node)
	assert.equal(values.get(0), 250)
	assert.equal(values.get(1), 750)
	node.props = { orientation: 'vertical' }
	api.setWrapSizingPriorities(node)
	assert.equal(values.get(0), 750)
	assert.equal(values.get(1), 250)
	const stackApi = runInNewContext(
		fn('setStackChildPriorities') + '\n;({setStackChildPriorities})',
		{
			NSUserInterfaceLayoutOrientation: { Horizontal: 0, Vertical: 1 },
			nodeClasses: () => [],
			arrangedView: (child: any) => child.view,
			setWrapSizingPriorities: api.setWrapSizingPriorities,
		},
	)

	stackApi.setStackChildPriorities({ view: { orientation: 1 } }, { ...node, type: 'wraplayout' })
	assert.equal(values.get(0), 750)
	assert.equal(values.get(1), 250)
})
