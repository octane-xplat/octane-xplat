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
		type: 'docklayout',
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
			'layoutDockChildren',
			'layoutContentChild',
			'dockChildSize',
			'dockNaturalSize',
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
			'droppedPropClears',
		]
			.map(fn)
			.join('\n') +
			source.slice(
				source.indexOf('const CLEAR_ON_UPDATE'),
				source.indexOf('function clearOnUpdate'),
			) +
			'\n;({insert,remove,destroy,layoutDockChildren,dockNaturalSize,validateNodeProps,applyCommand})',
		{
			dockLayoutNodesByView: new WeakMap(),
			contentViewNodesByView: new WeakMap(),
			disposePressGestures: noop,
			panHandlersByView: new WeakMap(),
			layoutHandlers: new WeakMap(),
			VIEW_PARENT_TYPES: new Set(['contentview', 'stacklayout', 'docklayout']),
			layoutView: (node: any) => node.view,
			arrangedView: (node: any) => node.marginHost ?? node.view,
			deactivateSizeConstraints: noop,
			syncText: noop,
			syncScheme: noop,
			setLayoutAction: noop,
			isStackLayoutInput: () => false,
			applyAccessibility: noop,
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
		layout: () => api.layoutDockChildren(parent),
		natural: () => api.dockNaturalSize(parent),
		validate: api.validateNodeProps,
		update: (node: any, props: any) => {
			fxRegister(node)
			api.applyCommand(container, { op: 'update', id: node.id, props })
		},
	}
}

const rect = (node: any) =>
	['leading', 'top', 'width', 'height'].map((key) => node.placementPins[key].constant)

test('ordered top/right/bottom/left strips leave the final child the remaining rectangle', () => {
	const fx = fixture()
	const children = [
		fx.child(2, { dock: 'top', style: { height: 10 } }),
		fx.child(3, { dock: 'right', style: { width: 30 } }),
		fx.child(4, { dock: 'bottom', style: { height: 15 } }),
		fx.child(5, { dock: 'left', style: { width: 20 } }),
		fx.child(6),
	]

	children.forEach((child) => fx.insert(child))
	assert.deepEqual(children.map(rect), [
		[0, 0, 200, 10],
		[170, 10, 30, 90],
		[0, 85, 170, 15],
		[0, 10, 20, 75],
		[20, 10, 150, 75],
	])
})

test('stretchLastChild false, updates and removal restore true; removed dock restores left', () => {
	const fx = fixture(),
		a = fx.child(2, { dock: 'top' })

	fx.parent.props = { stretchLastChild: false } as any
	fx.insert(a)
	assert.deepEqual(rect(a), [0, 0, 200, 20])
	fx.parent.props = {}
	fx.layout()
	assert.deepEqual(rect(a), [0, 0, 200, 100])
	fx.parent.props = { stretchLastChild: false } as any
	a.props = {}
	fx.layout()
	assert.deepEqual(rect(a), [0, 0, 40, 100])
})

test('fixed and natural sizing, alignment and margins match the measure/layout slot rules', () => {
	const fx = fixture(),
		a = fx.child(2, { dock: 'left', style: { width: 30, height: 20 } }),
		b = fx.child(3)

	a.marginInsets = { left: 3, right: 7, top: 4, bottom: 6 }
	fx.insert(a)
	fx.insert(b)
	assert.deepEqual(rect(a), [3, 39, 30, 20])
	assert.deepEqual(rect(b), [40, 0, 160, 100])
	a.props = { dock: 'left', horizontalAlignment: 'right', verticalAlignment: 'top' }
	fx.layout()
	assert.deepEqual(rect(a), [3, 4, 40, 20])
	assert.deepEqual(rect(b), [50, 0, 150, 100])
	a.marginInsets = {}
	fx.layout()
	assert.deepEqual(rect(b), [40, 0, 160, 100])
})

test('resize recalculates remaining space while preserving placement constraint identity', () => {
	const fx = fixture(),
		a = fx.child(2, { dock: 'right', style: { width: 50 } }),
		b = fx.child(3)

	fx.insert(a)
	fx.insert(b)
	const pins = { ...a.placementPins }
	fx.parent.view.bounds.size = { width: 300, height: 150 }
	fx.layout()
	assert.deepEqual(rect(a), [250, 0, 50, 150])
	assert.deepEqual(rect(b), [0, 0, 250, 150])
	assert.equal(a.placementPins.leading, pins.leading)
})

test('keyed moves change strip consumption order without recreating children', () => {
	const fx = fixture(),
		a = fx.child(2, { dock: 'top', style: { height: 10 } }),
		b = fx.child(3, { dock: 'left', style: { width: 30 } }),
		c = fx.child(4)

	fx.insert(a)
	fx.insert(b)
	fx.insert(c)
	fx.insert(b, 1, 2)
	assert.deepEqual(fx.parent.children, [b, a, c])
	assert.deepEqual(
		[rect(b), rect(a), rect(c)],
		[
			[0, 0, 30, 100],
			[30, 0, 170, 10],
			[30, 10, 170, 90],
		],
	)

	fx.remove(b)
	assert.equal(b.view.superview, null)
	assert.equal(b.placementPins, null)
	assert.deepEqual(rect(c), [0, 10, 200, 90])
})

