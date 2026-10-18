import assert from 'node:assert/strict'
import { test } from 'node:test'
import { runInNewContext } from 'node:vm'
import { sourceWithoutImports } from './mock-globals.ts'

// Exercise the production slot and placement paths, not a replica of them.
const source = sourceWithoutImports(new URL('../src/index.ts', import.meta.url))

const fn = (name: string) => {
	const start = source.indexOf(`function ${name}(`)
	const rest = source.slice(start)
	return rest.slice(0, rest.search(/\n(?:export )?(?:function |class |const )/))
}

function fixture(type = 'contentview') {
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
		type,
		props: {},
		view: view(),
		children: [] as any[],
		contentChild: null as any,
	}

	const container = { nodes: new Map([[1, parent]]), children: [] }
	const api = runInNewContext(
		[
			'layoutLength',
			'pinLayoutChild',
			'releasePlacementPins',
			'layoutContentChild',
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
		]
			.map(fn)
			.join('\n') + '\n({insert,remove,destroy,layoutContentChild})',
		{
		elementBehaviors: new Map(),
		behaviorOf: () => undefined,
		isManualLayoutParent: (t: string) =>
			['gridlayout','liquidglass','absolutelayout','contentview','actionbar','docklayout','wraplayout','rootlayout'].includes(t),
		registerElementType: () => {},
		
			contentViewNodesByView: new WeakMap(),
			disposePressGestures: noop,
			panHandlersByView: new WeakMap(),
			layoutHandlers: new WeakMap(),
			VIEW_PARENT_TYPES: new Set(['contentview', 'actionbar', 'stacklayout']),
			layoutView: (node: any) => node.view,
			deactivateSizeConstraints: noop,
			syncText: noop,
			syncActionBar: noop,
			syncScheme: noop,
			setLayoutAction: noop,
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

	const insert = (node: any, parentId = 1) => api.insert(container, parentId, node, null)
	const remove = (node: any) => api.remove(container, 1, node)
	return {
		parent,
		container,
		child,
		insert,
		remove,
		destroy: api.destroy,
		layout: () => api.layoutContentChild(parent),
	}
}

const rect = (node: any) =>
	['leading', 'top', 'width', 'height'].map((key) => node.placementPins[key].constant)

test('content slot replacement detaches the old view and deactivates its constraints', () => {
	const fx = fixture(),
		a = fx.child(2),
		b = fx.child(3)

	fx.insert(a)
	const pins = Object.values(a.placementPins) as any[]
	fx.insert(b)
	assert.equal(a.view.superview, null)
	assert.ok(pins.every((pin) => !pin.active))
	assert.equal(a.placementPins, null)
	assert.deepEqual(fx.parent.view.subviews, [b.view])
	assert.equal(fx.parent.contentChild, b)
	assert.deepEqual(fx.parent.children, [a, b])
})

test('removing a superseded child does not clear the current content', () => {
	const fx = fixture(),
		a = fx.child(2),
		b = fx.child(3)

	fx.insert(a)
	fx.insert(b)
	fx.remove(a)
	assert.equal(fx.parent.contentChild, b)
	assert.deepEqual(fx.parent.view.subviews, [b.view])
	assert.equal(b.view.superview, fx.parent.view)
})

test('removing the current child empties the slot without reviving older content', () => {
	const fx = fixture(),
		a = fx.child(2),
		b = fx.child(3)

	fx.insert(a)
	fx.insert(b)
	fx.remove(b)
	assert.equal(fx.parent.contentChild, null)
	assert.deepEqual(fx.parent.view.subviews, [])
	assert.equal(a.view.superview, null)
})

test('moving an already current child preserves exactly one native child', () => {
	const fx = fixture(),
		a = fx.child(2)

	fx.insert(a)
	fx.insert(a)
	assert.deepEqual(fx.parent.children, [a])
	assert.deepEqual(fx.parent.view.subviews, [a.view])
})

test('text-only insertion rejects before detaching its existing parent', () => {
	const fx = fixture(),
		a = fx.child(2)

	a.view = null as any
	a.parent = { children: [a] } as any
	assert.throws(() => fx.insert(a), /contentview.*text-only/)
	assert.deepEqual(a.parent.children, [a])
	assert.equal(fx.parent.contentChild, null)
})

test('default content stretches; explicit sizes center; alignment and margins update pins', () => {
	const fx = fixture(),
		a = fx.child(2)

	fx.insert(a)
	assert.deepEqual(rect(a), [0, 0, 200, 100])
	const oldPins = { ...a.placementPins }
	a.props = { style: { width: 40, height: 20 } }
	fx.layout()
	assert.deepEqual(rect(a), [80, 40, 40, 20])
	a.props = {
		horizontalAlignment: 'right',
		verticalAlignment: 'bottom',
		style: { width: 40, height: 20 },
	}

	a.marginInsets = { right: 5, bottom: 7 } as any
	fx.layout()
	assert.deepEqual(rect(a), [155, 73, 40, 20])
	assert.equal(a.placementPins.leading, oldPins.leading)
	a.props = {}
	a.marginInsets = {} as any
	fx.parent.view.bounds.size = { width: 300, height: 150 }
	fx.layout()
	assert.deepEqual(rect(a), [0, 0, 300, 150])
})

test('percentage child size resolves against the current host bounds', () => {
	const fx = fixture(),
		a = fx.child(2, { style: { width: '50%', height: '40%' } })

	fx.insert(a)
	assert.deepEqual(rect(a), [50, 30, 100, 40])
})

test('destroying a retained child releases its native parent and placement pins', () => {
	const fx = fixture(),
		a = fx.child(2)

	fx.insert(a)
	const pins = Object.values(a.placementPins) as any[]
	fx.destroy(a)
	assert.equal(a.parent, null)
	assert.equal(a.view.superview, null)
	assert.equal(a.placementPins, null)
	assert.ok(pins.every((pin) => !pin.active))
	assert.equal(fx.parent.contentChild, null)
})

for (const type of ['contentview', 'actionbar']) {
	test(type + ' preserves the active slot when older children are removed', () => {
		const f = fixture(type),
			a = f.child(2),
			b = f.child(3)

		f.insert(a)
		f.insert(b)
		f.remove(a)
		assert.equal(f.parent.contentChild, b)
		assert.equal(a.view.superview, null)
		assert.equal(b.view.superview, f.parent.view)
		f.remove(b)
		assert.equal(f.parent.contentChild, null)
	})
}

test('ActionBar custom title content centers naturally and accepts explicit alignment', () => {
	const f = fixture('actionbar'),
		a = f.child(2)

	f.insert(a)
	f.layout()
	assert.deepEqual(rect(a), [80, 40, 40, 20])
	a.props = { horizontalAlignment: 'right', verticalAlignment: 'top' }
	f.layout()
	assert.deepEqual(rect(a), [160, 0, 40, 20])
})
