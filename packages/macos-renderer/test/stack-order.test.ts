import assert from 'node:assert/strict'
import { test } from 'node:test'
import { runInNewContext } from 'node:vm'
import { sourceWithoutImports } from './mock-globals.ts'

// Exercise the production insertion path without loading the Objective-C bridge.
const source = sourceWithoutImports(new URL('../src/index.ts', import.meta.url))

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

const portalHelpers = source.slice(
	source.indexOf('function parentReference('),
	source.indexOf('function isPortalTargetView('),
)

function fixture() {
	const arranged = []
	const stack = {
		removeArrangedSubview(view) {
			const index = arranged.indexOf(view)
			if (index < 0) {
				throw new Error('Cannot remove a view not owned by this stack')
			}

			arranged.splice(index, 1)
			view.superview = null
		},
		addViewInGravity(view) {
			arranged.push(view)
			view.superview = this
		},
		insertViewAtIndexInGravity(view, index, gravity) {
			const group = arranged.filter((value) => value.gravity === gravity)
			const before = group[index]
			arranged.splice(before ? arranged.indexOf(before) : arranged.length, 0, view)
			view.superview = this
		},
	}

	const parent = { id: 1, type: 'flexboxlayout', children: [], view: stack }
	const container = { nodes: new Map([[1, parent]]), children: [] }
	const noop = () => {}
	const insert = runInNewContext(
		portalHelpers + gravityIndex + '\n' + detachment + '\n(' + insertion + ')',
		{
		elementBehaviors: new Map(),
		behaviorOf: () => undefined,
		isManualLayoutParent: (t: string) =>
			['gridlayout','liquidglass','absolutelayout','contentview','actionbar','docklayout','wraplayout','rootlayout'].includes(t),
		registerElementType: () => {},
		
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
			layoutView: (node) => node.view,
			layoutGridChildren: noop,
			layoutAbsoluteChildren: noop,
		},
	)

	const row = (id, gravity = 1) => ({ id, view: { id, gravity, removeFromSuperview() {} } })
	return {
		insert: (node, before = null, parentId = 1) => insert(container, parentId, node, before),
		parent,
		container,
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

test('re-homing under a manual-layout parent releases the margin wrapper', () => {
	const { insert, container, row } = fixture()
	const added = []
	const grid = {
		id: 9,
		type: 'gridlayout',
		children: [],
		view: {
			addSubview(view) {
				added.push(view)
			},
		},
	}

	container.nodes.set(9, grid)

	const c = row('c', 2)
	const host = {
		id: 'margin-c',
		removed: false,
		removeFromSuperview() {
			this.removed = true
		},
	}

	c.marginHost = host
	c.marginConstraints = []
	insert(c, null, 9)

	// The inner view lands directly in the grid and the dead wrapper is
	// released — a stale marginHost would leave a ghost view and keep
	// arrangedView() returning the detached host.
	assert.deepEqual(added, [c.view])
	assert.equal(c.marginHost, null)
	assert.equal(c.marginConstraints, null)
	assert.equal(host.removed, true)
})
