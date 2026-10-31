/** @jsxImportSource @octane-xplat/jsx */
import { useState } from 'octane'
import {
	Calendar,
	DateInput,
	DateRangeInput,
	DateTimeInput,
	Pressable,
	Text,
	TimeInput,
	View,
	useCalendarConstraints,
	useCalendarDays,
	useCalendarNavigation,
} from '@octane-xplat/ui'

export const state: Record<string, any> = {
	calPick: null,
	rangePick: null,
	datePopover: null,
	dateTyped: null,
	timeTyped: null,
	timeSheet: null,
	dtPick: null,
	rangeInput: null,
	hookMonth: null,
	hookDays: 0,
	hookDisabledOut: null,
	hookDisabledIn: null,
}

function CalHookProbe() @{
	const nav = useCalendarNavigation({ value: '2025-06-15' })
	const grid = useCalendarDays({ year: nav.baseMonth.year, month: nav.baseMonth.month })
	const cons = useCalendarConstraints({ min: '2025-06-01', max: '2025-06-30' })
	state.hookMonth = `${nav.baseMonth.year}-${String(nav.baseMonth.month).padStart(2, '0')}`
	state.hookDays = grid.weeks.reduce((n, w) => n + w.length, 0)
	state.hookDisabledOut = cons.isDateDisabled({ year: 2025, month: 7, day: 4 })
	state.hookDisabledIn = cons.isDateDisabled({ year: 2025, month: 6, day: 15 })
	<View style={{ display: 'flex', flexDirection: 'column' }}>
		<Pressable
			id="hook-next"
			accessibilityRole="button"
			onPress={() => nav.navigateMonths(1)}
		>
			<Text>HOOK NEXT MONTH</Text>
		</Pressable>
	</View>
}

export function CalProbe() @{
	const [calVal, setCalVal] = useState<any>('2025-06-10')
	const [rangeVal, setRangeVal] = useState<any>({ start: '2025-08-08', end: '2025-08-12' })

	<View style={{ display: 'flex', flexDirection: 'column', width: 620 }}>
		<CalHookProbe />
		<Calendar
			id="cal"
			mode="single"
			value={calVal}
			onChange={(iso) => {
				setCalVal(iso)
				state.calPick = iso
			}}
		/>
		<Calendar
			id="cal-range"
			mode="range"
			value={rangeVal}
			onChange={(r) => {
				setRangeVal(r)
				state.rangePick = r
			}}
		/>
	</View>
}

export function InputsProbe() @{
	const [dateVal, setDateVal] = useState<any>(null)
	const [typedVal, setTypedVal] = useState<any>(null)
	const [timeVal, setTimeVal] = useState<any>(null)
	const [sheetTime, setSheetTime] = useState<any>('13:30')
	const [dtVal, setDtVal] = useState<any>('2025-06-01T10:00')
	const [rangeInputVal, setRangeInputVal] = useState<any>(null)

	<View style={{ display: 'flex', flexDirection: 'column', width: 620 }}>
		<DateInput
			id="di"
			label="Date"
			messages={{ openCalendar: 'Open di calendar' }}
			min="2025-06-01"
			max="2025-06-30"
			value={dateVal}
			onChange={(v) => {
				setDateVal(v)
				state.datePopover = v
			}}
		/>
		<DateInput
			id="di-typed"
			label="Typed date"
			value={typedVal}
			onChange={(v) => {
				setTypedVal(v)
				state.dateTyped = v
			}}
		/>
		<TimeInput
			id="ti"
			label="Time"
			value={timeVal}
			onChange={(v) => {
				setTimeVal(v)
				state.timeTyped = v
			}}
		/>
		<TimeInput
			id="ti-sheet"
			label="Sheet time"
			messages={{ openTimePicker: 'Open sheet picker' }}
			presentation="bottom-sheet"
			hourFormat="24h"
			value={sheetTime}
			onChange={(v) => {
				setSheetTime(v)
				state.timeSheet = v
			}}
		/>
		<DateTimeInput
			id="dti"
			label="Date and time"
			value={dtVal}
			onChange={(v) => {
				setDtVal(v)
				state.dtPick = v
			}}
		/>
		<DateRangeInput
			id="dri"
			label="Range"
			min="2025-06-01"
			max="2025-06-30"
			value={rangeInputVal}
			onChange={(v) => {
				setRangeInputVal(v)
				state.rangeInput = v
			}}
		/>
	</View>
}
