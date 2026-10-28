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

function controlFixture() {
	const events: any[] = [],
		handlers = new Map()

	const view: any = { sizeToFit() {}, removeFromSuperview() {} }
	const constants = source.slice(
		source.indexOf('function droppedPropClears('),
		source.indexOf('\nfunction applyProps('),
	)

	const api = runSlice(
		constants +
			'\n' +
			[
				'timeOfDay',
				'makeTimePicker',
				'notifyTimeChange',
				'syncTimePicker',
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
			'\n({timeOfDay,makeTimePicker,notifyTimeChange,syncTimePicker,validateNodeProps,applyProps,applyCommand})',
		{
			elementBehaviors: new Map(),
			behaviorOf: () => undefined,
			isManualLayoutParent: (t: string) =>
				[
					'gridlayout',
					'liquidglass',
					'absolutelayout',
					'contentview',
					'actionbar',
					'docklayout',
					'wraplayout',
					'rootlayout',
				].includes(t),
			registerElementType: () => {},

			Date,
			NSDatePicker: { alloc: () => ({ initWithFrame: () => view }) },
			NSDate: {
				dateWithTimeIntervalSince1970: (seconds: number) => ({ timeIntervalSince1970: seconds }),
			},
			NSDatePickerStyle: { TextFieldAndStepper: 0 },
			NSDatePickerElementFlags: { HourMinute: 12 },
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
	const node: any = { id: 1, type: 'timepicker', props: {}, children: [], parent: null, container }
	const control = api.makeTimePicker(node)
	node.view = control.view
	node.actionId = control.actionId
	container.nodes.set(1, node)
	const update = (props: any) => api.applyCommand(container, { op: 'update', id: 1, props })
	return { api, node, view, events, update, onTimeChange: (event: any) => events.push(event) }
}

const dateValue = (view: any) => new Date(view.dateValue.timeIntervalSince1970 * 1000)

test('TimePicker rejects children and accepts all maintained layout parents', () => {
	const api = runSlice(fn('validateTextNesting') + '\n({validateTextNesting})')
	for (const child of ['label', '#text', 'span', 'timepicker']) {
		assert.throws(() => api.validateTextNesting('timepicker', child), /cannot contain JSX children/)
	}

	for (const parent of ['stacklayout', 'contentview', 'docklayout', 'rootlayout', 'gridlayout']) {
		api.validateTextNesting(parent, 'timepicker')
	}
})

test('TimePicker production ownership moves its native host between parents and releases it on destroy', () => {
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

	const api = runSlice(
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
			elementBehaviors: new Map(),
			behaviorOf: () => undefined,
			isManualLayoutParent: (t: string) =>
				[
					'gridlayout',
					'liquidglass',
					'absolutelayout',
					'contentview',
					'actionbar',
					'docklayout',
					'wraplayout',
					'rootlayout',
				].includes(t),
			registerElementType: () => {},

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
			props: { onTimeChange: () => {} },
			children: [],
			parent: null,
			container,
		}

		container.nodes.set(id, item)
		return item
	}

	const left: any = node(1, 'contentview'),
		right: any = node(2, 'contentview'),
		picker: any = node(3, 'timepicker')

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
	assert.equal(picker.props.onTimeChange, undefined)
	assert.equal(picker.parent, null)
	assert.equal(right.contentChild, null)
	assert.equal(right.children.length, 0)
})

const minutes = (view: any) => dateValue(view).getHours() * 60 + dateValue(view).getMinutes()
const bound = (view: any, key: string) => {
	const date = new Date(view[key].timeIntervalSince1970 * 1000)
	return date.getHours() * 60 + date.getMinutes()
}

test('TimePicker uses HourMinute chrome and normalizes Dates/strings without mutating inputs', () => {
	const { view, update, events, onTimeChange } = controlFixture()
	assert.equal(view.datePickerElements, 12)
	assert.equal(view.datePickerStyle, 0)
	assert.equal(view.datePickerMode, 0)
	assert.equal(view.action, 'controlChanged:')
	assert.equal(view.translatesAutoresizingMaskIntoConstraints, false)
	const date = new Date(2026, 4, 10, 17, 25, 42, 120)
	update({ time: date, onTimeChange })
	assert.equal(dateValue(view).getTime(), new Date(0, 0, 0, 17, 25).getTime())
	assert.equal(date.getSeconds(), 42)
	assert.equal(events.at(-1).eventName, 'timeChange')
	assert.equal(events.at(-1).object, view)
	const count = events.length
	update({ time: '17:25:59', onTimeChange })
	assert.equal(events.length, count)
	update({ time: '08:09', onTimeChange })
	assert.equal(minutes(view), 489)
	assert.equal(events.at(-1).oldValue.getTime(), new Date(0, 0, 0, 17, 25).getTime())
})

test('TimePicker restores dropped time/components, bounds, enabled and styles', () => {
	const { node, view, update } = controlFixture()
	const initial = node.timePickerDefault.getTime()
	update({
		time: '09:10',
		minHour: 8,
		minMinute: 30,
		maxHour: 18,
		maxMinute: 20,
		isEnabled: false,
		style: { opacity: 0.5 },
	})

	assert.equal(bound(view, 'minDate'), 510)
	assert.equal(bound(view, 'maxDate'), 1100)
	assert.equal(view.enabled, false)
	update({ time: '10:20', hour: 11, minute: 35 })
	assert.equal(minutes(view), 695)
	assert.equal(bound(view, 'minDate'), 0)
	assert.equal(bound(view, 'maxDate'), 1439)
	assert.equal(view.enabled, true)
	assert.equal(node.appliedStyle, undefined)
	update({})
	assert.equal(dateValue(view).getTime(), initial)
})

test('TimePicker composes bounds atomically independent of prop order and clamps selection', () => {
	const { node, view, update } = controlFixture()
	update({ time: '09:00', minHour: 10, minMinute: 30, maxHour: 12, maxMinute: 15 })
	assert.equal(minutes(view), 630)
	update({ time: '14:00', maxMinute: 45, minMinute: 15, maxHour: 16, minHour: 14 })
	assert.equal(minutes(view), 855)
	assert.equal(bound(view, 'minDate'), 855)
	assert.equal(bound(view, 'maxDate'), 1005)
	update({ time: '20:00', minHour: 19, minMinute: 30, maxHour: 18, maxMinute: 45 })
	assert.equal(minutes(view), 1005)
	assert.deepEqual(Array.from(node.timePickerBounds), [855, 1005])
	assert.equal(bound(view, 'minDate'), 855)
	assert.equal(bound(view, 'maxDate'), 1005)
	update({ time: '00:00', minHour: 5, minMinute: 20, maxHour: 5, maxMinute: 20 })
	assert.equal(minutes(view), 320)
	update({ time: '23:59' })
	assert.equal(minutes(view), 1439)
})

test('TimePicker action normalizes/clamps, suppresses duplicates and clears stale handlers', () => {
	const { view, update, events, onTimeChange } = controlFixture()
	update({ time: '10:20', minHour: 9, maxHour: 17, onTimeChange })
	let count = events.length
	view.dateValue = { timeIntervalSince1970: new Date(2026, 5, 1, 10, 20, 50).getTime() / 1000 }
	view.callback()
	assert.equal(events.length, count)
	assert.equal(dateValue(view).getTime(), new Date(0, 0, 0, 10, 20).getTime())
	view.dateValue = { timeIntervalSince1970: new Date(2026, 5, 1, 20, 30).getTime() / 1000 }
	view.callback()
	assert.equal(minutes(view), 1079)
	assert.equal(events.length, count + 1)
	update({ time: new Date(2027, 0, 1, 10, 20), minHour: 9, maxHour: 17, onTimeChange })
	assert.equal(minutes(view), 1079, 'equal authored time must not overwrite a native edit')
	count = events.length
	update({ time: '10:20' })
	view.dateValue = { timeIntervalSince1970: new Date(2026, 5, 1, 11, 30).getTime() / 1000 }
	view.callback()
	assert.equal(events.length, count)
})

test('TimePicker rejects malformed input before mutating effective state or native bounds', () => {
	const { api, node, view, update } = controlFixture()
	update({ time: '10:20', minHour: 9, maxHour: 17 })
	const previous = node.props
	for (const value of [
		123,
		{},
		new Date(NaN),
		'',
		'9:30',
		'24:00',
		'12:60',
		'12:30:60',
		'2026-01-01',
		'10:20junk',
		'10:20\n',
	]) {
		assert.throws(() => update({ time: value }), /timepicker/)
		assert.equal(node.props, previous)
		assert.equal(minutes(view), 620)
		assert.equal(bound(view, 'minDate'), 540)
	}

	for (const name of ['hour', 'minute', 'minHour', 'minMinute', 'maxHour', 'maxMinute']) {
		for (const value of [-1, 60, '1', 1.5, NaN, Infinity]) {
			assert.throws(() => api.validateNodeProps('timepicker', { [name]: value }), /integer/)
		}
	}

	assert.throws(() => api.timeOfDay('bad'), { name: 'TypeError' })
})

test('TimePicker dropping an explicit creation-time value restores it after native edits', () => {
	const { node, view, update } = controlFixture()
	const initial = new Date(node.timePickerDefault)
	update({ time: initial })
	view.dateValue = {
		timeIntervalSince1970:
			new Date(0, 0, 0, (initial.getHours() + 1) % 24, initial.getMinutes()).getTime() / 1000,
	}

	view.callback()
	assert.notEqual(dateValue(view).getTime(), initial.getTime())
	update({})
	assert.equal(dateValue(view).getTime(), initial.getTime())
})
