import { runSlice } from './mock-globals.ts'
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { NSDatePicker } from '@octane-xplat/platform/macos'
import { sourceWithoutImports } from './mock-globals.ts'

const source = sourceWithoutImports(new URL('../src/index.ts', import.meta.url))

const slice = source.slice(
	source.indexOf('function attachDatePicker('),
	source.indexOf('const sheetWindowCancels ='),
)

const dateFromMillis = source.slice(
	source.indexOf('function dateFromMillis('),
	source.indexOf('function attachDatePicker('),
)

const ELEMENTS = { YearMonthDay: 0x00e0, HourMinute: 0x000c }
const STYLES = { TextFieldAndStepper: 0, ClockAndCalendar: 1, TextField: 2 }

function fixture(failure: { constraint?: number } = {}) {
	const pickers: any[] = [], constraints: any[] = []
	const actions = new Map()
	const anchor = () => ({
		constraintEqualToAnchor() {
			let active = false
			const index = constraints.length
			const constraint = {
				get active() { return active },
				set active(value: boolean) { if (value && failure.constraint === index) throw Error('native constraint failed'); active = value },
			}
			constraints.push(constraint)
			return constraint
		},
	})

	const view = {
		window: {} as object | null,
		addSubview(picker: any) { picker.superview = this },
		leadingAnchor: anchor(),
		trailingAnchor: anchor(),
		topAnchor: anchor(),
		bottomAnchor: anchor(),
	}

	const context = runSlice(
		dateFromMillis + '\n' + slice + '\n({ attach: (v, o, c) => attachDatePicker(v, o, c) })',
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

			NSDate: Object.assign(function NSDate() {}, {
				dateWithTimeIntervalSince1970: (s) => ({ timeIntervalSince1970: s }),
			}),
			NSDatePicker: Object.assign(function NSDatePicker() {}, {
				alloc: () => ({
					init() {
						const picker: any = {
							dateValue: null,
							removed: 0,
							setAccessibilityLabel(label: string) { this.accessibilityLabel = label },
							removeFromSuperview() { this.removed++; this.superview = null },
							leadingAnchor: anchor(),
							trailingAnchor: anchor(),
							topAnchor: anchor(),
							bottomAnchor: anchor(),
						}

						pickers.push(picker)

						return picker
					},
				}),
			}),
			DATE_PICKER_ELEMENTS: ELEMENTS,
			DATE_PICKER_STYLES: STYLES,
			buttonActionTarget: {},
			nextActionId: 1,
			actionHandlers: actions,
		},
	)

	return { attach: context.attach, view, pickers, actions, constraints }
}

test('dateAndTime mode combines the year-month-day and hour-minute elements', () => {
	const { attach, view, pickers } = fixture()
	attach(view, { mode: 'dateAndTime' }, () => {})
	assert.equal(pickers[0].datePickerElements, ELEMENTS.YearMonthDay | ELEMENTS.HourMinute)
	// The graphical calendar cannot render the time group — the combined
	// mode always draws the text-field style.
	assert.equal(pickers[0].datePickerStyle, STYLES.TextField)
})

test('date and time modes pick their element group and style', () => {
	const { attach, view, pickers } = fixture()
	attach(view, { mode: 'date' }, () => {})
	attach(view, { mode: 'date', style: 'graphical' }, () => {})
	attach(view, { mode: 'time' }, () => {})
	assert.equal(pickers[0].datePickerElements, ELEMENTS.YearMonthDay)
	assert.equal(pickers[0].datePickerStyle, STYLES.TextField)
	// 'graphical' is the clock-and-calendar picker style.
	assert.equal(pickers[1].datePickerStyle, STYLES.ClockAndCalendar)
	assert.equal(pickers[2].datePickerElements, ELEMENTS.HourMinute)
	assert.equal(pickers[2].datePickerStyle, STYLES.ClockAndCalendar)
})

test('update without a selection leaves the picked value; update with one pushes it', () => {
	const { attach, view, pickers } = fixture()
	const handle = attach(view, { mode: 'date' }, () => {})
	pickers[0].dateValue = { timeIntervalSince1970: 1700000000 }
	// An uncontrolled render must not snap the picker back.
	handle.update({ selectionMillis: undefined, enabled: true })
	assert.equal(pickers[0].dateValue.timeIntervalSince1970, 1700000000)

	handle.update({ selectionMillis: 1800000000 * 1000, enabled: true })
	assert.equal(pickers[0].dateValue.timeIntervalSince1970, 1800000000)
})

test('programmatic updates suppress action echoes, update native labels and clear removed bounds', () => {
	const { attach, view, pickers, actions } = fixture(), changes: number[] = []
	const handle = attach(view, { selectionMillis: 1000 }, (millis: number) => changes.push(millis)), picker = pickers[0]
	const action = actions.get(picker.tag)
	let date = picker.dateValue
	Object.defineProperty(picker, 'dateValue', { get: () => date, set: (value) => { date = value; action() } })
	handle.update({ selectionMillis: 2000, minimumMillis: 0, maximumMillis: 3000, accessibilityLabel: 'Departure' })
	assert.deepEqual(changes, []); assert.equal(picker.accessibilityLabel, 'Departure')
	assert.equal(picker.minDate.timeIntervalSince1970, 0); assert.equal(picker.maxDate.timeIntervalSince1970, 3)
	handle.update({ selectionMillis: 2000 }); assert.equal(picker.minDate, null); assert.equal(picker.maxDate, null); assert.equal(picker.accessibilityLabel, '')
	picker.dateValue = { timeIntervalSince1970: 2.5 }; assert.deepEqual(changes, [2500]); handle.detach()
})

