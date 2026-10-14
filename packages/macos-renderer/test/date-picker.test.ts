import { runInNewContext } from 'node:vm'
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { NSDatePicker } from '@octane-xplat/platform/macos'
import { sourceWithoutImports } from './mock-globals.ts'


const source = sourceWithoutImports(new URL('../src/index.ts', import.meta.url))

const slice = source.slice(
	source.indexOf('function attachDatePicker('),
	source.indexOf('const openSheets'),
)

const dateFromMillis = source.slice(
	source.indexOf('function dateFromMillis('),
	source.indexOf('function attachDatePicker('),
)

const ELEMENTS = { YearMonthDay: 0x00e0, HourMinute: 0x000c }
const STYLES = { TextFieldAndStepper: 0, ClockAndCalendar: 1, TextField: 2 }

function fixture() {
	const pickers = []
	const actions = new Map()
	const anchor = () => ({
		constraintEqualToAnchor() {
			return { active: false }
		},
	})

	const view = { addSubview() {}, leadingAnchor: anchor(), trailingAnchor: anchor(), topAnchor: anchor(), bottomAnchor: anchor() }

	const context = runInNewContext(
		dateFromMillis +
			'\n' +
			slice +
			'\n({ attach: (v, o, c) => attachDatePicker(v, o, c) })',
		{
			NSDate: Object.assign(function NSDate() {}, {
				dateWithTimeIntervalSince1970: (s) => ({ timeIntervalSince1970: s }),
			}),
			NSDatePicker: Object.assign(function NSDatePicker() {}, {
				alloc: () => ({
					init() {
						const picker = {
							dateValue: null,
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

	return { attach: context.attach, view, pickers, actions }
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
