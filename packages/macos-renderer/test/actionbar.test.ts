import assert from 'node:assert/strict'
import { test } from 'node:test'
import { runInNewContext } from 'node:vm'
import { sourceWithoutImports } from './mock-globals.ts'

const source = sourceWithoutImports(new URL('../src/index.ts', import.meta.url))
function fn(name: string) {
	const start = source.indexOf(`function ${name}(`)
	assert.ok(start >= 0)
	return source.slice(start, source.indexOf('\nfunction ', start + 1))
}

function fixture() {
	const view = () => ({
		stringValue: '',
		superview: null as any,
		layer: {} as any,
		isDescendantOf: () => false,
		addSubview(child: any) {
			child.superview = this
		},
		removeFromSuperview() {
			this.superview = null
		},
	})

	const placements: any[] = [],
		released: any[] = []

	const api = runInNewContext(
		fn('validateActionBarTitleView') +
			'\n' +
			fn('setActionBarTitleView') +
			'\n' +
			fn('syncActionBar') +
			'\n;({syncActionBar,setActionBarTitleView})',
		{
		elementBehaviors: new Map(),
		behaviorOf: () => undefined,
		isManualLayoutParent: (t: string) =>
			['gridlayout','liquidglass','absolutelayout','contentview','actionbar','docklayout','wraplayout','rootlayout'].includes(t),
		registerElementType: () => {},
		
			ownedRoots: new WeakMap(),
			nodeContainersByView: new WeakMap(),
			releasePlacementPins: (child: any) => released.push(child),
			layoutContentChild: (parent: any) => placements.push(parent),
		},
	)

	const node: any = {
		type: 'actionbar',
		props: { title: 'First' },
		view: view(),
		actionBarTitle: view(),
	}

	return {
		node,
		view,
		placements,
		released,
		setTitle: (view: any) => api.setActionBarTitleView(node, view),
		sync: () => api.syncActionBar(node),
	}
}

test('ActionBar title updates reuse the label; flat removal restores shadow', () => {
	const f = fixture()
	f.sync()
	const title = f.node.actionBarDisplay
	assert.equal(title.view, f.node.actionBarTitle)
	assert.equal(title.view.stringValue, 'First')
	assert.equal(title.view.superview, f.node.view)
	assert.equal(f.node.view.layer.shadowOpacity, 0.2)
	f.node.props = { title: 'Next', flat: true }
	f.sync()
	assert.equal(f.node.actionBarDisplay, title)
	assert.equal(title.view.stringValue, 'Next')
	assert.equal(f.node.view.layer.shadowOpacity, 0)
	f.node.props = {}
	f.sync()
	assert.equal(title.view.stringValue, '')
	assert.equal(f.node.view.layer.shadowOpacity, 0.2)
})

test('ActionBar replaces and releases external titleView and restores plain title', () => {
	const f = fixture()
	f.sync()
	const old = f.node.actionBarDisplay
	const external = f.view()
	f.node.actionBarExternal = external
	f.sync()
	assert.equal(old.view.superview, null)
	assert.ok(f.released.includes(old))
	assert.equal(external.superview, f.node.view)
	assert.equal(f.node.actionBarDisplay.view, external)
	f.node.actionBarExternal = null
	f.sync()
	assert.equal(external.superview, null)
	assert.equal(f.node.actionBarTitle.superview, f.node.view)
})

test('ActionBar JSX child replaces fallback and keeps its own placement data', () => {
	const f = fixture()
	f.sync()
	const child = { view: f.view(), props: {} }
	child.view.superview = f.node.view
	f.node.contentChild = child
	f.sync()
	assert.equal(f.node.actionBarTitle.superview, null)
	assert.equal(f.placements.at(-1), f.node)
	assert.equal(f.node.contentChild, child)
	f.node.contentChild = null
	f.sync()
	assert.equal(f.node.actionBarTitle.superview, f.node.view)
})

test('ActionBar rejects stealing an attached title view and hierarchy cycles', () => {
	const f = fixture()
	const external = f.view()
	external.superview = f.view()
	f.node.actionBarExternal = external
	assert.throws(f.sync, /already belongs/)
	f.node.actionBarExternal = f.node.view
	assert.throws(f.sync, /cycle/)
})

test('invalid external ownership preserves the current title and placement', () => {
	const f = fixture()
	f.sync()
	const retained = f.node.actionBarDisplay
	const foreign = f.view()
	foreign.superview = f.view()
	f.node.actionBarExternal = foreign
	assert.throws(f.sync, /already belongs/)
	assert.equal(f.node.actionBarDisplay, retained)
	assert.equal(retained.view.superview, f.node.view)
	assert.equal(f.released.length, 0)
})

test('a raw view without intrinsic metrics retains its supplied dimensions', () => {
	const f = fixture()
	const raw: any = f.view()
	raw.intrinsicContentSize = { width: -1, height: -1 }
	raw.frame = { size: { width: 80, height: 24 } }
	f.node.actionBarExternal = raw
	f.sync()
	assert.deepEqual({ ...f.node.actionBarDisplay.props.style }, { width: 80, height: 24 })
})

test('ActionBar rejects non-NSView titleView values during prop preflight', () => {
	class NSView {}
	const validate = runInNewContext(fn('validateNodeProps') + '\n;validateNodeProps', {
		elementBehaviors: new Map(),
		behaviorOf: () => undefined,
		isManualLayoutParent: (t: string) =>
			['gridlayout','liquidglass','absolutelayout','contentview','actionbar','docklayout','wraplayout','rootlayout'].includes(t),
		registerElementType: () => {},
		 NSView })
	for (const titleView of ['text', {}, true, 5]) {
		assert.throws(() => validate('actionbar', { titleView }), /titleView must be an AppKit NSView/)
	}
})

test('assigning the active JSX titleView keeps the same slot and placement', () => {
	const f = fixture()
	const child = { view: f.view(), props: {} }
	child.view.superview = f.node.view
	f.node.contentChild = child
	f.setTitle(child.view)
	assert.equal(f.node.contentChild, child)
	assert.equal(f.node.actionBarExternal, null)
	assert.equal(child.view.superview, f.node.view)
	assert.equal(f.released.length, 0)
})
