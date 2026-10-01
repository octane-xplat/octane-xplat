// Shared instant/relative formatting for Timestamp — ported from Astryx's
// formatInstant.ts, formatRelativeTime.ts, and tooltipEntries.ts. Intl is a
// universal-runtime API (platform-notes i18n row), so the module is identical
// on web and native.
import type { TimestampFormat, TimestampTooltipEntry, TimestampTooltipFormat } from './props'
export type { TimestampTooltipEntry, TimestampTooltipFormat } from './props'

/** A rendered tooltip line for the Timestamp hover card. */
export interface TimestampTooltipLine {
	label?: string
	value: string
	isCopyable: boolean
}

type Locale = string | string[] | undefined

const FULL_OPTIONS: Intl.DateTimeFormatOptions = {
	year: 'numeric',
	month: 'long',
	day: 'numeric',
	hour: 'numeric',
	minute: '2-digit',
	second: '2-digit',
	timeZoneName: 'short',
}

const TIME_OPTIONS: Intl.DateTimeFormatOptions = {
	hour: 'numeric',
	minute: '2-digit',
}

const DATE_OPTIONS: Intl.DateTimeFormatOptions = {
	year: 'numeric',
	month: 'short',
	day: 'numeric',
}

const DATE_LONG_OPTIONS: Intl.DateTimeFormatOptions = {
	year: 'numeric',
	month: 'long',
	day: 'numeric',
}

const DATE_WEEKDAY_OPTIONS: Intl.DateTimeFormatOptions = {
	weekday: 'short',
	month: 'short',
	day: 'numeric',
	year: 'numeric',
}

// The date part here is spelled out rather than shared with a date-only
// field preset: the two agree today but are not the same decision.
const DATE_TIME_OPTIONS: Intl.DateTimeFormatOptions = {
	year: 'numeric',
	month: 'short',
	day: 'numeric',
	...TIME_OPTIONS,
}

function pad(n: number): string {
	return String(n).padStart(2, '0')
}

interface WallClock {
	year: number
	month: number
	day: number
	hour: number
	minute: number
	second: number
}

/** Wall-clock fields for an instant in a named zone via Intl parts. */
function getTimeZoneParts(instant: number, timezoneID: string): WallClock {
	const parts = new Intl.DateTimeFormat('en-US', {
		timeZone: timezoneID,
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
		hour: '2-digit',
		minute: '2-digit',
		second: '2-digit',
		hourCycle: 'h23',
		calendar: 'gregory',
	}).formatToParts(new Date(instant))

	const lookup = Object.fromEntries(
		parts.filter((part) => part.type !== 'literal').map((part) => [part.type, Number(part.value)]),
	)

	return {
		year: lookup.year,
		month: lookup.month,
		day: lookup.day,
		hour: lookup.hour,
		minute: lookup.minute,
		second: lookup.second,
	}
}

function getWallClock(date: Date, timeZone: string | undefined): WallClock {
	return timeZone === undefined
		? {
				year: date.getFullYear(),
				month: date.getMonth() + 1,
				day: date.getDate(),
				hour: date.getHours(),
				minute: date.getMinutes(),
				second: date.getSeconds(),
			}
		: getTimeZoneParts(date.getTime(), timeZone)
}

export interface FormatInstantOptions {
	/** IANA zone id; omit for the viewer's own zone. */
	timeZone?: string
	/** Append the short zone abbreviation (`date_time`/`time`/`full` only). */
	isTimezoneShown?: boolean
	/** 'short' ("PST") or 'long' ("Pacific Standard Time") — `full` only. */
	timeZoneNameStyle?: 'short' | 'long'
}

