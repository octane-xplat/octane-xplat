/**
 * Portable date/time core shared by Calendar and the date/time inputs.
 *
 * Values are ISO strings, never `Date` — `YYYY-MM-DD`, `HH:MM[:SS]`, and
 * `YYYY-MM-DDTHH:MM[:SS]` carry calendar/wall-clock intent across web,
 * NativeScript, and serialization boundaries. `Date` appears only where the
 * platform contract needs one: `dateConstraints` callbacks and Calendar's
 * single-mode `onChange` second argument.
 *
 * Locale display goes through `Intl.DateTimeFormat` (V8 on Android, JSC on
 * iOS/macOS — all provide it) with a fixed English fallback so formatting
 * never throws on a runtime with a reduced ICU.
 */

import type {
	DateRange,
	DayOfWeek,
	DayOfWeekName,
	ISODateString,
	ISODateTimeString,
	ISOTimeString,
} from './props'

// ---------------------------------------------------------------------------
// Locale resolution
// ---------------------------------------------------------------------------

/** The runtime's best-effort display locale — device locale on native,
 *  runtime locale on web; falls back to 'en' when Intl is reduced. */
export function resolveLocale(locale?: string): string {
	if (locale) {
		try {
			return new Intl.DateTimeFormat(locale).resolvedOptions().locale
		} catch {}
	}

	try {
		return new Intl.DateTimeFormat().resolvedOptions().locale || 'en'
	} catch {
		return 'en'
	}
}

// ---------------------------------------------------------------------------
// PlainDate — immutable {year, month, day} arithmetic (proleptic Gregorian,
// matching upstream Astryx semantics).
// ---------------------------------------------------------------------------

export interface PlainDate {
	readonly year: number
	readonly month: number
	readonly day: number
}

const DAY_MS = 86400000

function isLeapYear(year: number): boolean {
	return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0
}

export function daysInMonth(year: number, month: number): number {
	if (month === 2) {
		return isLeapYear(year) ? 29 : 28
	}

	return [4, 6, 9, 11].includes(month) ? 30 : 31
}

function toUTCEpoch(pd: PlainDate): number {
	const d = new Date(Date.UTC(pd.year, pd.month - 1, pd.day))
	// Date.UTC maps years 0–99 onto 1900–1999; pin the real year back.
	d.setUTCFullYear(pd.year)
	return d.getTime()
}

function fromUTCEpoch(ms: number): PlainDate {
	const d = new Date(ms)
	return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate() }
}

export function plainDateCreate(year: number, month: number, day: number): PlainDate | null {
	if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
		return null
	}

	if (month < 1 || month > 12 || day < 1 || day > daysInMonth(year, month)) {
		return null
	}

	return { year, month, day }
}

export function plainDateFromDate(d: Date): PlainDate {
	return { year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate() }
}

/** Local midnight — the only `Date` conversion; DST shifts cannot move the
 *  calendar day because the day is read back from the same local zone. */
export function plainDateToDate(pd: PlainDate): Date {
	return new Date(pd.year, pd.month - 1, pd.day)
}

export function plainDateToday(): PlainDate {
	return plainDateFromDate(new Date())
}

const ISO_DATE_RE = /^(\d{4,})-(\d{1,2})-(\d{1,2})$/

export function plainDateFromISO(iso: string): PlainDate | null {
	const m = iso.match(ISO_DATE_RE)
	if (!m) {
		return null
	}

	return plainDateCreate(Number(m[1]), Number(m[2]), Number(m[3]))
}

const pad2 = (n: number) => String(n).padStart(2, '0')

export function plainDateToISO(pd: PlainDate): ISODateString {
	return `${String(pd.year).padStart(4, '0')}-${pad2(pd.month)}-${pad2(pd.day)}` as ISODateString
}

export function plainDateAddDays(pd: PlainDate, days: number): PlainDate {
	return fromUTCEpoch(toUTCEpoch(pd) + days * DAY_MS)
}

/** Month arithmetic clamps to the target month's last day
 *  (Jan 31 + 1mo → Feb 28/29) instead of rolling into the next month. */
export function plainDateAddMonths(pd: PlainDate, months: number): PlainDate {
	const total = pd.year * 12 + (pd.month - 1) + months
	const year = Math.floor(total / 12)
	const month = (total % 12) + 1
	return { year, month, day: Math.min(pd.day, daysInMonth(year, month)) }
}

