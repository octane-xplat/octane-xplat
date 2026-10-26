import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { stripTypeScriptTypes } from 'node:module'
import { test } from 'node:test'
import { runSlice } from './mock-globals.ts'

const source = stripTypeScriptTypes(
	readFileSync(new URL('../src/index.ts', import.meta.url), 'utf8'),
)

const fn = (name: string) => {
	const start = source.indexOf(`function ${name}(`)
	assert.ok(start >= 0, name)
	return source.slice(start, source.indexOf('\n}', start) + 2)
}

function fixture() {
	const noop = () => {}
	const api = runSlice(
		source.slice(
			source.indexOf('function droppedPropClears('),
			source.indexOf('\nfunction applyProps('),
		) +
			'\n' +
			[
				'parentReference',
				'resolveParentNode',
				'canContainView',
				'validateBatch',
				'typeHasView',
				'syncSegmentedBar',
				'notifySegmentedBarChange',
				'validateNodeProps',
				'validateTextNesting',
				'droppedPropClears',
				'applyProps',
				'applyCommand',
				'insert',
				'detach',
				'remove',
				'destroy',
			]
				.map(fn)
				.join('\n') +
			'\n({insert,remove,destroy,applyCommand,validateNodeProps,validateTextNesting,validateBatch})',
		{
		elementBehaviors: new Map(),
		behaviorOf: () => undefined,
		isManualLayoutParent: (t: string) =>
			['gridlayout','liquidglass','absolutelayout','contentview','actionbar','docklayout','wraplayout','rootlayout'].includes(t),
		registerElementType: () => {},
		
			assertSupportedType: noop,
			validateProxyTree: noop,
			setControlAction: noop,
			queueLayoutReconcile: noop,
			syncText: noop,
			layoutView: (node: any) => node.view,
			VIEW_PARENT_TYPES: new Set(),
			deactivateSizeConstraints: noop,
			releasePlacementPins: noop,
			disposePressGestures: noop,
			panHandlersByView: new WeakMap(),
			layoutHandlers: new WeakMap(),
			actionHandlers: new Map(),
			accessibilityLabels: new Map(),
			accessibilityRoles: new Map(),
		},
	)

	const container: any = { nodes: new Map(), children: [] }
	const bar = (id: number) => {
		const titles: string[] = []
		const view = {
			removeFromSuperview: noop,
			selectedSegment: -1,
			set segmentCount(value: number) {
				titles.length = value
			},
			setLabelForSegment(title: string, index: number) {
				titles[index] = title
			},
			invalidateIntrinsicContentSize: noop,
		}

		const node = {
			id,
			type: 'segmentedbar',
			props: {},
			children: [],
			parent: null,
			view,
			container,
			segmentedBarRequested: -1,
			titles,
		}

		container.nodes.set(id, node)
		return node
	}

	const item = (id: number, title?: string) => {
		const node = {
			id,
			type: 'segmentedbaritem',
			props: { title },
			children: [],
			parent: null,
			view: null,
			container,
		}

		container.nodes.set(id, node)
		return node
	}

	const update = (node: any, props: any) =>
		api.applyCommand(container, { op: 'update', id: node.id, props })

	return { api, container, bar, item, update }
}

test('SegmentedBarItem inserts ordered duplicate/empty titles and preserves logical identity on moves', () => {
	const { api, container, bar, item } = fixture()
	const parent = bar(1),
		a = item(2, 'Same'),
		b = item(3, 'Same'),
		c = item(4)

	for (const child of [a, b, c]) {
		api.insert(container, 1, child, null)
	}

	assert.deepEqual(parent.titles, ['Same', 'Same', ''])
	api.insert(container, 1, c, 2)
	assert.deepEqual(parent.titles, ['', 'Same', 'Same'])
	assert.equal(parent.children[0], c)
	assert.equal(c.view, null)
	assert.equal(c.parent, parent)
})

test('SegmentedBarItem title updates and removal restore empty content without replacing its slot', () => {
	const { api, container, bar, item, update } = fixture()
	const parent = bar(1),
		child = item(2, 'Before')

	api.insert(container, 1, child, null)
	update(child, { title: 'After' })
	assert.deepEqual(parent.titles, ['After'])
	update(child, {})
	assert.deepEqual(parent.titles, [''])
	assert.equal(child.props.title, undefined)
	assert.equal(parent.children[0], child)
	assert.equal(parent.view.selectedSegment, 0)
})

test('SegmentedBarItem reparents, removes, reinserts and destroys without retaining parent segments', () => {
	const { api, container, bar, item } = fixture()
	const left = bar(1),
		right = bar(2),
		child = item(3, 'Move')

	api.insert(container, 1, child, null)
	api.insert(container, 2, child, null)
	assert.deepEqual(left.titles, [])
	assert.equal(left.view.selectedSegment, -1)
	assert.deepEqual(right.titles, ['Move'])
	api.remove(container, 2, child)
	assert.equal(child.parent, null)
	assert.deepEqual(right.titles, [])
	api.insert(container, 1, child, null)
	api.destroy(child)
	assert.equal(child.parent, null)
	assert.equal(child.props.title, undefined)
	assert.deepEqual(left.titles, [])
})

test('SegmentedBar destruction detaches logical children before later child disposal', () => {
	const { api, container, bar, item } = fixture()
	const parent = bar(1),
		child = item(2, 'Title')

	api.insert(container, 1, child, null)
	api.destroy(parent)
	assert.equal(child.parent, null)
	assert.equal(parent.children.length, 0)
	assert.deepEqual(parent.titles, [])
	api.destroy(child)
	assert.deepEqual(parent.titles, [])
})

test('SegmentedBarItem invalid title and nesting fail explicitly before detaching valid content', () => {
	const { api, container, bar, item } = fixture()
	const parent = bar(1),
		child = item(2, 'Stay')

	api.insert(container, 1, child, null)
	for (const title of [1, false, {}]) {
		assert.throws(
			() => api.validateNodeProps('segmentedbaritem', { title }),
			/title must be a string/,
		)
	}

	for (const parentType of [undefined, 'stacklayout', 'label', 'segmentedbaritem']) {
		assert.throws(
			() => api.validateTextNesting(parentType, 'segmentedbaritem'),
			/requires|takes title/,
		)
	}

	for (const childType of ['label', '#text', 'segmentedbaritem']) {
		assert.throws(() => api.validateTextNesting('segmentedbaritem', childType), /takes title/)
	}

	assert.throws(() => api.insert(container, null, child, null), /requires a segmentedbar parent/)
	assert.equal(child.parent, parent)
	assert.deepEqual(parent.titles, ['Stay'])
})

test('SegmentedBarItem batch preflight rejects invalid root/nested items before mutation', () => {
	const { api, container, bar, item } = fixture()
	const parent = bar(1),
		child = item(2, 'Kept')

	api.insert(container, 1, child, null)
	assert.throws(
		() => api.validateBatch(container, [{ op: 'move', id: 2, parent: null, before: null }]),
		/requires a segmentedbar parent/,
	)

	assert.throws(
		() =>
			api.validateBatch(container, [
				{ op: 'create', id: 3, type: 'segmentedbaritem', props: { title: 'Invalid' } },
				{ op: 'insert', id: 3, parent: 2, before: null },
			]),
		/takes title content/,
	)

	assert.equal(child.parent, parent)
	assert.deepEqual(parent.titles, ['Kept'])
	assert.equal(container.nodes.has(3), false)
})
