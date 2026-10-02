import type { DateInputMessages } from './props'

const defaults: DateInputMessages = {
	previousMonth: 'Previous month',
	nextMonth: 'Next month',
	openCalendar: 'Open calendar',
	closeCalendar: 'Close calendar',
	openTimePicker: 'Open time picker',
	closeTimePicker: 'Close time picker',
	invalidDate: 'Enter a valid date',
	invalidTime: 'Enter a valid time',
	invalidDateTime: 'Enter a valid date and time',
	selected: (date) => `Selected: ${date}`,
	rangeStart: (date) => `Range start: ${date}`,
	rangeEnd: (date) => `Range end: ${date}`,
	inRange: (date) => `In range: ${date}`,
	rangeSelected: (start, end) => `Date range: ${start} – ${end}`,
	rangeCleared: 'Range cleared',
	cleared: 'Value cleared',
}

export function dateMessages(messages?: Partial<DateInputMessages>): DateInputMessages {
	return {
		...defaults,
		...Object.fromEntries(
			Object.entries(messages ?? {}).filter(([, value]) => value !== undefined),
		),
	}
}