/** Render one instant in one absolute format. Pure in its arguments. */
export function formatInstant(
	date: Date,
	format: TimestampTooltipFormat,
	locale?: Locale,
	{ timeZone, isTimezoneShown = false, timeZoneNameStyle = 'short' }: FormatInstantOptions = {},
): string {
	const zone = timeZone === undefined ? {} : { timeZone }
	const zoneName = isTimezoneShown ? { timeZoneName: 'short' as const } : {}

	switch (format) {
		case 'full':
			return new Intl.DateTimeFormat(locale, {
				...FULL_OPTIONS,
				timeZoneName: timeZoneNameStyle,
				...zone,
				calendar: 'gregory',
			}).format(date)

		case 'date':
			return new Intl.DateTimeFormat(locale, {
				...DATE_OPTIONS,
				...zone,
				calendar: 'gregory',
			}).format(date)

		case 'date_long':
			return new Intl.DateTimeFormat(locale, {
				...DATE_LONG_OPTIONS,
				...zone,
				calendar: 'gregory',
			}).format(date)

		case 'date_weekday':
			return new Intl.DateTimeFormat(locale, {
				...DATE_WEEKDAY_OPTIONS,
				...zone,
				calendar: 'gregory',
			}).format(date)

		case 'date_time':
			return new Intl.DateTimeFormat(locale, {
				...DATE_TIME_OPTIONS,
				...zoneName,
				...zone,
				calendar: 'gregory',
			}).format(date)

		case 'time':
			return new Intl.DateTimeFormat(locale, {
				...TIME_OPTIONS,
				...zoneName,
				...zone,
			}).format(date)

		case 'system_date': {
			const w = getWallClock(date, timeZone)
			return `${w.year}-${pad(w.month)}-${pad(w.day)}`
		}

		case 'system_date_time': {
			const w = getWallClock(date, timeZone)
			return `${w.year}-${pad(w.month)}-${pad(w.day)} ${pad(w.hour)}:${pad(w.minute)}:${pad(w.second)}`
		}

		case 'system_time': {
			const w = getWallClock(date, timeZone)
			return `${pad(w.hour)}:${pad(w.minute)}:${pad(w.second)}`
		}

		case 'unix_seconds':
			// Absolute — a wall-clock zone can't change elapsed seconds.
			return String(Math.floor(date.getTime() / 1000))
	}
}

// ---------------------------------------------------------------------------
// Relative time
// ---------------------------------------------------------------------------

const MINUTE = 60
const HOUR = 3600
const DAY = 86400
const MONTH = 30 * DAY
const YEAR = 365 * DAY

/** Values this close to now are usually clock skew, not a future instant. */
const FUTURE_SKEW_TOLERANCE = 30

type RelativeTimeStyle = 'long' | 'narrow'
type RelativeTimeUnit = 'second' | 'minute' | 'hour' | 'day' | 'month' | 'year'

const formatters = new Map<string, Intl.RelativeTimeFormat>()

function getFormatter(
	locale: Locale,
	style: RelativeTimeStyle,
	numeric: Intl.RelativeTimeFormatNumeric,
): Intl.RelativeTimeFormat {
	const key = JSON.stringify([locale, style, numeric])
	let formatter = formatters.get(key)
	if (formatter == null) {
		formatter = new Intl.RelativeTimeFormat(locale, { numeric, style })
		formatters.set(key, formatter)
	}

	return formatter
}

/**
 * Locale-correct relative time: the fixed tier selection is ours, wording,
 * plural rules, and word order belong to the CLDR-backed formatter.
 */
export function formatRelativeTime(
	date: Date,
	now: Date,
	locale?: Locale,
	style: RelativeTimeStyle = 'long',
): string {
	const diffSeconds = Math.round((now.getTime() - date.getTime()) / 1000)
	const absDiff = Math.abs(diffSeconds)

	if (absDiff < 10 || (diffSeconds < 0 && absDiff <= FUTURE_SKEW_TOLERANCE)) {
		return getFormatter(locale, style, 'auto').format(0, 'second')
	}

	let count: number
	let unit: RelativeTimeUnit
	if (absDiff < MINUTE) {
		count = absDiff
		unit = 'second'
	} else if (absDiff < HOUR) {
		count = Math.floor(absDiff / MINUTE)
		unit = 'minute'
	} else if (absDiff < DAY) {
		count = Math.floor(absDiff / HOUR)
		unit = 'hour'
	} else if (absDiff < MONTH) {
		count = Math.floor(absDiff / DAY)
		unit = 'day'
	} else if (absDiff < YEAR) {
		count = Math.floor(absDiff / MONTH)
		unit = 'month'
	} else {
		count = Math.floor(absDiff / YEAR)
		unit = 'year'
	}

	const value = diffSeconds < 0 ? count : -count
	// The long form keeps the "yesterday" idiom; the narrow form stays numeric
	// ("1d ago", not "yesterday").
	const numeric = style === 'long' && unit === 'day' && value === -1 ? 'auto' : 'always'
	return getFormatter(locale, style, numeric).format(value, unit)
}

// ---------------------------------------------------------------------------
// Tooltip lines
// ---------------------------------------------------------------------------

/** Spelling that means "the viewer's own zone" without naming it. */
const LOCAL_ZONE_ALIAS = 'local'

const warnedTimezoneIDs = new Set<string>()