test('reparenting releases old pins and recomputes the new DockLayout geometry', () => {
	const fx = fixture(),
		a = fx.child(2)

	const second = { ...fx.parent, id: 10, view: fx.child(11).view, children: [] }
	second.view.bounds.size = { width: 300, height: 120 }
	fx.container.nodes.set(10, second)
	fx.insert(a)
	const pins = Object.values(a.placementPins) as any[]
	fx.insert(a, 10)
	assert.equal(a.parent, second)
	assert.equal(a.view.superview, second.view)
	assert.deepEqual(fx.parent.children, [])
	assert.ok(pins.every((pin) => !pin.active))
	assert.deepEqual(rect(a), [0, 0, 300, 120])
})

test('natural host size combines ordered edges and padding instead of summing one stack axis', () => {
	const fx = fixture()
	fx.parent.dockInsets = { left: 5, right: 5, top: 3, bottom: 3 } as any
	fx.insert(fx.child(2, { dock: 'top', style: { width: 100, height: 10 } }))
	fx.insert(fx.child(3, { dock: 'left', style: { width: 30, height: 50 } }))
	fx.insert(fx.child(4, { style: { width: 40, height: 20 } }))
	assert.deepEqual(JSON.parse(JSON.stringify(fx.natural())), { width: 110, height: 66 })
})

test('percentages use full content basis, explicit oversized lengths cap to the remaining slot', () => {
	const fx = fixture(),
		a = fx.child(2, { dock: 'left', style: { width: 50 } }),
		b = fx.child(3, { dock: 'right', style: { width: '50%' } }),
		c = fx.child(4)

	fx.insert(a)
	fx.insert(b)
	fx.insert(c)
	assert.deepEqual(rect(b), [100, 0, 100, 100])
	assert.deepEqual(rect(c), [50, 0, 50, 100])
	b.props.style.width = 500
	fx.layout()
	assert.deepEqual(rect(b), [50, 0, 150, 100])
	assert.deepEqual(rect(c), [50, 0, 0, 100])
})

test('invalid primitive props and viewless children fail explicitly before tree mutation', () => {
	const fx = fixture(),
		a = fx.child(2)

	assert.throws(() => fx.validate('docklayout', { stretchLastChild: 'false' }), /must be boolean/)
	assert.throws(() => fx.validate('label', { dock: 'center' }), /dock must be/)
	a.view = null as any
	assert.throws(() => fx.insert(a), /docklayout.*text-only/)
	assert.deepEqual(fx.parent.children, [])
})

test('destroy releases observer, descendant edges and placement constraints', () => {
	const fx = fixture(),
		a = fx.child(2)

	fx.insert(a)
	const pins = Object.values(a.placementPins) as any[]
	fx.destroy(fx.parent)
	assert.equal(a.view.superview, null)
	assert.equal(a.parent, null)
	assert.ok(pins.every((pin) => !pin.active))
})

test('complete prop-bag updates clear stretch and dock defaults through production applyCommand', () => {
	const fx = fixture(),
		a = fx.child(2)

	a.type = 'contentview'
	fx.update(fx.parent, { stretchLastChild: false })
	fx.insert(a)
	assert.deepEqual(rect(a), [0, 0, 40, 100])
	fx.update(a, { dock: 'top' })
	assert.deepEqual(rect(a), [0, 0, 200, 20])
	fx.update(a, {})
	assert.deepEqual(rect(a), [0, 0, 40, 100])
	fx.update(fx.parent, {})
	assert.deepEqual(rect(a), [0, 0, 200, 100])
})

test('DockLayout geometry observer releases on disposal and ignores late callbacks', () => {
	let callback: () => void = () => {}
	const released: any[] = []
	const queued: any[] = []
	const map = new WeakMap()
	const noop = () => {}
	const view = { removeFromSuperview: noop }
	const observer = {}
	const node: any = {
		id: 1, type: 'docklayout', props: {}, children: [], parent: null,
		container: { children: [] },
	}

	const api = runInNewContext(
		['makeDockLayout', 'destroy', 'detach', 'releasePlacementPins'].map(fn).join('\n') + '\n;({makeDockLayout,destroy})',
		{
			DockLayoutView: { alloc: () => ({initWithFrame: () => view}) },
			dockLayoutNodesByView: map,
			NSViewFrameDidChangeNotification: 'frame',
			NSNotificationCenter: {defaultCenter: {
				addObserverForNameObjectQueueUsingBlock: (_name: any, _view: any, _queue: any, handler: () => void) => { callback = handler; return observer },
				removeObserver: (value: any) => released.push(value),
			}},
			queueLayoutReconcile: (_container: any, parent: any) => { if (parent) { queued.push(parent) } },
			layoutView: (value: any) => value.view,
			arrangedView: (value: any) => value.view,
			deactivateSizeConstraints: noop, setLayoutAction: noop, syncText: noop,
			disposePressGestures: noop, panHandlersByView: new WeakMap(), layoutHandlers: new WeakMap(),
		},
	)

	node.view = api.makeDockLayout(node)
	callback()
	assert.deepEqual(queued, [node])
	api.destroy(node)
	assert.deepEqual(released, [observer])
	assert.equal(map.has(view), false)
	assert.equal(node.dockGeometryObserver, null)
	callback()
	assert.deepEqual(queued, [node])
})

test('percentage dimensions use the full parent measure spec even inside padding', () => {
	const fx = fixture(), a = fx.child(2, {dock:'left',style:{width:'50%'}}), b = fx.child(3)
	fx.parent.dockInsets = {left:10,right:10,top:10,bottom:10} as any
	fx.insert(a); fx.insert(b)
	assert.deepEqual(rect(a), [10,10,100,80])
	assert.deepEqual(rect(b), [110,10,80,80])
})
