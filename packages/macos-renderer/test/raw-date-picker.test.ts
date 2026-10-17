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

function controlFixture() {
	const events: any[] = [],
		handlers = new Map()

	const view: any = { sizeToFit() {}, removeFromSuperview() {} }
	const constants = source.slice(
		source.indexOf('function droppedPropClears('),
		source.indexOf('\nfunction applyProps('),
	)

	const api = runInNewContext(
		constants +
			'\n' +
			[
				'calendarDate',
				'makeDatePicker',
				'notifyDateChange',
				'syncDatePicker',
				'validateNodeProps',
				'parentReference',
				'resolveParentNode',
				'canContainView',
				'droppedPropClears',
				'applyProps',
				'applyCommand',
			]
				.map(fn)
				.join('\n') +
			'\n({calendarDate,makeDatePicker,notifyDateChange,syncDatePicker,validateNodeProps,applyProps,applyCommand})',
		{
		releaseMasonNodes: () => {},
		layoutMasonChildren: () => {},
		masonNaturalSize: () => null,
		MASON_STYLE_KEYS: new Set(),
		
			Date,
			NSDatePicker: { alloc: () => ({ initWithFrame: () => view }) },
			NSDate: {
				dateWithTimeIntervalSince1970: (seconds: number) => ({ timeIntervalSince1970: seconds }),
			},
			NSDatePickerStyle: { TextFieldAndStepper: 0 },
			NSDatePickerElementFlags: { YearMonthDay: 224 },
			NSDatePickerMode: { Single: 0 },
			buttonActionTarget: {},
			nextActionId: 1,
			actionHandlers: handlers,
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
	const node: any = { id: 1, type: 'datepicker', props: {}, children: [], parent: null, container }
	const control = api.makeDatePicker(node)
	node.view = control.view
	node.actionId = control.actionId
	container.nodes.set(1, node)
	const update = (props: any) => api.applyCommand(container, { op: 'update', id: 1, props })
	return { api, node, view, events, update, onDateChange: (event: any) => events.push(event) }
}

const dateValue = (view: any) => new Date(view.dateValue.timeIntervalSince1970 * 1000)

test('DatePicker creates date-only native chrome and normalizes without mutating caller Dates', () => {
	const { api, node, view, onDateChange, events } = controlFixture()
	assert.equal(view.datePickerElements, 224)
	assert.equal(view.datePickerStyle, 0)
	assert.equal(view.datePickerMode, 0)
	assert.equal(view.bezeled, true)
	assert.equal(view.drawsBackground, true)
	assert.equal(view.action, 'controlChanged:')
	assert.equal(view.translatesAutoresizingMaskIntoConstraints, false)
	const date = new Date(2026, 4, 10, 19, 30)
	api.applyProps(node, {
		date,
		minDate: new Date(2026, 4, 1, 8),
		maxDate: '2026-05-31T18:30:00',
		onDateChange,
	})

	assert.equal(date.getHours(), 19)
	assert.equal(dateValue(view).getTime(), new Date(2026, 4, 10).getTime())
	assert.equal(new Date(view.minDate.timeIntervalSince1970 * 1000).getHours(), 0)
	assert.equal(new Date(view.maxDate.timeIntervalSince1970 * 1000).getHours(), 0)
	assert.equal(events.length, 1)
	assert.equal(events[0].eventName, 'dateChange')
	assert.equal(events[0].object, view)
})

test('DatePicker update commands restore removed dates, bounds, components, enabled and styles', () => {
	const { node, view, update } = controlFixture()
	const initial = node.datePickerDefault.getTime()
	update({
		date: new Date(2026, 4, 10),
		minDate: new Date(2026, 4, 1),
		maxDate: new Date(2026, 4, 31),
		isEnabled: false,
		style: { opacity: 0.5 },
	})

	assert.equal(view.enabled, false)
	update({ date: new Date(2026, 4, 10), year: 2027, month: 6, day: 15 })
	assert.equal(dateValue(view).getTime(), new Date(2027, 5, 15).getTime())
	assert.equal(view.minDate, null)
	assert.equal(view.maxDate, null)
	assert.equal(view.enabled, true)
	assert.equal(node.appliedStyle, undefined)
	update({})
	assert.equal(dateValue(view).getTime(), initial)
})

test('DatePicker action bridge normalizes, suppresses duplicates and removes stale event handlers', () => {
	const { view, update, onDateChange, events } = controlFixture()
	const date = new Date(2026, 4, 10)
	update({ date, onDateChange })
	const initialCount = events.length
	view.dateValue = { timeIntervalSince1970: new Date(2026, 4, 14, 19).getTime() / 1000 }
	view.callback()
	assert.equal(events.length, initialCount + 1)
	assert.equal(events.at(-1).value.getTime(), new Date(2026, 4, 14).getTime())
	assert.equal(events.at(-1).oldValue.getTime(), date.getTime())
	view.callback()
	assert.equal(events.length, initialCount + 1)
	update({ date })
	assert.equal(
		dateValue(view).getDate(),
		14,
		'unchanged authored date must not reset a native edit',
	)

	view.dateValue = { timeIntervalSince1970: new Date(2026, 4, 16).getTime() / 1000 }
	view.callback()
	assert.equal(events.length, initialCount + 1)
})

test('DatePicker bounds clamp selection, then clearing bounds permits another day', () => {
	const { view, update } = controlFixture()
	update({
		date: new Date(2026, 4, 1),
		minDate: new Date(2026, 4, 10),
		maxDate: new Date(2026, 4, 20),
	})

	assert.equal(dateValue(view).getDate(), 10)
	update({
		date: new Date(2026, 4, 31),
		minDate: new Date(2026, 4, 10),
		maxDate: new Date(2026, 4, 20),
	})

	assert.equal(dateValue(view).getDate(), 20)
	update({ date: new Date(2026, 4, 31) })
	assert.equal(dateValue(view).getDate(), 31)
})

test('DatePicker rejects invalid primitives before host mutation and supports calendar rollovers', () => {
	const { api } = controlFixture()
	for (const name of ['date', 'minDate', 'maxDate']) {
		for (const value of [123, {}, 'not a date', new Date(NaN)]) {
			assert.throws(() => api.validateNodeProps('datepicker', { [name]: value }), /datepicker/)
		}
	}

	for (const name of ['year', 'month', 'day']) {
		for (const value of ['1', 1.5, NaN]) {
			assert.throws(() => api.validateNodeProps('datepicker', { [name]: value }), /integer/)
		}
	}

	const date = new Date(2026, 9, 31, 23, 59)
	assert.equal(api.calendarDate(date).getTime(), new Date(2026, 9, 31).getTime())
})

test('DatePicker rejects children and accepts all maintained layout parents', () => {
	const api = runInNewContext(fn('validateTextNesting') + '\n({validateTextNesting})')
	for (const child of ['label', '#text', 'span', 'datepicker']) {
		assert.throws(() => api.validateTextNesting('datepicker', child), /cannot contain JSX children/)
	}

	for (const parent of ['stacklayout', 'contentview', 'docklayout', 'rootlayout', 'gridlayout']) {
		api.validateTextNesting(parent, 'datepicker')
	}
})

test('DatePicker production ownership moves its native host between parents and releases it on destroy', () => {
	const actions = new Map([[3, () => {}]])
	const noop = () => {}
	const view = () => ({
		subviews: [] as any[],
		superview: null as any,
		invalidateIntrinsicContentSize: noop,
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
			props: { onDateChange: () => {} },
			children: [],
			parent: null,
			container,
		}

		container.nodes.set(id, item)
		return item
	}

	const left: any = node(1, 'contentview'),
		right: any = node(2, 'contentview'),
		picker: any = node(3, 'datepicker')

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
	assert.equal(picker.props.onDateChange, undefined)
	assert.equal(picker.parent, null)
	assert.equal(right.contentChild, null)
	assert.equal(right.children.length, 0)
})
