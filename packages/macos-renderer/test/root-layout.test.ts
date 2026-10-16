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
		subviews: Object.assign([] as any[], {
			get count() {
				return this.length
			},
			objectAtIndex(index: number) {
				return this[index]
			},
		}),
		superview: null as any,
		leadingAnchor: anchor(),
		topAnchor: anchor(),
		widthAnchor: anchor(),
		heightAnchor: anchor(),
		invalidateIntrinsicContentSize: noop,
		addSubviewPositionedRelativeTo(child: any, _position: number, previous: any) {
			child.removeFromSuperview()
			this.subviews.splice(previous ? this.subviews.indexOf(previous) + 1 : 0, 0, child)
			child.superview = this
		},
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

	const parent: any = {
		id: 1,
		type: 'rootlayout',
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
			'layoutRootChildren',
			'rootNaturalSize',
			'layoutContentChild',
			'dockChildSize',
			'dockNaturalSize',
			'detach',
			'queueLayoutReconcile',
			'reconcileLayoutParent',
			'parentReference',
			'resolveParentNode',
			'canContainView',
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
			'\n;({insert,remove,destroy,layoutRootChildren,rootNaturalSize,validateNodeProps,applyCommand})',
		{
			dockLayoutNodesByView: new WeakMap(),
			rootLayoutNodesByView: new WeakMap(),
			contentViewNodesByView: new WeakMap(),
			disposePressGestures: noop,
			panHandlersByView: new WeakMap(),
			layoutHandlers: new WeakMap(),
			VIEW_PARENT_TYPES: new Set(['contentview', 'stacklayout', 'docklayout', 'rootlayout']),
			layoutView: (node: any) => node.view,
			arrangedView: (node: any) => node.marginHost ?? node.view,
			deactivateSizeConstraints: noop,
			syncText: noop,
			syncLabelOverflow: noop,
			syncScheme: noop,
			setLayoutAction: noop,
			isStackLayoutInput: () => false,
			applyAccessibility: noop,
			applyStyle: noop,
		},
	)

	const child = (id: number, props: any = {}) => ({
		id,
		type: 'contentview',
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
		layout: () => api.layoutRootChildren(parent),
		natural: () => api.rootNaturalSize(parent),
		validate: api.validateNodeProps,
		update: (node: any, props: any) => {
			fxRegister(node)
			api.applyCommand(container, { op: 'update', id: node.id, props })
		},
	}
}

const rect = (node: any) =>
	['leading', 'top', 'width', 'height'].map((key) => node.placementPins[key].constant)

test('default single cell overlaps all children and clamps attached indices to that cell', () => {
	const fx = fixture(),
		a = fx.child(2),
		b = fx.child(3, { row: 12, col: 9, rowSpan: 4 })

	fx.insert(a)
	fx.insert(b)
	assert.deepEqual(rect(a), [0, 0, 200, 100])
	assert.deepEqual(rect(b), [0, 0, 200, 100])
})

test('padding, margins, percentages, fixed and natural alignment update without replacing pins', () => {
	const fx = fixture(),
		a = fx.child(2, { style: { width: 40, height: 20 } })

	fx.parent.dockInsets = { top: 10, right: 20, bottom: 10, left: 20 }
	a.marginInsets = { left: 5, right: 15, top: 3, bottom: 7 }
	fx.insert(a)
	assert.deepEqual(rect(a), [75, 38, 40, 20])
	const pins = a.placementPins
	fx.update(a, {
		horizontalAlignment: 'right',
		verticalAlignment: 'bottom',
		style: { width: '50%', height: '40%' },
	})

	assert.deepEqual(rect(a), [65, 43, 100, 40])
	fx.update(a, { horizontalAlignment: 'left', verticalAlignment: 'top', style: undefined })
	assert.deepEqual(rect(a), [25, 13, 40, 20])
	fx.update(a, {})
	assert.deepEqual(rect(a), [25, 13, 140, 70])
	assert.equal(a.placementPins, pins)
	fx.parent.dockInsets = {}
	a.marginInsets = {}
	fx.parent.view.bounds.size = { width: 300, height: 150 }
	fx.layout()
	assert.deepEqual(rect(a), [0, 0, 300, 150])
})

test('natural size measures maximum extents, rather than adding overlapping children', () => {
	const fx = fixture(),
		a = fx.child(2, { style: { width: 40, height: 30 } }),
		b = fx.child(3, { style: { width: 80, height: 20 } })

	fx.parent.dockInsets = { top: 3, right: 5, bottom: 7, left: 5 }
	a.marginInsets = { top: 5, bottom: 5 }
	fx.insert(a)
	fx.insert(b)
	assert.equal(fx.natural().width, 90)
	assert.equal(fx.natural().height, 50)
})

test('moves honor before edges and keep native back-to-front order and identity', () => {
	const fx = fixture(),
		a = fx.child(2),
		b = fx.child(3),
		c = fx.child(4)

	fx.insert(a)
	fx.insert(b)
	fx.insert(c)
	fx.insert(c, 1, 2)
	assert.deepEqual(fx.parent.children, [c, a, b])
	assert.deepEqual(Array.from(fx.parent.view.subviews), [c.view, a.view, b.view])
	fx.insert(a)
	assert.deepEqual(Array.from(fx.parent.view.subviews), [c.view, b.view, a.view])
})

test('reparenting and teardown release old constraints, retained children and host lookup', () => {
	const fx = fixture(),
		a = fx.child(2)

	fx.insert(a)
	const oldPins = Object.values(a.placementPins) as any[]
	const other = { ...fx.parent, id: 9, children: [], view: fx.child(10).view }
	fx.container.nodes.set(9, other)
	fx.insert(a, 9)
	assert.ok(oldPins.every((pin) => !pin.active))
	assert.equal(a.view.superview, other.view)
	assert.equal(fx.parent.children.length, 0)
	fx.destroy(other)
	assert.equal(a.view.superview, null)
	assert.equal(a.parent, null)
	assert.equal(a.placementPins, null)
})

test('invalid viewless child fails before detaching from its existing parent', () => {
	const fx = fixture(),
		a = fx.child(2)

	a.view = null as any
	a.parent = { children: [a] } as any
	assert.throws(() => fx.insert(a), /rootlayout.*text-only/)
	assert.deepEqual(a.parent.children, [a])
})

test('RootLayout geometry observer releases on disposal and ignores late callbacks', () => {
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
		type: 'rootlayout',
		props: {},
		children: [],
		parent: null,
		container: { children: [] },
	}

	const api = runInNewContext(
		['makeRootLayout', 'destroy', 'detach', 'releasePlacementPins'].map(fn).join('\n') +
			'\n;({makeRootLayout,destroy})',
		{
			NSUserInterfaceLayoutOrientation: { Horizontal: 0, Vertical: 1 },
			RootLayoutView: { alloc: () => ({ initWithFrame: () => view }) },
			rootLayoutNodesByView: map,
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

	node.view = api.makeRootLayout(node)
	callback()
	assert.deepEqual(queued, [node])
	api.destroy(node)
	assert.deepEqual(released, [observer])
	assert.equal(map.has(view), false)
	assert.equal(node.rootGeometryObserver, null)
	callback()
	assert.deepEqual(queued, [node])
})
