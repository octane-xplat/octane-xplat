import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { stripTypeScriptTypes } from 'node:module'
import { test } from 'node:test'
import { runInNewContext } from 'node:vm'

// Exercise the diff-based stack move without the Objective-C bridge. Layout
// re-syncs used to detach every arranged child; removing a first-responder
// ancestor ends the live editing session, so unchanged children must never
// be re-parented.
const source = stripTypeScriptTypes(
	readFileSync(new URL('../src/index.ts', import.meta.url), 'utf8'),
)

const program = source.slice(
	source.indexOf('function stackViewsInGravity('),
	source.indexOf('function updateStackDistribution('),
)

function view(id) {
	return {
		id,
		gravity: 0,
		detachCount: 0,
		removeFromSuperview() {
			this.detachCount++
		},
	}
}

function fixture() {
	const calls = { size: [], priorities: [], distribution: 0, crossAxis: 0 }
	const stack = {
		arranged: [],
		viewsInGravity(gravity) {
			const group = this.arranged.filter((entry) => entry.gravity === gravity)
			return { count: group.length, objectAtIndex: (index) => group[index] }
		},
		removeArrangedSubview(entry) {
			const index = this.arranged.indexOf(entry)
			if (index >= 0) {
				this.arranged.splice(index, 1)
			}
		},
		insertViewAtIndexInGravity(entry, index, gravity) {
			entry.gravity = gravity
			const group = this.arranged.filter((value) => value.gravity === gravity)
			const before = group[index]
			this.arranged.splice(before ? this.arranged.indexOf(before) : this.arranged.length, 0, entry)
		},
		addViewInGravity(entry, gravity) {
			entry.gravity = gravity
			this.arranged.push(entry)
		},
	}

	const parent = { id: 1, type: 'flexboxlayout', children: [], view: stack }
	const moveStackChildren = runInNewContext(program + '\nmoveStackChildren', {
		NSStackViewGravity: { Leading: 1, Top: 1, Center: 2, Trailing: 3, Bottom: 3 },
		arrangedView: (node) => node.marginHost ?? node.view,
		stackGravity: (_parent, node) => node.gravity,
		applySizeConstraints: (node) => calls.size.push(node.id),
		setStackChildPriorities: (_parent, node) => calls.priorities.push(node.id),
		updateStackDistribution: () => calls.distribution++,
		updateCrossAxisConstraints: () => calls.crossAxis++,
	})

	const row = (id, gravity = 1) => {
		const node = { id, type: 'label', gravity, view: view(id), parent, children: [] }
		parent.children.push(node)
		return node
	}

	const arrange = (...nodes) => {
		for (const node of nodes) {
			const entry = node.marginHost ?? node.view
			entry.gravity = node.gravity
			stack.arranged.push(entry)
		}
	}

	return { moveStackChildren, parent, stack, calls, row, arrange }
}

test('unchanged gravity assignment never detaches a stack child', () => {
	const { moveStackChildren, parent, stack, calls, row, arrange } = fixture()
	const [a, b, c] = [row('a', 1), row('b', 2), row('c', 3)]
	arrange(a, b, c)

	// An orientation flip maps Leading→Top and Trailing→Bottom — the same
	// gravity values — so every child stays put.
	moveStackChildren(parent)

	assert.equal(a.view.detachCount, 0)
	assert.equal(b.view.detachCount, 0)
	assert.equal(c.view.detachCount, 0)
	assert.deepEqual(stack.arranged, [a.view, b.view, c.view])
	assert.deepEqual(calls.size, [])
	assert.deepEqual(calls.priorities, [])
	assert.equal(calls.distribution, 1)
	assert.equal(calls.crossAxis, 1)
})

test('gravity remap re-parents only the children that change areas', () => {
	const { moveStackChildren, parent, stack, calls, row, arrange } = fixture()
	const a = row('a', 1)
	const b = row('b', 1)
	const c = row('c', 2)
	arrange(a, b, c)

	// justify start→space-between: a stays leading, b moves trailing, c center.
	b.gravity = 3
	moveStackChildren(parent)

	assert.equal(a.view.detachCount, 0)
	assert.equal(b.view.detachCount, 1)
	assert.equal(c.view.detachCount, 0)
	assert.equal(stack.viewsInGravity(1).objectAtIndex(0), a.view)
	assert.deepEqual(
		stack.arranged.map((entry) => [entry.id, entry.gravity]),
		[
			['a', 1],
			['c', 2],
			['b', 3],
		],
	)

	assert.deepEqual(calls.size, ['b'])
	assert.deepEqual(calls.priorities, ['b'])
})

test('reorder inside a gravity area moves only displaced views', () => {
	const { moveStackChildren, parent, stack, row, arrange } = fixture()
	const a = row('a', 1)
	const b = row('b', 1)
	const c = row('c', 1)
	arrange(a, b, c)

	// Child order changed while gravities did not: only c is displaced —
	// a and b already sit at their desired indices once c leaves.
	parent.children.splice(0, parent.children.length, c, a, b)
	moveStackChildren(parent)

	assert.equal(c.view.detachCount, 1)
	assert.equal(a.view.detachCount, 0)
	assert.equal(b.view.detachCount, 0)
	assert.deepEqual(
		[0, 1, 2].map((index) => stack.viewsInGravity(1).objectAtIndex(index).id),
		['c', 'a', 'b'],
	)
})

test('the margin host is the arranged view a move re-parents', () => {
	const { moveStackChildren, parent, stack, row, arrange } = fixture()
	const a = row('a', 1)
	a.marginHost = view('host-a')
	arrange(a)

	a.gravity = 2
	moveStackChildren(parent)

	assert.equal(a.view.detachCount, 0)
	assert.equal(a.marginHost.detachCount, 1)
	assert.deepEqual(stack.arranged, [a.marginHost])
})

test('views arranged under a child that left the area are evicted', () => {
	const { moveStackChildren, parent, stack, row, arrange } = fixture()
	const a = row('a', 1)
	arrange(a)
	const stray = view('stray')
	stray.gravity = 1
	stack.arranged.push(stray)

	moveStackChildren(parent)

	assert.equal(stray.detachCount, 1)
	assert.deepEqual(stack.arranged, [a.view])
})
