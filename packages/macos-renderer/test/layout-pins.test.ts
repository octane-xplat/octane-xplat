import assert from 'node:assert/strict'
import { createStickyPlacements } from '../src/sticky-placement.ts'
import { test } from 'node:test'
import { runSlice } from './mock-globals.ts'
import { sourceWithoutImports } from './mock-globals.ts'

// Exercise the placement-pin contract without the Objective-C bridge.
// Children are translates=false views, so every layout path (mason apply,
// root/content fill) must express each computed rect as parent-anchored
// constraints — an imperative frame write is discarded by the next Auto
// Layout solve.
const source = sourceWithoutImports(new URL('../src/index.ts', import.meta.url))

const layout =
	source.slice(source.indexOf('function layoutView('), source.indexOf('function setMarginStyle')) +
	source.slice(
		source.indexOf('function pinLayoutChild'),
		source.indexOf('// Width/height percentages use the parent'),
	)

const retained = new Map<object, any>()
const stickyPlacements = createStickyPlacements<any>({
	nodeFor: (view) => retained.get(view), valid: (node, view) => retained.get(view) === node,
	convert: (_node, base) => ({ x: base.x, width: base.width, rowX: 0, rowWidth: 1000 }),
	repin: (node, base) => pinLayoutChild(node, base.parent, base.x, base.y, base.width, base.height),
	order() {}, invalidate() {},
})
const { pinLayoutChild, releasePlacementPins } = runSlice(
	layout + '\n({ pinLayoutChild, releasePlacementPins })',
	{ queueMicrotask: undefined, stickyPlacements },
)

function anchor() {
	return {
		constraintEqualToAnchorConstant: (_other, constant) => ({ active: false, constant }),
		constraintEqualToConstant: (constant) => ({ active: false, constant }),
	}
}

function view() {
	return {
		leadingAnchor: anchor(),
		topAnchor: anchor(),
		widthAnchor: anchor(),
		heightAnchor: anchor(),
	}
}

function child(id: string) {
	return { id, props: {}, view: view() }
}

test('children are pinned to the computed rect, not frame-written', () => {
	const item = child('a')
	const host = view()
	pinLayoutChild(item, host, 10, 20, 100, 50)

	assert.equal(item.view.frame, undefined)
	assert.equal(item.placementPins.leading.constant, 10)
	assert.equal(item.placementPins.top.constant, 20)
	assert.equal(item.placementPins.width.constant, 100)
	assert.equal(item.placementPins.height.constant, 50)
	assert.ok(item.placementPins.leading.active)
})

test('pin constants refresh in place on relayout', () => {
	const item = child('a')
	const host = view()
	pinLayoutChild(item, host, 0, 0, 100, 40)
	const created = { ...item.placementPins }

	pinLayoutChild(item, host, 5, 8, 200, 60)
	assert.equal(item.placementPins.leading, created.leading)
	assert.equal(item.placementPins.top, created.top)
	assert.equal(item.placementPins.width.constant, 200)
	assert.equal(item.placementPins.height.constant, 60)
})

test('identical writes leave constants untouched', () => {
	const item = child('a')
	const host = view()
	pinLayoutChild(item, host, 1, 2, 3, 4)
	const constants = Object.fromEntries(
		Object.entries(item.placementPins).map(([k, v]: any) => [k, v.constant]),
	)
	pinLayoutChild(item, host, 1, 2, 3, 4)
	for (const [k, v] of Object.entries(constants)) {
		assert.equal(item.placementPins[k].constant, v)
	}
})

test('releasePlacementPins deactivates and drops stale pins', () => {
	const item = child('a')
	pinLayoutChild(item, view(), 0, 0, 10, 10)
	const pins = item.placementPins
	releasePlacementPins(item)

	assert.equal(item.placementPins, null)
	assert.equal(pins.leading.active, false)
	assert.equal(pins.width.active, false)
})

test('releasePlacementPins on an unpinned node is a no-op', () => {
	releasePlacementPins(child('b'))
})


test('sticky leases modify native pins without accumulating offsets and restore latest layout on release', () => {
	const item: any = child('sticky'), host = view(); retained.set(item.view, item)
	const lease = stickyPlacements.retain(item.view)!
	pinLayoutChild(item, host, 10, 2, 100, 40)
	lease.update(80, 2)
	assert.equal(item.placementPins.leading.constant, 90)
	assert.equal(lease.read({})!.x, 10)
	pinLayoutChild(item, host, 20, 2, 120, 40)
	assert.equal(item.placementPins.leading.constant, 100)
	lease.release()
	assert.equal(item.placementPins.leading.constant, 20)
	assert.equal(item.placementPins.width.constant, 120)
	lease.update(900, 2); assert.equal(item.placementPins.leading.constant, 20)
})
test('newest lease owns placement; reparent reset and detached owners cannot write stale pins', () => {
	const item: any = child('replaced'), host = view(); retained.set(item.view, item)
	const old = stickyPlacements.retain(item.view)!
	pinLayoutChild(item, host, 10, 0, 100, 40); old.update(50, 1)
	const current = stickyPlacements.retain(item.view)!
	old.release(); old.update(500, 2)
	assert.equal(item.placementPins.leading.constant, 60)
	releasePlacementPins(item)
	pinLayoutChild(item, view(), 5, 0, 100, 40)
	assert.equal(item.placementPins.leading.constant, 5)
	assert.equal(stickyPlacements.priority(item), 0)
	retained.delete(item.view); current.update(100, 2)
	assert.equal(current.read({}), undefined)
	assert.equal(item.placementPins.leading.constant, 5)
})
test('sticky native sibling ordering puts shifted start/end cells above ordinary cells and restores template order', () => {
	const start = { view: {} }, middle = { view: {} }, end = { view: {} }, children = [start, middle, end]
	const priorities = new Map<object, number>([[start, 2], [end, 1]])
	const calls: object[] = [], host: any = {
		subviews: children.map((node) => node.view),
		addSubviewPositionedRelativeTo: (view: object) => calls.push(view),
	}
	for (const node of children) {Object.assign(node.view, { superview: host })}
	const parent = { children }
	Object.assign(start, { parent })
	const code = source.slice(source.indexOf('function orderStickySiblings'), source.indexOf('const stickyPlacements ='))
	const { orderStickySiblings } = runSlice(code + '\n({ orderStickySiblings })', {
		layoutView: (node: any) => node.view, stickyPlacements: { priority: (node: object) => priorities.get(node) ?? 0 },
	})
	orderStickySiblings(start)
	assert.deepEqual(calls, [middle.view, end.view, start.view])
	host.subviews = [middle.view, end.view, start.view]; calls.length = 0
	orderStickySiblings(start); assert.equal(calls.length, 0)
	priorities.clear(); orderStickySiblings(start)
	assert.deepEqual(calls, [start.view, middle.view, end.view])
})
