import type { DateAbsoluteOperatorValue, FilterValueDateAbsolute } from './props'
import { parseInstant } from './power-search-date-range.macos'

export function absoluteFilterText(seconds: number, dateOnly = false): string {
	try {
		const iso = new Date(Math.floor(seconds * 1000)).toISOString()
		return dateOnly ? iso.slice(0, iso.indexOf('T')) : iso
	} catch { return '' }
}

export function absoluteFilterValue(text: string, operator: DateAbsoluteOperatorValue, original?: FilterValueDateAbsolute): {
	value: FilterValueDateAbsolute | null; error: string | null
} {
	const dateOnly = !!operator.isDateOnly
	const unchanged = original && absoluteFilterText(original.unixSeconds, dateOnly)
	if (original && unchanged && text === unchanged) {
		// Preserve stored precision/expanded years; date-only intentionally drops time.
		const unixSeconds = dateOnly ? Date.parse(`${unchanged}T00:00:00.000Z`) / 1000 : original.unixSeconds
		if (Number.isFinite(unixSeconds)) return { value: { type: 'date_absolute', unixSeconds }, error: null }
	}
	if (dateOnly && !/^\d{4}-\d{2}-\d{2}$/.test(text.trim())) {
		return { value: null, error: 'Enter a UTC date as YYYY-MM-DD.' }
	}
	const unixSeconds = parseInstant(text)
	if (unixSeconds === null) return { value: null, error: dateOnly ? 'Enter a valid calendar date as YYYY-MM-DD.' : 'Enter a valid UTC date or date/time, such as 2026-10-29T12:30:00Z.' }
	return { value: { type: 'date_absolute', unixSeconds }, error: null }
}
