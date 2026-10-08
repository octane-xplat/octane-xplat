import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { stripTypeScriptTypes } from 'node:module'
import { test } from 'node:test'
import { runInNewContext } from 'node:vm'

// Exercise the production insertion path without loading the Objective-C bridge.
const source = stripTypeScriptTypes(
	readFileSync(new URL('../src/index.ts', import.meta.url), 'utf8'),
)

const detachment = source.slice(
	source.indexOf('function detach('),
	source.indexOf('function insert('),
)

const insertion = source.slice(
	source.indexOf('function insert('),
	source.indexOf('\nfunction ', source.indexOf('function insert(') + 1),
)

const gravityIndex = source.slice(
	source.indexOf('function gravityInsertIndex('),
	source.indexOf('\nfunction ', source.indexOf('function gravityInsertIndex(') + 1),
)

function fixture() {
	const arranged = []
	const stack = {
		removeArrangedSubview(view) {
			const index = arranged.indexOf(view)
			if (index >= 0) {
				arranged.splice(index, 1)
			}
		},
		addViewInGravity(view) {
			arranged.push(view)
		},
		insertViewAtIndexInGravity(view, index, gravity) {
			const group = arranged.filter((value) => value.gravity === gravity)
			const before = group[index]
			arranged.splice(before ? arranged.indexOf(before) : arranged.length, 0, view)
		},
	}

	const parent = { id: 1, type: 'flexboxlayout', children: [], view: stack }
	const container = { nodes: new Map([[1, parent]]), children: [] }
	const noop = () => {}
	const insert = runInNewContext(gravityIndex + '\n' + detachment + '\n(' + insertion + ')', {
		VIEW_PARENT_TYPES: new Set([
			'stack',
			'flexboxlayout',
			'scrollview',
			'gridlayout',
			'absolutelayout',
		]),
		arrangedView: (node) => node.marginHost ?? node.view,
		stackGravity: (_parent, node) => node.view.gravity,
		marginInsetsOf: (node) => (node.marginHost ? {} : null),
		makeMarginHost: noop,
		applySizeConstraints: noop,
		setStackChildPriorities: noop,
		updateCrossAxisConstraints: noop,
		syncScheme: noop,
		updateStackDistribution: noop,
		deactivateSizeConstraints: noop,
		releasePlacementPins: noop,
		setLayoutAction: noop,
		syncText: noop,
	})

	const row = (id, gravity = 1) => ({ id, view: { id, gravity, removeFromSuperview() {} } })
	return {
		insert: (node, before = null) => insert(container, 1, node, before),
		parent,
		arranged,
		row,
	}
}

test('keyed descending and ascending moves preserve native stack order and views', () => {
	const { insert, parent, arranged, row } = fixture()
	const [a, b, c] = ['a', 'b', 'c'].map((id) => row(id))
	for (const node of [a, b, c]) {
		insert(node)
	}

	insert(c, 'a')
	insert(b, 'a')
	assert.deepEqual(
		parent.children.map((node) => node.id),
		['c', 'b', 'a'],
	)

	assert.deepEqual(arranged, [c.view, b.view, a.view])
	insert(a, 'c')
	insert(b, 'c')
	assert.deepEqual(arranged, [a.view, b.view, c.view])
})

test('native insertion counts views in the same gravity, including margin hosts', () => {
	const { insert, arranged, row } = fixture()
	const text = { id: 'text', view: null }
	const a = row('a', 1)
	const b = row('b', 2)
	const c = row('c', 2)
	c.marginHost = { id: 'margin-c', gravity: 2, removeFromSuperview() {} }
	for (const node of [text, a, b]) {
		insert(node)
	}

	insert(c, 'b')
	assert.deepEqual(arranged, [a.view, c.marginHost, b.view])
	insert(c)
	assert.deepEqual(arranged, [a.view, b.view, c.marginHost])
})