test('disabled, native-disabled, detached-window/view and retired actions cannot dispatch', () => {
	const { attach, view, pickers, actions, constraints } = fixture(), changes: number[] = []
	const handle = attach(view, { selectionMillis: 1000 }, (millis: number) => changes.push(millis)), picker = pickers[0], action = actions.get(picker.tag)
	picker.dateValue = { timeIntervalSince1970: 2 }
	handle.update({ enabled: false }); action(); assert.deepEqual(changes, [])
	handle.update({ enabled: true }); picker.isEnabled = () => false; action(); assert.deepEqual(changes, [])
	picker.isEnabled = () => true; view.window = null; action(); assert.deepEqual(changes, [])
	view.window = {}; picker.superview = null; action(); assert.deepEqual(changes, [])
	picker.superview = view; action(); assert.deepEqual(changes, [2000])
	handle.detach(); handle.detach(); action(); handle.update({ selectionMillis: 3000 })
	assert.deepEqual(changes, [2000]); assert.equal(actions.size, 0); assert.equal(picker.removed, 1)
	assert.ok(constraints.every((constraint) => !constraint.active))
})

test('invalid raw options disable without unsafe native dates and invalid/out-of-range events do not emit', () => {
	const { attach, view, pickers, actions } = fixture(), changes: number[] = []
	const handle = attach(view, { selectionMillis: 1000, minimumMillis: 0, maximumMillis: 3000 }, (millis: number) => changes.push(millis)), picker = pickers[0], action = actions.get(picker.tag)
	for (const seconds of [NaN, Infinity, 1e30, -1, 4]) { picker.dateValue = { timeIntervalSince1970: seconds }; action() }
	assert.deepEqual(changes, [])
	picker.dateValue = { timeIntervalSince1970: 1 }
	for (const options of [{ selectionMillis: NaN }, { minimumMillis: 4000, maximumMillis: 3000 }, { selectionMillis: 5000, maximumMillis: 4000 }, { maximumMillis: 1e30 }]) {
		handle.update(options); assert.equal(picker.enabled, false); assert.equal(picker.dateValue.timeIntervalSince1970, 1); action()
	}
	assert.deepEqual(changes, []); handle.update({ selectionMillis: 2000, minimumMillis: 0, maximumMillis: 3000 })
	assert.equal(picker.enabled, true); assert.equal(picker.dateValue.timeIntervalSince1970, 2); handle.detach()
})

test('partial constraint failure removes the picker and deactivates owned constraints', () => {
	const { attach, view, pickers, actions, constraints } = fixture({ constraint: 1 })
	assert.equal(attach(view, { selectionMillis: 1000 }, () => {}), null)
	assert.equal(actions.size, 0); assert.equal(pickers[0].removed, 1); assert.equal(pickers[0].target, null)
	assert.ok(constraints.every((constraint) => !constraint.active))
})

test('native update failure retires the handle before propagating to its owner', () => {
	const { attach, view, pickers, actions, constraints } = fixture(), changes: number[] = []
	const handle = attach(view, { selectionMillis: 1000 }, (millis: number) => changes.push(millis)), picker = pickers[0], action = actions.get(picker.tag)
	Object.defineProperty(picker, 'maxDate', { configurable: true, set: () => { throw Error('native range failed') } })
	assert.throws(() => handle.update({ selectionMillis: 2000, maximumMillis: 3000 }), /native range failed/)
	action(); handle.detach(); assert.deepEqual(changes, []); assert.equal(actions.size, 0); assert.equal(picker.removed, 1)
	assert.ok(constraints.every((constraint) => !constraint.active))
})

test('unchanged bounds/value do not rewrite an editing control and disjoint ranges replace without transient inversion', () => {
	const { attach, view, pickers } = fixture()
	const handle = attach(view, { selectionMillis: 2000, minimumMillis: 1000, maximumMillis: 3000 }, () => {}), picker = pickers[0]
	let min = picker.minDate, max = picker.maxDate, date = picker.dateValue, writes = 0
	Object.defineProperty(picker, 'minDate', { get: () => min, set: (next) => { assert.ok(!next || !max || next.timeIntervalSince1970 <= max.timeIntervalSince1970); min = next; writes++ } })
	Object.defineProperty(picker, 'maxDate', { get: () => max, set: (next) => { assert.ok(!next || !min || next.timeIntervalSince1970 >= min.timeIntervalSince1970); max = next; writes++ } })
	Object.defineProperty(picker, 'dateValue', { get: () => date, set: (next) => { date = next; writes++ } })
	handle.update({ selectionMillis: 2000, minimumMillis: 1000, maximumMillis: 3000 }); assert.equal(writes, 0)
	handle.update({ selectionMillis: 5000, minimumMillis: 4000, maximumMillis: 6000 })
	assert.equal(min.timeIntervalSince1970, 4); assert.equal(max.timeIntervalSince1970, 6); assert.equal(date.timeIntervalSince1970, 5)
	handle.detach()
})
