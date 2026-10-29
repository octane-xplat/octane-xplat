import type { DateTimeRange, DateTimeRangePart } from './props'
import { resolveDateTimeRangePart } from './power-search-config'

export const rangeUnits = ['second', 'minute', 'hour', 'day', 'week', 'month', 'year'] as const
export interface RangePartDraft {
	kind: DateTimeRangePart['type']
	instant: string
	amount: string
	unit: string
	anchorKey: string
	original?: DateTimeRangePart
}
export interface RangeDraft { start: RangePartDraft; end: RangePartDraft }
function instantText(seconds: number): string {
	try { return new Date(seconds * 1000).toISOString() } catch { return '' }
}
export function rangePartDraft(part: DateTimeRangePart): RangePartDraft {
	return { kind: part.type, instant: part.type === 'ABSOLUTE' ? instantText(part.unixSeconds) : '',
		amount: part.type === 'RELATIVE' ? String(part.backValue) : '1', unit: part.type === 'RELATIVE' ? part.unit : 'day',
		anchorKey: part.type === 'RELATIVE' ? part.anchorKey ?? '' : '', original: part }
}
export function rangeDraft(value?: DateTimeRange): RangeDraft {
	return { start: rangePartDraft(value?.start ?? { type: 'NOW' }), end: rangePartDraft(value?.end ?? { type: 'NOW' }) }
}
function parseInstant(text: string): number | null {
	// UTC date or date-time, with optional seconds/milliseconds; reject rollover.
	const match = /^(\d{4}-\d{2}-\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?Z?)?$/.exec(text.trim())
	if (!match) return null
	const canonical = `${match[1]}T${match[2] ?? '00'}:${match[3] ?? '00'}:${match[4] ?? '00'}.${(match[5] ?? '').padEnd(3, '0')}Z`
	const milliseconds = Date.parse(canonical)
	return Number.isFinite(milliseconds) && new Date(milliseconds).toISOString() === canonical ? milliseconds / 1000 : null
}
function partValue(draft: RangePartDraft): DateTimeRangePart | null {
	if (draft.kind === 'NOW') return { type: 'NOW' }
	if (draft.kind === 'ABSOLUTE') {
		const original = draft.original
		// Preserve a stored instant's precision/expanded year on a no-op edit.
		if (original?.type === 'ABSOLUTE' && Number.isFinite(original.unixSeconds) && draft.instant && draft.instant === instantText(original.unixSeconds)) return { ...original }
		const unixSeconds = parseInstant(draft.instant)
		return unixSeconds === null ? null : { type: 'ABSOLUTE', unixSeconds }
	}
	if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(draft.amount.trim()) || !rangeUnits.includes(draft.unit as typeof rangeUnits[number])) return null
	const backValue = Number(draft.amount)
	if (!Number.isFinite(backValue)) return null
	const anchorKey = draft.anchorKey || (draft.original?.type === 'RELATIVE' && draft.original.anchorKey === '' ? '' : undefined)
	return { type: 'RELATIVE', backValue, unit: draft.unit as typeof rangeUnits[number], ...(anchorKey !== undefined ? { anchorKey } : {}) }
}
export function rangeValue(draft: RangeDraft, nowSeconds = Math.floor(Date.now() / 1000)): { value: DateTimeRange | null; error: string | null } {
	const start = partValue(draft.start), end = partValue(draft.end)
	if (!start || !end) return { value: null, error: 'Enter a valid UTC date/time or a finite relative amount and unit.' }
	const from = resolveDateTimeRangePart(start, nowSeconds), to = resolveDateTimeRangePart(end, nowSeconds)
	if (![from, to].every(Number.isFinite) || from > to) return { value: null, error: 'Start must be no later than end at the time you apply the range.' }
	return { value: { start, end }, error: null }
}