export function plainDateAddYears(pd: PlainDate, years: number): PlainDate {
	return plainDateAddMonths(pd, years * 12)
}

/** Whole-day difference `a − b`; UTC epoch math makes it DST-free. */
export function plainDateDiffDays(a: PlainDate, b: PlainDate): number {
	return Math.round((toUTCEpoch(a) - toUTCEpoch(b)) / DAY_MS)
}

export function plainDateCompare(a: PlainDate, b: PlainDate): number {
	return Math.sign(toUTCEpoch(a) - toUTCEpoch(b))
}

export function plainDateIsBefore(a: PlainDate, b: PlainDate): boolean {
	return toUTCEpoch(a) < toUTCEpoch(b)
}

export function plainDateIsAfter(a: PlainDate, b: PlainDate): boolean {
	return toUTCEpoch(a) > toUTCEpoch(b)
}

export function plainDateIsEqual(a: PlainDate, b: PlainDate): boolean {
	return a.year === b.year && a.month === b.month && a.day === b.day
}

export function plainDateSetStartOfWeek(pd: PlainDate, weekStartsOn: number): PlainDate {
	const dow = plainDateToDate(pd).getDay()
	return plainDateAddDays(pd, -((dow - weekStartsOn + 7) % 7))
}

/** ISO-8601 week number. */
export function plainDateGetWeekNumber(pd: PlainDate): number {
	const d = plainDateToDate(pd)
	const dayNum = d.getDay() || 7
	d.setDate(d.getDate() + 4 - dayNum)
	const yearStart = new Date(d.getFullYear(), 0, 1)
	return Math.ceil(((d.getTime() - yearStart.getTime()) / DAY_MS + 1) / 7)
}

// ---------------------------------------------------------------------------
// Day-of-week names
// ---------------------------------------------------------------------------

export function normalizeDayOfWeek(value: DayOfWeek | DayOfWeekName | undefined): DayOfWeek {
	if (value == null) {
		return 0
	}

	if (typeof value === 'number') {
		return (value >= 0 && value <= 6 ? value : 0) as DayOfWeek
	}

	const idx = DAY_NAME_INDEX[value.toLowerCase() as DayOfWeekName]
	return (idx ?? 0) as DayOfWeek
}

const DAY_NAME_INDEX: Record<string, number> = {
	sun: 0,
	mon: 1,
	tue: 2,
	wed: 3,
	thu: 4,
	fri: 5,
	sat: 6,
	sunday: 0,
	monday: 1,
	tuesday: 2,
	wednesday: 3,
	thursday: 4,
	friday: 5,
	saturday: 6,
}

// CLDR "stand-alone short" weekday names — the 1–3 letter width Intl cannot
// express (`weekday: 'short'` is the *abbreviated* width). Table mirrors the
// CLDR 48.2 data upstream Astryx generates; exact locale → language → en.
const SHORT_WEEKDAYS: Record<
	string,
	readonly [string, string, string, string, string, string, string]
