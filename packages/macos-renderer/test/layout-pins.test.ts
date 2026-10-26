import assert from 'node:assert/strict'
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
	source.slice(
		source.indexOf('function layoutView('),
		source.indexOf('function setMarginStyle'),
	) +
	source.slice(
		source.indexOf('function pinLayoutChild'),
		source.indexOf('// Width/height percentages use the parent'),
	)

const { pinLayoutChild, releasePlacementPins } = runSlice(
	layout + '\n({ pinLayoutChild, releasePlacementPins })',
	{ queueMicrotask: undefined },
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
