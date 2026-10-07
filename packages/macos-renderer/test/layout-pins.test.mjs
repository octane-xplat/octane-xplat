import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { stripTypeScriptTypes } from 'node:module'
import { test } from 'node:test'
import { runInNewContext } from 'node:vm'

// Exercise grid/absolute child placement without the Objective-C bridge.
// Children are translates=false views, so layout must express each computed
// rect as parent-anchored constraints — an imperative frame write is
// discarded by the next Auto Layout solve.
const source = stripTypeScriptTypes(
	readFileSync(new URL('../src/index.ts', import.meta.url), 'utf8'),
)

const layout = source.slice(
	source.indexOf('function layoutLength'),
	source.indexOf('function performGridAccessibilityAdjustment'),
)

const {
	releasePlacementPins,
	layoutGridChildren,
	layoutAbsoluteChildren,
} = runInNewContext(layout + '\n({ releasePlacementPins, layoutGridChildren, layoutAbsoluteChildren })')

function constraint() {
	return { active: false, constant: 0 }
}

function anchor() {
	return {
		constraintEqualToAnchorConstant: (_other, constant) => ({ ...constraint(), constant }),
		constraintEqualToConstant: (constant) => ({ ...constraint(), constant }),
	}
}

function view({ width = 0, height = 0, intrinsic = { width: 0, height: 0 } } = {}) {
	return {
		bounds: { size: { width, height } },
		intrinsicContentSize: intrinsic,
		leadingAnchor: anchor(),
		topAnchor: anchor(),
		widthAnchor: anchor(),
		heightAnchor: anchor(),
	}
}

function child(id, props = {}, intrinsic) {
	return { id, props, view: view({ intrinsic }) }
}

function parent(type, size, props = {}, children = []) {
	const node = { id: 'parent', type, props, children, view: view(size) }
	for (const item of children) {
		item.parent = node
	}

	return node
}

function pins(node) {
	assert.ok(node.placementPins, 'expected placement pins on child')
	return node.placementPins
}

test('absolute children are pinned to the computed rect, not frame-written', () => {
	const first = child('a', { left: 10, top: 20, style: { width: 100, height: 50 } })
	const host = parent('absolutelayout', { width: 300, height: 200 }, {}, [first])
	layoutAbsoluteChildren(host)

	assert.equal(first.view.frame, undefined)
	assert.equal(pins(first).leading.constant, 10)
	assert.equal(pins(first).top.constant, 20)
	assert.equal(pins(first).width.constant, 100)
	assert.equal(pins(first).height.constant, 50)
})

test('absolute right/bottom props resolve against parent bounds via pins', () => {
	const item = child('a', { right: 10, bottom: 10 }, { width: 30, height: 20 })
	const host = parent('absolutelayout', { width: 300, height: 200 }, {}, [item])
	layoutAbsoluteChildren(host)

	assert.equal(pins(item).leading.constant, 260)
	assert.equal(pins(item).top.constant, 170)
	assert.equal(pins(item).width.constant, 30)
	assert.equal(pins(item).height.constant, 20)
})

test('pin constants refresh in place when the parent resizes', () => {
	const item = child('a', { left: 0, top: 0, bottom: 0, style: { width: 268 } })
	const host = parent('absolutelayout', { width: 288, height: 400 }, {}, [item])
	layoutAbsoluteChildren(host)
	const created = { ...pins(item) }

	assert.equal(created.height.constant, 400)
	host.view.bounds.size.height = 600
	layoutAbsoluteChildren(host)

	assert.equal(pins(item).leading, created.leading)
	assert.equal(pins(item).height, created.height)
	assert.equal(pins(item).height.constant, 600)
})

test('grid children are pinned to their resolved cell rects', () => {
	const a = child('a', { row: 0, col: 0 })
	const b = child('b', { row: 1, col: 1 })
	const host = parent(
		'gridlayout',
		{ width: 300, height: 200 },
		{ rows: '40 1*', columns: '100 1*' },
		[a, b],
	)

	layoutGridChildren(host)

	assert.equal(a.view.frame, undefined)
	const rect = (node) =>
		[node.leading.constant, node.top.constant, node.width.constant, node.height.constant]

	assert.deepEqual(rect(pins(a)), [0, 0, 100, 40])
	assert.deepEqual(rect(pins(b)), [100, 40, 200, 160])
})

test('releasePlacementPins deactivates and drops stale pins', () => {
	const item = child('a', { left: 0, top: 0 })
	const host = parent('absolutelayout', { width: 100, height: 100 }, {}, [item])
	layoutAbsoluteChildren(host)
	releasePlacementPins(item)

	assert.equal(item.placementPins, null)
})
