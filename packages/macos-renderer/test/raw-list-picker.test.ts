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
	assert.ok(start >= 0, name)
	return source.slice(start, source.indexOf('\n}', start) + 2)
}

function fixture() {
	const events: any[] = []
	const titles: string[] = []
	const view: any = {
		indexOfSelectedItem: -1,
		menu: {
			addItem(item: any) {
				titles.push(item.title)
			},
		},
		removeAllItems() {
			titles.length = 0
			this.indexOfSelectedItem = -1
		},
		selectItemAtIndex(index: number) {
			this.indexOfSelectedItem = index
		},
		invalidateIntrinsicContentSize() {},
	}

	const constants = source.slice(
		source.indexOf('function droppedPropClears('),
		source.indexOf('\nfunction applyProps('),
	)

	const api = runInNewContext(
		constants +
			'\n' +
			[
				'parentReference',
				'resolveParentNode',
				'canContainView',
				'makeListPicker',
				'notifyListPickerChange',
				'syncListPicker',
				'validateNodeProps',
				'droppedPropClears',
				'applyProps',
				'applyCommand',
			]
				.map(fn)
				.join('\n') +
			'\n({makeListPicker,validateNodeProps,applyProps,applyCommand})',
		{
		releaseMasonNodes: () => {},
		layoutMasonChildren: () => {},
		masonNaturalSize: () => null,
		MASON_STYLE_KEYS: new Set(),
		
			NSPopUpButton: { alloc: () => ({ initWithFramePullsDown: () => view }) },
			NSMenuItem: {
				alloc: () => ({ initWithTitleActionKeyEquivalent: (title: string) => ({ title }) }),
			},
			buttonActionTarget: {},
			nextActionId: 1,
			actionHandlers: new Map(),
			setControlAction: (_node: any, handler: any) => {
				view.callback = handler
			},
			applyStyle: (node: any, style: any) => {
				node.appliedStyle = style
			},
			applyClassName() {},
			queueLayoutReconcile() {},
			console: {
				warn(message: string) {
					throw new Error(message)
				},
			},
		},
	)

	const container: any = { nodes: new Map() }
	const node: any = { id: 1, type: 'listpicker', props: {}, children: [], parent: null, container }
	const control = api.makeListPicker(node)
	node.view = control.view
	node.actionId = control.actionId
	container.nodes.set(1, node)
	const onSelectedIndexChange = (event: any) => events.push(event)
	const update = (props: any) => api.applyCommand(container, { op: 'update', id: 1, props })
	return { api, node, view, events, titles, update, onSelectedIndexChange }
}

test('ListPicker preserves duplicate/empty labels, renders nulls as indices and clamps selection', () => {
	const { view, titles, update, events, onSelectedIndexChange } = fixture()
	assert.equal(view.action, 'controlChanged:')
	assert.equal(view.translatesAutoresizingMaskIntoConstraints, false)
	update({ items: ['Same', 'Same', null, 42, ''], selectedIndex: 9, onSelectedIndexChange })
	assert.deepEqual(titles, ['Same', 'Same', '2', '42', ''])
	assert.equal(view.indexOfSelectedItem, 4)
	assert.equal(events.length, 1)
	assert.equal(events[0].eventName, 'selectedIndexChange')
	assert.equal(events[0].value, 4)
	assert.equal(events[0].oldValue, -1)
	assert.equal(events[0].object, view)
	update({ items: ['Only'], selectedIndex: -8, onSelectedIndexChange })
	assert.equal(view.indexOfSelectedItem, 0)
	update({ items: [], selectedIndex: 7, onSelectedIndexChange })
	assert.equal(view.indexOfSelectedItem, -1)
})

test('ListPicker restores missing props and style, re-coerces requested indices as items grow', () => {
	const { node, view, update, titles } = fixture()
	update({ items: ['a'], selectedIndex: 4, style: { opacity: 0.5 } })
	assert.equal(view.indexOfSelectedItem, 0)
	update({ items: ['a', 'b', 'c', 'd', 'e'], selectedIndex: 4 })
	assert.equal(view.indexOfSelectedItem, 4)
	assert.equal(node.appliedStyle, undefined)
	update({ items: ['a', 'b'] })
	assert.equal(view.indexOfSelectedItem, 0)
	update({})
	assert.deepEqual(titles, [])
	assert.equal(view.indexOfSelectedItem, -1)
	update({ items: ['new'] })
	assert.equal(view.indexOfSelectedItem, 0)
})