> = {
	af: ['So.', 'Ma.', 'Di.', 'Wo.', 'Do.', 'Vr.', 'Sa.'],
	ar: ['أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'],
	ca: ['dg.', 'dl.', 'dt.', 'dc.', 'dj.', 'dv.', 'ds.'],
	cs: ['ne', 'po', 'út', 'st', 'čt', 'pá', 'so'],
	da: ['sø.', 'ma.', 'ti.', 'on.', 'to.', 'fr.', 'lø.'],
	de: ['So.', 'Mo.', 'Di.', 'Mi.', 'Do.', 'Fr.', 'Sa.'],
	el: ['Κυ', 'Δε', 'Τρ', 'Τε', 'Πέ', 'Πα', 'Σά'],
	en: ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'],
	es: ['DO', 'LU', 'MA', 'MI', 'JU', 'VI', 'SA'],
	fi: ['su', 'ma', 'ti', 'ke', 'to', 'pe', 'la'],
	fr: ['di', 'lu', 'ma', 'me', 'je', 've', 'sa'],
	he: ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳'],
	hu: ['V', 'H', 'K', 'Sze', 'Cs', 'P', 'Szo'],
	it: ['dom', 'lun', 'mar', 'mer', 'gio', 'ven', 'sab'],
	ja: ['日', '月', '火', '水', '木', '金', '土'],
	ko: ['일', '월', '화', '수', '목', '금', '토'],
	nl: ['zo', 'ma', 'di', 'wo', 'do', 'vr', 'za'],
	no: ['sø.', 'ma.', 'ti.', 'on.', 'to.', 'fr.', 'lø.'],
	pl: ['nie', 'pon', 'wto', 'śro', 'czw', 'pią', 'sob'],
	pt: ['dom.', 'seg.', 'ter.', 'qua.', 'qui.', 'sex.', 'sáb.'],
	ro: ['du.', 'lu.', 'ma.', 'mi.', 'joi', 'vi.', 'sâ.'],
	ru: ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'],
	sr: ['не', 'по', 'ут', 'ср', 'че', 'пе', 'су'],
	sv: ['sö', 'må', 'ti', 'on', 'to', 'fr', 'lö'],
	tr: ['Pa', 'Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct'],
	uk: ['нд', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'],
	vi: ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'],
	zh: ['周日', '周一', '周二', '周三', '周四', '周五', '周六'],
}

export type ShortWeekdayNames = readonly [string, string, string, string, string, string, string]

export function getStandaloneShortWeekdayNames(locale: string): ShortWeekdayNames {
	try {
		const parsed = new Intl.Locale(locale)
		return SHORT_WEEKDAYS[parsed.baseName] ?? SHORT_WEEKDAYS[parsed.language] ?? SHORT_WEEKDAYS.en
	} catch {
		return SHORT_WEEKDAYS.en
	}
}

// ---------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------

const EN_MONTHS = [
	'January',
	'February',
	'March',
	'April',
	'May',
	'June',
	'July',
	'August',
	'September',
	'October',
	'November',
	'December',
]

const EN_MONTHS_SHORT = EN_MONTHS.map((m) => m.slice(0, 3))
const EN_WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

function weekdayOf(pd: PlainDate): number {
	return plainDateToDate(pd).getDay()
}

function tryIntl(
	pd: PlainDate,
	options: Intl.DateTimeFormatOptions,
	locale: string,
): string | null {
	try {
		return new Intl.DateTimeFormat(locale, { ...options, calendar: 'gregory' }).format(
			plainDateToDate(pd),
		)
	} catch {
		return null
	}
}

export type DateFormatOptions = Intl.DateTimeFormatOptions

export const DATE_FORMAT_WITH_WEEKDAY: DateFormatOptions = {
	weekday: 'long',
	year: 'numeric',
	month: 'long',
	day: 'numeric',
}

export const DATE_FORMAT_SHORT_WITH_WEEKDAY: DateFormatOptions = {
	weekday: 'short',
	month: 'short',
	day: 'numeric',
	year: 'numeric',
}

export const DATE_FORMAT_LONG: DateFormatOptions = {
	year: 'numeric',
	month: 'long',
	day: 'numeric',
}

export const DATE_FORMAT_MONTH_YEAR: DateFormatOptions = { year: 'numeric', month: 'long' }
export const DATE_FORMAT_SHORT: DateFormatOptions = { month: 'short', day: 'numeric' }
export const DATE_FORMAT_SHORT_WITH_YEAR: DateFormatOptions = {
	month: 'short',
	day: 'numeric',
	year: 'numeric',
}

/** English fallback mirrors the US-en shape of each named format so a
 *  reduced-Intl runtime still produces a complete date string. */
function fallbackFormat(pd: PlainDate, options: DateFormatOptions): string {
	const m = EN_MONTHS[pd.month - 1]
	const ms = EN_MONTHS_SHORT[pd.month - 1]
	const wd = EN_WEEKDAYS[weekdayOf(pd)]
	const wds = wd.slice(0, 3)
	const parts: string[] = []
	if (options.weekday === 'long') {
		parts.push(`${wd},`)
	} else if (options.weekday) {
		parts.push(`${wds},`)
	}

	if (options.month === 'long') {
		parts.push(options.day ? `${m} ${pd.day}` : m)
	} else if (options.month === 'short') {
		parts.push(`${ms} ${pd.day}`)
	} else if (options.day) {
		parts.push(String(pd.day))
	}

	if (options.year) {
		parts.push(String(pd.year))
	}

	return parts.join(' ')
}

export function plainDateFormat(
	pd: PlainDate,
	options: DateFormatOptions,
	locale?: string,
): string {
	const loc = locale ?? resolveLocale()
	return tryIntl(pd, options, loc) ?? fallbackFormat(pd, options)
}

export function formatMonthYear(year: number, month: number, locale?: string): string {
	return plainDateFormat({ year, month, day: 1 }, DATE_FORMAT_MONTH_YEAR, locale)
}

/** The shared date-format vocabulary Astryx exposes on `format`:
 *  `date` "Mar 21, 2026" · `date_long` "March 21, 2026" ·
 *  `date_weekday` "Wed, Mar 21, 2026" · `system_date` ISO `2026-03-21`. */
export type SharedDateFormat = 'date' | 'date_long' | 'date_weekday' | 'system_date'

export type DateInputFormat = SharedDateFormat | ((iso: ISODateString) => string)

const SHARED_FORMAT_OPTIONS: Record<Exclude<SharedDateFormat, 'system_date'>, DateFormatOptions> = {
	date: DATE_FORMAT_SHORT_WITH_YEAR,
	date_long: DATE_FORMAT_LONG,
	date_weekday: DATE_FORMAT_SHORT_WITH_WEEKDAY,
}

export function formatSharedDate(pd: PlainDate, format: SharedDateFormat, locale?: string): string {
	if (format === 'system_date') {
		return plainDateToISO(pd)
	}

	return plainDateFormat(pd, SHARED_FORMAT_OPTIONS[format], locale)
}

export function formatDateValue(
	iso: ISODateString,
	format: DateInputFormat | undefined,
	locale?: string,
): string {
	const pd = plainDateFromISO(iso)
	if (!pd) {
		return iso
	}

	if (typeof format === 'function') {
		return format(iso)
	}

	return formatSharedDate(pd, format ?? 'date_long', locale)
}

/** "Jan 25 – Feb 2" / "Jan 25 – Feb 2, 2026" style trigger text. */
export function formatRangeDisplay(range: DateRange | null | undefined, locale?: string): string {
	if (!range) {
		return ''
	}

	const start = plainDateFromISO(range.start)
	const end = plainDateFromISO(range.end)
	if (!start || !end) {
		return ''
	}

	const sameYear = start.year === end.year && start.year === plainDateToday().year
	const fmt = sameYear ? DATE_FORMAT_SHORT : DATE_FORMAT_SHORT_WITH_YEAR
	return `${plainDateFormat(start, fmt, locale)} – ${plainDateFormat(end, fmt, locale)}`
}

// ---------------------------------------------------------------------------
// Date input parsing — ISO first, English month names, then locale-aware
// numeric input (day-first vs month-first decided by the locale's own order).
// ---------------------------------------------------------------------------

export function isLocaleDayFirst(locale?: string): boolean {
	try {
		const parts = new Intl.DateTimeFormat(locale ?? resolveLocale(), {
			calendar: 'gregory',
		}).formatToParts(new Date(2000, 0, 15))

		return parts.findIndex((p) => p.type === 'day') < parts.findIndex((p) => p.type === 'month')
	} catch {
		return false
	}
}

const MONTH_NAME_INDEX: Record<string, number> = {
	january: 1,
	jan: 1,
	february: 2,
	feb: 2,
	march: 3,
	mar: 3,
	april: 4,
	apr: 4,
	may: 5,
	june: 6,
	jun: 6,
	july: 7,
	jul: 7,
	august: 8,
	aug: 8,
	september: 9,
	sep: 9,
	sept: 9,
	october: 10,
	oct: 10,
	november: 11,
	nov: 11,
	december: 12,
	dec: 12,
}

function parseMonthName(name: string): number | null {
	return MONTH_NAME_INDEX[name.toLowerCase()] ?? null
}

function parseNumericPair(
	first: number,
	second: number,
	year: number,
	locale?: string,
): PlainDate | null {
	let day: number
	let month: number
	if (first > 12 && second <= 12) {
		day = first
		month = second
	} else if (second > 12 && first <= 12) {
		month = first
		day = second
	} else if (first > 12 && second > 12) {
		return null
	} else if (isLocaleDayFirst(locale)) {
		day = first
		month = second
	} else {
		month = first
		day = second
	}

	return plainDateCreate(year, month, day)
}

/** Parses typed input into a PlainDate — `YYYY-MM-DD`, English month-name
 *  forms ("March 5", "5 March 2026"), and numeric `M/D/YY` or `D/M/YY`
 *  (ambiguity resolved by the locale's day/month order). Returns null for
 *  unparseable or out-of-range input. */
export function parseDateInput(input: string, locale?: string): PlainDate | null {
	const trimmed = input.trim()
	if (!trimmed) {
		return null
	}

	const currentYear = new Date().getFullYear()

	const iso = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/)
	if (iso) {
		return plainDateCreate(Number(iso[1]), Number(iso[2]), Number(iso[3]))
	}

	// "March 5, 2026" / "March 5 2026" / "March 5"
	let m = trimmed.match(/^([a-zA-Z]+)\s+(\d{1,2})(?:st|nd|rd|th)?(?:,?\s*(\d{4}))?$/)
	if (m) {
		const month = parseMonthName(m[1])
		if (month != null) {
			return plainDateCreate(Number(m[3] ?? currentYear), month, Number(m[2]))
		}
	}

	// "5 March 2026" / "5th March" / "5 March"
	m = trimmed.match(/^(\d{1,2})(?:st|nd|rd|th)?\s+([a-zA-Z]+)(?:,?\s*(\d{4}))?$/)
	if (m) {
		const month = parseMonthName(m[2])
		if (month != null) {
			return plainDateCreate(Number(m[3] ?? currentYear), month, Number(m[1]))
		}
	}

	// Numeric: MM/DD/YYYY, DD.MM.YYYY, YYYY/MM/DD, with 2- or 4-digit years.
	m = trimmed.match(/^(\d{4})[/.\s](\d{1,2})[/.\s](\d{1,2})$/)
	if (m) {
		return plainDateCreate(Number(m[1]), Number(m[2]), Number(m[3]))
	}

	m = trimmed.match(/^(\d{1,2})[/.\-\s](\d{1,2})[/.\-\s](\d{4})$/)
	if (m) {
		return parseNumericPair(Number(m[1]), Number(m[2]), Number(m[3]), locale)
	}

	// Two-digit year: pivot at 69 like Date.parse's historical convention.
	m = trimmed.match(/^(\d{1,2})[/.\-\s](\d{1,2})[/.\-\s](\d{2})$/)
	if (m) {
		const y = Number(m[3])
		return parseNumericPair(Number(m[1]), Number(m[2]), y <= 68 ? 2000 + y : 1900 + y, locale)
	}

	// No-year numeric input assumes the current year.
	m = trimmed.match(/^(\d{1,2})[/.\-\s](\d{1,2})$/)
	if (m) {
		return parseNumericPair(Number(m[1]), Number(m[2]), currentYear, locale)
	}

	return null
}

