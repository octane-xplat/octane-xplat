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
		selectedSegment: -1,
		set segmentCount(count: number) {
			titles.length = count
		},
		get segmentCount() {
			return titles.length
		},
		setLabelForSegment(title: string, index: number) {
			titles[index] = title
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
				'makeSegmentedBar',
				'notifySegmentedBarChange',
				'syncSegmentedBar',
				'validateNodeProps',
				'droppedPropClears',
				'applyProps',
				'applyCommand',
			]
				.map(fn)
				.join('\n') +
			'\n({makeSegmentedBar,validateNodeProps,applyProps,applyCommand})',
		{
		releaseMasonNodes: () => {},
		layoutMasonChildren: () => {},
		masonNaturalSize: () => null,
		MASON_STYLE_KEYS: new Set(),
		
			NSSegmentedControl: {
				segmentedControlWithLabelsTrackingModeTargetAction: (
					_labels: any,
					_mode: any,
					target: any,
					action: any,
				) => {
					view.target = target
					view.action = action
					return view
				},
			},
			NSSegmentSwitchTracking: { SelectOne: 0 },
			nativeColor: (value: any) => value,
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
	const node: any = {
		id: 1,
		type: 'segmentedbar',
		props: {},
		children: [],
		parent: null,
		container,
	}

	const control = api.makeSegmentedBar(node)
	node.view = control.view
	node.actionId = control.actionId
	container.nodes.set(1, node)
	const onSelectedIndexChange = (event: any) => events.push(event)
	const update = (props: any) => api.applyCommand(container, { op: 'update', id: 1, props })
	return { api, node, view, events, titles, update, onSelectedIndexChange }
}

test('SegmentedBar preserves duplicate/empty labels, renders missing titles as empty strings and clamps selection', () => {
	const { view, titles, update, events, onSelectedIndexChange } = fixture()
	assert.equal(view.action, 'controlChanged:')
	assert.equal(view.translatesAutoresizingMaskIntoConstraints, false)
	update({
		items: [{ title: 'Same' }, { title: 'Same' }, {}, { title: 'Last' }, { title: '' }],
		selectedIndex: 9,
		onSelectedIndexChange,
	})

	assert.deepEqual(titles, ['Same', 'Same', '', 'Last', ''])
	assert.equal(view.selectedSegment, 4)
	assert.equal(events.length, 1)
	assert.equal(events[0].eventName, 'selectedIndexChange')
	assert.equal(events[0].value, 4)
	assert.equal(events[0].oldIndex, -1)
	assert.equal(events[0].object, view)
	update({ items: [{ title: 'Only' }], selectedIndex: -8, onSelectedIndexChange })
	assert.equal(view.selectedSegment, 0)
	update({ items: [], selectedIndex: 7, onSelectedIndexChange })
	assert.equal(view.selectedSegment, -1)
})

test('SegmentedBar restores missing props and style, re-coerces requested indices as items grow', () => {
	const { node, view, update, titles } = fixture()
	update({ items: [{ title: 'a' }], selectedIndex: 4, style: { opacity: 0.5 } })
	assert.equal(view.selectedSegment, 0)
	update({ items: ['a', 'b', 'c', 'd', 'e'].map((title) => ({ title })), selectedIndex: 4 })
	assert.equal(view.selectedSegment, 4)
	assert.equal(node.appliedStyle, undefined)
	update({ items: [{ title: 'a' }, { title: 'b' }] })
	assert.equal(view.selectedSegment, 0)
	update({})
	assert.deepEqual(titles, [])
	assert.equal(view.selectedSegment, -1)
	update({ items: [{ title: 'new' }] })
	assert.equal(view.selectedSegment, 0)
})

test('SegmentedBar native selection survives unchanged props, updates payloads and removes stale handlers', () => {
	const { view, update, events, onSelectedIndexChange } = fixture()
	const items = [{ title: 'a' }, { title: 'b' }, { title: 'c' }]
	update({ items, selectedIndex: 0, onSelectedIndexChange })
	events.length = 0
	view.selectedSegment = 2
	view.callback()
	assert.equal(events.length, 1)
	assert.equal(events[0].value, 2)
	assert.equal(events[0].oldIndex, 0)
	view.callback()
	update({ items, selectedIndex: 0, onSelectedIndexChange })
	assert.equal(view.selectedSegment, 2)
	assert.equal(events.length, 1)
	// Replacing/mutating items updates labels without discarding native choice.
	items[2].title = 'changed'
	update({ items, selectedIndex: 0 })
	view.selectedSegment = 1
	view.callback()
	assert.equal(events.length, 1)
})

test('SegmentedBar rejects invalid props before allocating and rejects child content', () => {
	const { api } = fixture()
	for (const value of ['1', 1.5, NaN, Infinity]) {
		assert.throws(() => api.validateNodeProps('segmentedbar', { selectedIndex: value }), /integer/)
	}

	for (const value of ['items', {}, 123]) {
		assert.throws(() => api.validateNodeProps('segmentedbar', { items: value }), /array/)
	}

	for (const item of [null, 'title', 1, { title: 2 }]) {
		assert.throws(() => api.validateNodeProps('segmentedbar', { items: [item] }), /objects|title/)
	}

	const nesting = runInNewContext(fn('validateTextNesting') + '\n({validateTextNesting})')
	for (const child of ['label', '#text', 'segmentedbar']) {
		assert.throws(
			() => nesting.validateTextNesting('segmentedbar', child),
			/accepts only segmentedbaritem children/,
		)
	}

	for (const parent of ['stacklayout', 'contentview', 'docklayout', 'rootlayout', 'gridlayout']) {
		nesting.validateTextNesting(parent, 'segmentedbar')
	}
})

test('SegmentedBar production ownership moves its native host between parents and releases it on destroy', () => {
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
		picker: any = node(3, 'segmentedbar')

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
	assert.equal(retained.segmentCount, 0)
	assert.equal(picker.props.items, undefined)
	assert.equal(actions.has(3), false)
	assert.equal(picker.props.onSelectedIndexChange, undefined)
	assert.equal(picker.parent, null)
	assert.equal(right.contentChild, null)
	assert.equal(right.children.length, 0)
})

test('SegmentedBar selected background style updates and restores the pinned blue default', () => {
	const noop = () => {}
	const api = runInNewContext(
		['applyStyle', 'resetStyle'].map(fn).join('\n') + '\n({applyStyle})',
		{
		releaseMasonNodes: () => {},
		layoutMasonChildren: () => {},
		masonNaturalSize: () => null,
		MASON_STYLE_KEYS: new Set(),
		
			nativeColor: (value: any) => value,
			MARGIN_SIDES: {},
			EDGE_INSET_PROPS: new Map(),
			syncStackLayout: noop,
			syncEdgeInsets: noop,
			syncText: noop,
			syncScheme: noop,
			queueLayoutReconcile: noop,
		},
	)

	const node: any = { type: 'segmentedbar', props: {}, view: {}, container: {} }
	api.applyStyle(node, { selectedBackgroundColor: '#ff0000' })
	assert.equal(node.view.selectedSegmentBezelColor, '#ff0000')
	api.applyStyle(node, { selectedBackgroundColor: '#00ff00' })
	assert.equal(node.view.selectedSegmentBezelColor, '#00ff00')
	api.applyStyle(node, {})
	assert.equal(node.view.selectedSegmentBezelColor, '#0000ff')
})