function resolveTimezoneID(timezoneID: string | undefined): string | undefined {
	if (timezoneID === undefined || timezoneID.toLowerCase() === LOCAL_ZONE_ALIAS) {
		return undefined
	}

	// An unrecognized identifier makes every Intl.DateTimeFormat constructor
	// throw a RangeError — degrade to the viewer's zone and say so once.
	try {
		new Intl.DateTimeFormat('en-US', { timeZone: timezoneID })
	} catch {
		if (!warnedTimezoneIDs.has(timezoneID)) {
			warnedTimezoneIDs.add(timezoneID)
			console.warn(
				`[octane-xplat] Timestamp: unknown time zone ${JSON.stringify(timezoneID)} in tooltipEntries. Falling back to the viewer's time zone.`,
			)
		}

		return undefined
	}

	return timezoneID
}

// Keyed on the *requested* zone, not the resolved offset: two named zones
// stay distinguishable even when the viewer sits inside one of them.
function zoneKey(resolved: string | undefined): string {
	return resolved === undefined ? LOCAL_ZONE_ALIAS : resolved.toLowerCase()
}

function shouldShowZoneName(
	format: TimestampTooltipFormat,
	hasMultipleZones: boolean,
	isNamedZone: boolean,
): boolean {
	if (format === 'full') {
		return true
	}

	if (format === 'date_time' || format === 'time') {
		return hasMultipleZones || isNamedZone
	}

	return false
}

/** Render one tooltip line per entry, in the order given. Pure. */
export function formatTooltipLines(
	date: Date,
	entries: readonly TimestampTooltipEntry[],
	locale?: Locale,
): TimestampTooltipLine[] {
	const resolved = entries.map((entry) => resolveTimezoneID(entry.timezoneID))
	const hasMultipleZones = new Set(resolved.map(zoneKey)).size > 1

	return entries.map((entry, index) => {
		const format = entry.format ?? 'full'
		const timeZone = resolved[index]

		return {
			...(entry.label === undefined ? {} : { label: entry.label }),
			isCopyable: entry.isCopyable ?? false,
			value: formatInstant(date, format, locale, {
				timeZone,
				isTimezoneShown: shouldShowZoneName(format, hasMultipleZones, timeZone !== undefined),
			}),
		}
	})
}

// ---------------------------------------------------------------------------
// Component-side helpers
// ---------------------------------------------------------------------------

/** Seconds threshold for 'auto' format: below this, relative; else date_time. */
export const DEFAULT_AUTO_THRESHOLD = 7 * DAY

/** Parse the `Timestamp.value` contract: number < 1e12 = Unix seconds,
 *  larger = ms; strings parse as dates (ISO 8601 recommended). */
export function parseTimestampValue(value: string | number): Date {
	if (typeof value === 'number') {
		return new Date(value < 1e12 ? value * 1000 : value)
	}

	return new Date(value)
}

/** Interval (ms) for a live relative timestamp's next update. */
export function getLiveInterval(diffSeconds: number): number {
	const absDiff = Math.abs(diffSeconds)
	if (absDiff < MINUTE) {
		return 1000
	}

	if (absDiff < HOUR) {
		return 30_000
	}

	if (absDiff < DAY) {
		return 60_000
	}

	return 300_000
}

export function isRelativeFormat(format: TimestampFormat): boolean {
	return format === 'relative' || format === 'relative_short'
}

export function isAbsoluteFormat(
	format: TimestampFormat,
): format is Exclude<TimestampFormat, 'relative' | 'relative_short' | 'auto'> {
	return format !== 'relative' && format !== 'relative_short' && format !== 'auto'
}

/** Resolve the 'auto' alias to the concrete format for a given diff. */
export function resolveTimestampFormat(
	format: TimestampFormat,
	diffSeconds: number,
	autoThreshold: number,
): TimestampFormat {
	return format === 'auto'
		? Math.abs(diffSeconds) <= autoThreshold
			? 'relative'
			: 'date_time'
		: format
}

/** The visible text for one instant in the effective (resolved) format. */
export function formatTimestampText(
	date: Date,
	format: Exclude<TimestampFormat, 'auto'>,
	now: Date,
	locale: Locale,
	isTimezoneShown: boolean,
): string {
	if (format === 'relative') {
		return formatRelativeTime(date, now, locale, 'long')
	}

	if (format === 'relative_short') {
		return formatRelativeTime(date, now, locale, 'narrow')
	}

	if (isAbsoluteFormat(format)) {
		return formatInstant(date, format, locale, { isTimezoneShown })
	}

	return ''
}