// ---------------------------------------------------------------------------
// Time values
// ---------------------------------------------------------------------------

export interface ParsedTime {
	readonly hour: number
	readonly minute: number
	readonly second: number
}

/** Validate + normalize an `HH:MM[:SS]` string. Returns null when invalid. */
export function parseISOTime(time: string): ParsedTime | null {
	const m = time.match(/^(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?$/)
	if (!m) {
		return null
	}

	const hour = Number(m[1])
	const minute = Number(m[2])
	const second = m[3] != null ? Number(m[3]) : 0
	if (hour > 23 || minute > 59 || second > 59) {
		return null
	}

	return { hour, minute, second }
}

export function formatISOTime(time: ParsedTime, includeSeconds = false): ISOTimeString {
	const base = `${pad2(time.hour)}:${pad2(time.minute)}`
	return (includeSeconds ? `${base}:${pad2(time.second)}` : base) as ISOTimeString
}

export function formatDisplayTime12h(time: ISOTimeString, includeSeconds = false): string {
	const p = parseISOTime(time)
	if (!p) {
		return time
	}

	const h12 = p.hour % 12 || 12
	const ampm = p.hour < 12 ? 'AM' : 'PM'
	const min = pad2(p.minute)
	return includeSeconds ? `${h12}:${min}:${pad2(p.second)} ${ampm}` : `${h12}:${min} ${ampm}`
}

export function formatDisplayTime24h(time: ISOTimeString, includeSeconds = false): string {
	const p = parseISOTime(time)
	if (!p) {
		return time
	}

	const base = `${pad2(p.hour)}:${pad2(p.minute)}`
	return includeSeconds ? `${base}:${pad2(p.second)}` : base
}

/** Typed time input: accepts "2:30 PM", "14:30", "1430", "2pm", "143000"
 *  and ISO `HH:MM[:SS]`; returns a normalized ISOTimeString or null. */
export function parseTimeInput(input: string, includeSeconds = false): ISOTimeString | null {
	const trimmed = input.trim().toLowerCase()
	if (!trimmed) {
		return null
	}

	const isPM = /p\.?m?\.?\s*$/i.test(trimmed)
	const isAM = /a\.?m?\.?\s*$/i.test(trimmed)
	const hasMeridiem = isPM || isAM
	const timeStr = trimmed.replace(/\s*[ap]\.?m?\.?\s*$/i, '').trim()

	const to24 = (hour: number): number | null => {
		if (!hasMeridiem) {
			return hour
		}

		if (hour < 1 || hour > 12) {
			return null
		}

		if (isPM && hour !== 12) {
			return hour + 12
		}

		if (isAM && hour === 12) {
			return 0
		}

		return hour
	}

	if (/^\d{1,2}$/.test(timeStr)) {
		const hour = Number(timeStr)
		const hour24 = to24(hour)
		if (hour24 != null && hour24 >= 0 && hour24 <= 23 && (hasMeridiem || hour <= 23)) {
			return formatISOTime({ hour: hour24, minute: 0, second: 0 }, includeSeconds)
		}

		return null
	}

	if (/^\d{4}$/.test(timeStr)) {
		const hour24 = to24(Number(timeStr.slice(0, 2)))
		const minute = Number(timeStr.slice(2, 4))
		if (hour24 != null && hour24 <= 23 && minute <= 59) {
			return formatISOTime({ hour: hour24, minute, second: 0 }, includeSeconds)
		}

		return null
	}

	if (/^\d{6}$/.test(timeStr)) {
		const hour24 = to24(Number(timeStr.slice(0, 2)))
		const minute = Number(timeStr.slice(2, 4))
		const second = Number(timeStr.slice(4, 6))
		if (hour24 != null && hour24 <= 23 && minute <= 59 && second <= 59) {
			return formatISOTime({ hour: hour24, minute, second }, includeSeconds)
		}

		return null
	}

	const parts = timeStr.split(':')
	if (parts.length >= 2 && parts.length <= 3) {
		const hour = Number(parts[0])
		const minute = Number(parts[1])
		const second = parts.length === 3 ? Number(parts[2]) : 0
		if (!Number.isFinite(hour) || !Number.isFinite(minute) || !Number.isFinite(second)) {
			return null
		}

		if (minute > 59 || second > 59 || minute < 0 || second < 0) {
			return null
		}

		const hour24 = hasMeridiem ? to24(hour) : hour <= 23 ? hour : null
		if (hour24 == null) {
			return null
		}

		return formatISOTime({ hour: hour24, minute, second }, includeSeconds)
	}

	return null
}

export function compareTime(a: ISOTimeString, b: ISOTimeString): number {
	const pa = parseISOTime(a)
	const pb = parseISOTime(b)
	if (!pa || !pb) {
		return 0
	}

	return pa.hour * 3600 + pa.minute * 60 + pa.second - (pb.hour * 3600 + pb.minute * 60 + pb.second)
}

export function isTimeInRange(
	time: ISOTimeString,
	min?: ISOTimeString,
	max?: ISOTimeString,
): boolean {
	if (min && compareTime(time, min) < 0) {
		return false
	}

	if (max && compareTime(time, max) > 0) {
		return false
	}

	return true
}

export function clampTime(
	time: ISOTimeString,
	min?: ISOTimeString,
	max?: ISOTimeString,
): ISOTimeString {
	if (min && compareTime(time, min) < 0) {
		return min
	}

	if (max && compareTime(time, max) > 0) {
		return max
	}

	return time
}

/** Step a time by whole minutes, wrapping around midnight. */
export function adjustTime(
	time: ISOTimeString,
	deltaMinutes: number,
	includeSeconds = false,
): ISOTimeString {
	const p = parseISOTime(time)
	if (!p || !Number.isFinite(deltaMinutes)) {
		return time
	}

	const total = (((p.hour * 60 + p.minute + deltaMinutes) % (24 * 60)) + 24 * 60) % (24 * 60)
	return formatISOTime(
		{ hour: Math.floor(total / 60), minute: total % 60, second: p.second },
		includeSeconds,
	)
}

// ---------------------------------------------------------------------------
// Combined date-time values
// ---------------------------------------------------------------------------

export function splitDateTime(dt: ISODateTimeString | undefined): {
	date?: ISODateString
	time?: ISOTimeString
} {
	if (!dt) {
		return {}
	}

	const i = dt.indexOf('T')
	if (i === -1) {
		return { date: dt as unknown as ISODateString }
	}

	return { date: dt.slice(0, i) as ISODateString, time: dt.slice(i + 1) as ISOTimeString }
}

export function combineDateTime(
	date?: ISODateString,
	time?: ISOTimeString,
): ISODateTimeString | undefined {
	if (!date || !time) {
		return undefined
	}

	return `${date}T${time}` as ISODateTimeString
}

export function currentISOTime(includeSeconds = false): ISOTimeString {
	const now = new Date()
	return formatISOTime(
		{ hour: now.getHours(), minute: now.getMinutes(), second: now.getSeconds() },
		includeSeconds,
	)
}

// ---------------------------------------------------------------------------
// Input presentation vocabulary (Astryx spec AST-043 mapping)
// ---------------------------------------------------------------------------

/** Which surface collects the value. `text-input` is TimeInput-only. */
export type ResolvedInputSurface = 'typed' | 'popover' | 'sheet' | 'native'

/** Map the deprecated `nativePicker` vocabulary onto `presentation`
 *  (`touch` → adaptive-native, `always` → native, `never` → the Astryx
 *  surface: bottom-sheet for pickers, text-input for TimeInput). */
export function presentationFromNativePicker(
	nativePicker: 'touch' | 'always' | 'never' | undefined,
	kind: 'date' | 'time' | 'datetime',
): import('./props').InputPresentation | undefined {
	if (nativePicker === undefined) {
		return undefined
	}

	switch (nativePicker) {
		case 'touch':
			return 'adaptive-native'
		case 'always':
			return 'native'
		case 'never':
			return kind === 'time' ? 'text-input' : 'adaptive-bottom-sheet'
	}
}

/** `presentation` wins over the deprecated `nativePicker`. */
export function effectivePresentation(
	presentation: string | undefined,
	nativePicker: 'touch' | 'always' | 'never' | undefined,
	kind: 'date' | 'time' | 'datetime',
): import('./props').InputPresentation {
	return (
		(presentation as import('./props').InputPresentation | undefined) ??
		presentationFromNativePicker(nativePicker, kind) ??
		'adaptive-native'
	)
}

/**
 * Resolve a presentation + pointer coarseness to a concrete surface.
 * On native targets pass `isCoarsePointer = true`; `native` there is
 * remapped by each component leaf (the OS-authentic pickers live in the
 * `@octane-xplat/date-picker` leaf — ui-internal `native` resolves to the
 * self-drawn `sheet` surface).
 */
export function resolveInputSurface(
	effective: import('./props').InputPresentation,
	isCoarsePointer: boolean,
): ResolvedInputSurface {
	switch (effective) {
		case 'text-input':
			return 'typed'
		case 'popover':
			return 'popover'
		case 'bottom-sheet':
			return 'sheet'
		case 'native':
			return 'native'
		case 'adaptive-bottom-sheet':
			return isCoarsePointer ? 'sheet' : 'popover'
		case 'adaptive-native':
			return isCoarsePointer ? 'native' : 'popover'
	}
}

/** Localized wall-clock display; ISO time remains zone-free and parsing bounded. */
export function formatLocalizedTime(
	time: ISOTimeString,
	hasSeconds: boolean,
	hourFormat: '12h' | '24h',
	locale: string,
): string {
	const parsed = parseISOTime(time)
	if (!parsed) {
		return time
	}

	return new Intl.DateTimeFormat(locale, {
		hour: 'numeric',
		minute: '2-digit',
		...(hasSeconds ? { second: '2-digit' as const } : {}),
		hourCycle: hourFormat === '24h' ? 'h23' : 'h12',
		timeZone: 'UTC',
	}).format(new Date(Date.UTC(2000, 0, 1, parsed.hour, parsed.minute, parsed.second ?? 0)))
}
