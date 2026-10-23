import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { stripTypeScriptTypes } from 'node:module'
import { test } from 'node:test'
import { runInNewContext } from 'node:vm'

const source = stripTypeScriptTypes(
	readFileSync(new URL('../src/index.ts', import.meta.url), 'utf8'),
)

const fn = (name: string) => {
	const start = source.indexOf(`function ${name}(`)
	return source.slice(start, source.indexOf('\nfunction ', start + 1))
}

const constants = source.slice(
	source.indexOf('const PROXY_LAYOUT_PROPS'),
	source.indexOf('function projectedViews'),
)

function fixture() {
	const noop = () => {}
	const view = () => ({
		superview: null as any,
		subviews: [] as any[],
		bounds: { size: { width: 200, height: 100 } },
		invalidateIntrinsicContentSize: noop,
		addSubview(child: any) {
			child.removeFromSuperview()
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

	const container = {
		nodes: new Map<number, any>(),
		children: [] as any[],
		hostView: view(),
		layoutDirty: null,
	}

	const api = runInNewContext(
		constants +
			[
				'projectedViews',
				'releaseProjectedView',
				'syncProxyProjection',
				'validateProxyTree',
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
				.join('\n') +
			'\n({insert,remove,destroy,syncProxyProjection,validateProxyTree,projectedViews,reconcileLayoutParent})',
		{
		elementBehaviors: new Map(),
		behaviorOf: () => undefined,
		isManualLayoutParent: (t: string) =>
			['gridlayout','liquidglass','absolutelayout','contentview','actionbar','docklayout','wraplayout','rootlayout'].includes(t),
		registerElementType: () => {},
		
			VIEW_PARENT_TYPES: new Set(['wraplayout', 'contentview', 'proxyviewcontainer']),
			layoutView: (node: any) => node.view,
			arrangedView: (node: any) => node.view,
			deactivateSizeConstraints: noop,
			releasePlacementPins: noop,
			syncText: noop,
			syncScheme: noop,
			layoutWrapChildren: noop,
			layoutContentChild: noop,
			disposePressGestures: noop,
			panHandlersByView: new WeakMap(),
			layoutHandlers: new WeakMap(),
			typeHasView: (type: string) => !['proxyviewcontainer', '#text', 'span'].includes(type),
		},
	)

	const node = (id: number, type = 'label', props: any = {}) => {
		const item: any = {
			id,
			type,
			props,
			view: type === 'proxyviewcontainer' ? null : view(),
			children: [],
			parent: null,
			container,
		}

		container.nodes.set(id, item)
		return item
	}

	const parent = node(1, 'wraplayout'),
		other = node(9, 'wraplayout')

	const insert = (child: any, parentId: number | null, before: number | null = null) =>
		api.insert(container, parentId, child, before)

	return { api, node, container, parent, other, insert }
}

test('nested proxies project ordered views without changing logical ownership', () => {
	const f = fixture(),
		proxy = f.node(2, 'proxyviewcontainer'),
		nested = f.node(3, 'proxyviewcontainer')

	const a = f.node(4),
		b = f.node(5),
		c = f.node(6)

	f.insert(proxy, 1)
	f.insert(a, 2)
	f.insert(nested, 2)
	f.insert(b, 3)
	f.insert(c, 1)
	assert.equal(proxy.view, null)
	assert.equal(b.parent, nested)
	assert.equal(b.layoutParent, f.parent)
	assert.deepEqual(Array.from(f.parent.projectedChildren), [a, b, c])
	assert.deepEqual(f.parent.view.subviews, [a.view, b.view, c.view])
	f.insert(nested, 2, 4)
	assert.deepEqual(Array.from(f.parent.projectedChildren), [b, a, c])
})

test('moving a group to another parent releases the old projection and keeps child identity', () => {
	const f = fixture(),
		proxy = f.node(2, 'proxyviewcontainer'),
		a = f.node(3),
		b = f.node(4)

	f.insert(proxy, 1)
	f.insert(a, 2)
	f.insert(b, 2)
	f.insert(proxy, 9)
	assert.deepEqual(f.parent.view.subviews, [])
	assert.deepEqual(f.other.view.subviews, [a.view, b.view])
	assert.equal(a.parent, proxy)
	assert.equal(a.layoutParent, f.other)
})

test('inherited layout props update and restore; authored child values win', () => {
	const f = fixture(),
		proxy = f.node(2, 'proxyviewcontainer', { row: 1, col: 2, dock: 'top', left: 12 })

	const a = f.node(3),
		b = f.node(4, 'label', { row: 3 })

	f.insert(proxy, 1)
	f.insert(a, 2)
	f.insert(b, 2)
	assert.equal(a.props.row, 1)
	assert.equal(b.props.row, 3)
	assert.equal(a.props.dock, 'top')
	assert.equal(a.props.left, 12)
	proxy.props = { row: 2 }
	f.api.syncProxyProjection(f.parent)
	assert.equal(a.props.row, 2)
	assert.equal(a.props.col, undefined)
	assert.equal(a.props.dock, undefined)
	f.insert(a, 9)
	assert.equal(a.props.row, undefined)
	assert.equal(a.view.superview, f.other.view)
})

test('CSS placement inherits, updates, and restores without overriding authored child styles', () => {
	const f = fixture(),
		proxy = f.node(2, 'proxyviewcontainer', {
			style: { gridRow: '2', position: 'absolute', left: 12, color: 'red' },
		}),
		a = f.node(3, 'label', { style: { width: 40 } }),
		b = f.node(4, 'label', { style: { gridRow: '3', height: 20 } })

	f.insert(proxy, 1)
	f.insert(a, 2)
	f.insert(b, 2)
	assert.equal(a.props.style.gridRow, '2')
	assert.equal(a.props.style.position, 'absolute')
	assert.equal(a.props.style.left, 12)
	assert.equal(a.props.style.width, 40)
	assert.equal(a.props.style.color, undefined, 'non-placement styles stay on their author')
	assert.equal(b.props.style.gridRow, '3')
	proxy.props = { style: { gridRow: '4' } }
	f.api.syncProxyProjection(f.parent)
	assert.equal(a.props.style.gridRow, '4')
	assert.equal(a.props.style.position, undefined)
	assert.equal(a.props.style.left, undefined)
	assert.equal(b.props.style.gridRow, '3')
	f.insert(a, 9)
	assert.equal(a.props.style.gridRow, undefined)
	assert.equal(a.props.style.width, 40)
	assert.equal(a.view.superview, f.other.view)
})

test('collapse excludes recursively projected layout children and restoration preserves identity', () => {
	const f = fixture(),
		proxy = f.node(2, 'proxyviewcontainer'),
		nested = f.node(3, 'proxyviewcontainer'),
		a = f.node(4)

	f.insert(proxy, 1)
	f.insert(nested, 2)
	f.insert(a, 3)
	nested.props = { visibility: 'collapse' }
	f.api.syncProxyProjection(f.parent)
	assert.equal(a.view.superview, null)
	nested.props = {}
	f.api.syncProxyProjection(f.parent)
	assert.equal(a.view.superview, f.parent.view)
})

test('removal and disposal release projected descendants and logical edges', () => {
	const f = fixture(),
		proxy = f.node(2, 'proxyviewcontainer'),
		a = f.node(3)

	f.insert(proxy, 1)
	f.insert(a, 2)
	f.api.remove(f.container, 1, proxy)
	assert.equal(a.view.superview, null)
	assert.equal(a.parent, proxy)
	f.insert(proxy, 9)
	assert.equal(a.view.superview, f.other.view)
	f.api.destroy(proxy)
	assert.equal(proxy.parent, null)
	assert.equal(a.parent, null)
	assert.equal(a.view.superview, null)
	assert.deepEqual(Array.from(proxy.children), [])
})

test('preflight rejects a second nested projected ContentView child before mutation', () => {
	const f = fixture(),
		content = f.node(8, 'contentview'),
		proxy = f.node(2, 'proxyviewcontainer'),
		a = f.node(3),
		b = f.node(4)

	f.insert(proxy, 8)
	f.insert(a, 2)
	const command = { op: 'insert', id: b.id, parent: proxy.id, before: null }
	assert.throws(() => f.api.validateProxyTree(f.container, [command]), /contentview.*multiple/)
	assert.equal(b.parent, null)
	assert.equal(content.view.subviews.length, 1)
	f.api.validateProxyTree(f.container, [{ op: 'remove', id: a.id, parent: proxy.id }, command])
})

test('preflight detects children inserted after a newly created empty proxy', () => {
	const f = fixture()
	f.node(8, 'contentview')
	assert.throws(
		() =>
			f.api.validateProxyTree(f.container, [
				{ op: 'create', id: 2, type: 'proxyviewcontainer', props: {} },
				{ op: 'create', id: 3, type: 'label', props: {} },
				{ op: 'create', id: 4, type: 'label', props: {} },
				{ op: 'insert', id: 2, parent: 8, before: null },
				{ op: 'insert', id: 3, parent: 2, before: null },
				{ op: 'insert', id: 4, parent: 2, before: null },
			]),
		/contentview.*multiple/,
	)
})

test('batched group reparenting cannot detach the new parent projection while draining the old one', () => {
	const f = fixture(),
		proxy = f.node(2, 'proxyviewcontainer'),
		a = f.node(3)

	f.insert(proxy, 1)
	f.insert(a, 2)
	f.container.layoutDirty = new Set() as any
	f.insert(proxy, 9)
	f.api.reconcileLayoutParent(f.other)
	f.api.reconcileLayoutParent(f.parent)
	assert.equal(a.view.superview, f.other.view)
	assert.equal(a.layoutParent, f.other)
	assert.deepEqual(f.parent.view.subviews, [])
})

test('empty logical containers occupy no native child slot and can gain or lose children', () => {
	const f = fixture(),
		proxy = f.node(2, 'proxyviewcontainer'),
		a = f.node(3)

	f.insert(proxy, 1)
	assert.equal(f.parent.view.subviews.length, 0)
	f.insert(a, 2)
	assert.equal(f.parent.view.subviews.length, 1)
	f.api.remove(f.container, 2, a)
	assert.equal(f.parent.view.subviews.length, 0)
	assert.equal(proxy.view, null)
	assert.equal(proxy.parent, f.parent)
})

test('proxy chains reject ownership cycles rather than recursing during native apply', () => {
	const f = fixture(),
		a = f.node(2, 'proxyviewcontainer'),
		b = f.node(3, 'proxyviewcontainer')

	f.insert(a, 1)
	f.insert(b, 2)
	assert.throws(
		() => f.api.validateProxyTree(f.container, [{ op: 'move', id: 2, parent: 3, before: null }]),
		/ownership cycle/,
	)

	assert.equal(a.parent, f.parent)
})