test('ListPicker native selection survives unchanged props, updates payloads and removes stale handlers', () => {
	const { view, update, events, onSelectedIndexChange } = fixture()
	const items = ['a', 'b', 'c']
	update({ items, selectedIndex: 0, onSelectedIndexChange })
	events.length = 0
	view.selectItemAtIndex(2)
	view.callback()
	assert.equal(events.length, 1)
	assert.equal(events[0].value, 2)
	assert.equal(events[0].oldValue, 0)
	view.callback()
	update({ items, selectedIndex: 0, onSelectedIndexChange })
	assert.equal(view.indexOfSelectedItem, 2)
	assert.equal(events.length, 1)
	// Replacing/mutating items updates labels without discarding native choice.
	items[2] = 'changed'
	update({ items, selectedIndex: 0 })
	view.selectItemAtIndex(1)
	view.callback()
	assert.equal(events.length, 1)
})

test('ListPicker rejects invalid props before allocating and rejects child content', () => {
	const { api } = fixture()
	for (const value of ['1', 1.5, NaN, Infinity]) {
		assert.throws(() => api.validateNodeProps('listpicker', { selectedIndex: value }), /integer/)
	}

	for (const value of ['items', {}, 123]) {
		assert.throws(() => api.validateNodeProps('listpicker', { items: value }), /array/)
	}

	const nesting = runInNewContext(fn('validateTextNesting') + '\n({validateTextNesting})')
	for (const child of ['label', '#text', 'listpicker']) {
		assert.throws(
			() => nesting.validateTextNesting('listpicker', child),
			/cannot contain JSX children/,
		)
	}

	for (const parent of ['stacklayout', 'contentview', 'docklayout', 'rootlayout', 'gridlayout']) {
		nesting.validateTextNesting(parent, 'listpicker')
	}
})

test('ListPicker production ownership moves its native host between parents and releases it on destroy', () => {
	const actions = new Map([[3, () => {}]])
	const noop = () => {}
	const view = () => ({
		subviews: [] as any[],
		superview: null as any,
		invalidateIntrinsicContentSize: noop,
		removeAllItems: noop,
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

	const api = runInNewContext(
		[
			'parentReference',
			'resolveParentNode',
			'canContainView',
			'validateTextNesting',
			'insert',
			'detach',
			'destroy',
		]
			.map(fn)
			.join('\n') + '\n({insert,destroy})',
		{
		releaseMasonNodes: () => {},
		layoutMasonChildren: () => {},
		masonNaturalSize: () => null,
		MASON_STYLE_KEYS: new Set(),
		
			VIEW_PARENT_TYPES: new Set(['contentview']),
			layoutView: (node: any) => node.view,
			arrangedView: (node: any) => node.view,
			deactivateSizeConstraints: noop,
			releasePlacementPins: noop,
			queueLayoutReconcile: noop,
			syncText: noop,
			syncScheme: noop,
			disposePressGestures: noop,
			panHandlersByView: new WeakMap(),
			layoutHandlers: new WeakMap(),
			actionHandlers: actions,
			accessibilityLabels: new Map(),
			accessibilityRoles: new Map(),
		},
	)

	const container: any = { nodes: new Map(), children: [] }
	const node = (id: number, type: string) => {
		const item = {
			id,
			type,
			view: view(),
			props: { onSelectedIndexChange: () => {} },
			children: [],
			parent: null,
			container,
		}

		container.nodes.set(id, item)
		return item
	}

	const left: any = node(1, 'contentview'),
		right: any = node(2, 'contentview'),
		picker: any = node(3, 'listpicker')

	picker.actionId = 3
	picker.view.target = {}
	picker.view.action = 'controlChanged:'
	const retained = picker.view
	api.insert(container, 1, picker, null)
	assert.equal(left.contentChild, picker)
	api.insert(container, 2, picker, null)
	assert.equal(left.contentChild, null)
	assert.equal(left.children.length, 0)
	assert.equal(picker.view, retained)
	assert.equal(retained.superview, right.view)
	assert.equal(right.contentChild, picker)
	api.destroy(picker)
	assert.equal(retained.superview, null)
	assert.equal(retained.target, null)
	assert.equal(retained.action, null)
	assert.equal(actions.has(3), false)
	assert.equal(picker.props.onSelectedIndexChange, undefined)
	assert.equal(picker.parent, null)
	assert.equal(right.contentChild, null)
	assert.equal(right.children.length, 0)
})
