import {
	plainDateAddDays,
	plainDateAddMonths,
	plainDateFromISO,
	plainDateToISO,
	type PlainDate,
} from './datetime'

import type { ISODateString } from './props'
import type { CalendarMonthGrid } from './calendar-core'

export interface DateKeyEvent {
	key: string
	ctrlKey?: boolean
	metaKey?: boolean
	altKey?: boolean
	isComposing?: boolean
	keyCode?: number
	defaultPrevented?: boolean
}

export function isDateComposing(event: Pick<DateKeyEvent, 'isComposing' | 'keyCode'>): boolean {
	return !!event.isComposing || event.keyCode === 229
}

/** Portable navigation model. Adapters own event delivery and actual focus.
 * Vertical traversal retains the weekday column; row edges never leave the row.
 * Unbounded predicates are searched for at most one year to avoid hanging. */
export function calendarKeyTarget(input: {
	iso: ISODateString
	event: DateKeyEvent
	months: readonly CalendarMonthGrid[]
	isDisabled: (date: PlainDate) => boolean
	rtl?: boolean
	min?: ISODateString
	max?: ISODateString
}): ISODateString | null {
	const { event, months, isDisabled } = input
	const current = plainDateFromISO(input.iso)
	if (!current || event.defaultPrevented || isDateComposing(event)) {
		return null
	}

	const cells = months.flatMap((month) => month.weeks.flat())
	const eligible = (day: (typeof cells)[number]) => !day.isOutsideMonth && !isDisabled(day.date)
	if (event.key === 'Home' || event.key === 'End') {
		let candidates = cells
		if (!event.ctrlKey && !event.metaKey) {
			const index = cells.findIndex((day) => day.iso === input.iso && !day.isOutsideMonth)
			if (index < 0) {
				return null
			}

			candidates = cells.slice(Math.floor(index / 7) * 7, Math.floor(index / 7) * 7 + 7)
		}

		if (event.key === 'End') {
			candidates = [...candidates].reverse()
		}

		return candidates.find(eligible)?.iso ?? null
	}

	let step = 0
	let target = current
	switch (event.key) {
		case 'ArrowLeft':
			step = input.rtl ? 1 : -1
			break
		case 'ArrowRight':
			step = input.rtl ? -1 : 1
			break
		case 'ArrowUp':
			step = -7
			break
		case 'ArrowDown':
			step = 7
			break
		case 'PageUp':
			target = plainDateAddMonths(current, -1)
			step = -1
			break
		case 'PageDown':
			target = plainDateAddMonths(current, 1)
			step = 1
			break
		default:
			return null
	}

	if (event.key.startsWith('Arrow')) {
		target = plainDateAddDays(current, step)
	}

	// Search the requested page in the preferred direction, then back toward
	// its other edge when a bound/disabled run blocks that side.
	if (event.key.startsWith('Page')) {
		const page = target
		for (const direction of [step, -step]) {
			let candidate = page
			for (let attempts = 0; attempts < 31; attempts++) {
				if (candidate.month !== page.month || candidate.year !== page.year) {
					break
				}

				const iso = plainDateToISO(candidate)
				if (
					(!input.min || iso >= input.min) &&
					(!input.max || iso <= input.max) &&
					!isDisabled(candidate)
				) {
					return iso
				}

				candidate = plainDateAddDays(candidate, direction)
			}
		}

		return null
	}

	for (let attempts = 0; (attempts + 1) * Math.abs(step) <= 366; attempts++) {
		const iso = plainDateToISO(target)
		if ((input.min && iso < input.min) || (input.max && iso > input.max)) {
			return null
		}

		if (!isDisabled(target)) {
			return iso
		}

		target = plainDateAddDays(target, step)
	}

	return null
}

/** Clamp highlighted options; -1 means no active option, including empty lists. */
export function timeOptionIndex(key: string, index: number, length: number): number {
	if (!length) {
		return -1
	}

	if (key === 'Home') {
		return 0
	}

	if (key === 'End') {
		return length - 1
	}

	return Math.max(0, Math.min(length - 1, index + (key === 'ArrowUp' ? -1 : 1)))
}
