/** Shared, platform-neutral PowerSearch logic — config builders, internal
 *  lookup maps, the field typeahead source, value formatting, operator label
 *  resolution, and client-side `applyFilters` matching. Ports
 *  `usePowerSearchConfig`/`useInternalConfig`/`usePowerSearchSource`/
 *  `formatFilterValue`/`resolveOperatorLabel`/`resolveDateTimeRangePart` from
 *  upstream `packages/core/src/PowerSearch/`. */
import { useMemo } from 'octane'
import type {
	DateTimeRangePart,
	EnumItem,
	FieldDefinition,
	FilterValue,
	InferData,
	OperatorValue,
	PowerSearchConfig,
	PowerSearchField,
	PowerSearchFilter,
	PowerSearchItem,
	PowerSearchOperator,
	SearchSource,
} from './props'

import { powerSearchTranslate, type PowerSearchTranslate } from './power-search-strings'

// =============================================================================
// Operator label resolution
// =============================================================================

/** Display string for an operator: `label` verbatim, `i18nKey` through the
 *  catalog (`powerSearchTranslate` by default — pass an app translator to
 *  localize). */
export function resolveOperatorLabel(
	operator: PowerSearchOperator,
	t: PowerSearchTranslate = powerSearchTranslate,
): string {
	if ('label' in operator && operator.label !== undefined) {
		return operator.label
	}

	return t(operator.i18nKey)
}

// =============================================================================
// Date-time range parts
// =============================================================================

const SECONDS_BY_UNIT = {
	second: 1,
	minute: 60,
	hour: 3600,
	day: 86400,
	week: 604800,
	month: 2592000,
	year: 31536000,
} as const

/** Resolves a range part against one caller-supplied instant. */
export function resolveDateTimeRangePart(
	part: DateTimeRangePart,
	nowSeconds = Date.now() / 1000,
): number {
	switch (part.type) {
		case 'NOW':
			return Math.floor(nowSeconds)
		case 'ABSOLUTE':
			return part.unixSeconds
		case 'RELATIVE':
			return Math.floor(nowSeconds - part.backValue * SECONDS_BY_UNIT[part.unit])
	}
}

// =============================================================================
// Internal config — O(1) lookups over PowerSearchConfig
// =============================================================================

export interface PowerSearchInternalConfig {
	readonly config: PowerSearchConfig
	getField(key: string): PowerSearchField | undefined
	getOperator(fieldKey: string, operatorKey: string): PowerSearchOperator | undefined
	getDefaultOperator(fieldKey: string): PowerSearchOperator | undefined
	getVisibleFields(): ReadonlyArray<PowerSearchField>
	getVisibleOperators(fieldKey: string): ReadonlyArray<PowerSearchOperator>
}

/** Pure factory — components wrap it in `useMemo` when they want stability. */
export function createInternalConfig(config: PowerSearchConfig): PowerSearchInternalConfig {
	const fieldMap = new Map<string, PowerSearchField>()
	const operatorMap = new Map<string, Map<string, PowerSearchOperator>>()

	for (const field of config.fields) {
		fieldMap.set(field.key, field)
		const opMap = new Map<string, PowerSearchOperator>()
		for (const op of field.operators) {
			opMap.set(op.key, op)
		}

		operatorMap.set(field.key, opMap)
	}

	return {
		config,
		getField: (key) => fieldMap.get(key),
		getOperator: (fieldKey, operatorKey) => operatorMap.get(fieldKey)?.get(operatorKey),
		getDefaultOperator: (fieldKey) => {
			const field = fieldMap.get(fieldKey)
			if (!field) {
				return undefined
			}
			if (field.defaultOperator) {
				return operatorMap.get(fieldKey)?.get(field.defaultOperator)
			}
			return field.operators[0]
		},
		getVisibleFields: () => config.fields,
		getVisibleOperators: (fieldKey) => fieldMap.get(fieldKey)?.operators ?? [],
	}
}

export function useInternalConfig(config: PowerSearchConfig): PowerSearchInternalConfig {
	return useMemo(() => createInternalConfig(config), [config])
}

// =============================================================================
// Value formatting
// =============================================================================

function truncate(str: string, maxLength: number): string {
	// Code-point aware truncation (upstream counts in characters).
	const chars = [...str]
	if (chars.length <= maxLength) {
		return str
	}
	const keep = Math.max(maxLength - 1, 0)
	return chars.slice(0, keep).join('') + '\u2026'
}

function formatEnumLabel(value: string, enumValues: ReadonlyArray<EnumItem>): string {
	return enumValues.find((v) => v.value === value)?.label ?? value
}

function formatNumber(value: number, locale?: string, units?: string): string {
	const formatted = new Intl.NumberFormat(locale).format(value)
	return units ? `${formatted} ${units}` : formatted
}

export function formatDateAbsolute(
	unixSeconds: number,
	locale?: string,
	timezoneID?: string,
): string {
	const options: Intl.DateTimeFormatOptions = {
		year: 'numeric',
		month: 'short',
		day: 'numeric',
		hour: 'numeric',
		minute: '2-digit',
		...(timezoneID ? { timeZone: timezoneID } : {}),
		calendar: 'gregory',
	}

	return new Intl.DateTimeFormat(locale, options).format(unixSeconds * 1000)
}

/** Compact date-only rendering for token pills (no time-of-day). */
export function formatDateAbsoluteCompact(unixSeconds: number, locale?: string): string {
	return new Intl.DateTimeFormat(locale, {
		year: 'numeric',
		month: 'short',
		day: 'numeric',
		calendar: 'gregory',
	}).format(unixSeconds * 1000)
}

/** String form of a filter value for token pills and summaries. */
export function formatFilterValue(
	_config: PowerSearchInternalConfig,
	operatorValue: OperatorValue,
	filterValue: FilterValue,
	maxLength: number,
	t: PowerSearchTranslate = powerSearchTranslate,
	locale?: string,
	timezoneID?: string,
): string {
	switch (filterValue.type) {
		case 'empty':
			return ''
		case 'string':
			return truncate(filterValue.value, maxLength)
		case 'integer':
			return formatNumber(
				filterValue.value,
				locale,
				operatorValue.type === 'integer' ? operatorValue.units : undefined,
			)
		case 'float':
			return formatNumber(
				filterValue.value,
				locale,
				operatorValue.type === 'float' ? operatorValue.units : undefined,
			)
		case 'enum':
			if (operatorValue.type === 'enum') {
				return truncate(formatEnumLabel(filterValue.value, operatorValue.values), maxLength)
			}

			return truncate(filterValue.value, maxLength)
		case 'string_list': {
			const items = filterValue.value
			if (items.length === 0) {
				return ''
			}
			if (items.length === 1) {
				return truncate(items[0], maxLength)
			}
			const joined = items.join(', ')
			if (joined.length <= maxLength) {
				return joined
			}
			return t('@astryx.powersearch.valueEditor.itemsCount', { count: items.length })
		}
		case 'enum_list': {
			const items = filterValue.value
			if (items.length === 0) {
				return ''
			}
			if (operatorValue.type === 'enum_list') {
				const labels = items.map((v) => formatEnumLabel(v, operatorValue.values))
				if (labels.length === 1) {
					return truncate(labels[0], maxLength)
				}
				const joined = labels.join(', ')
				if (joined.length <= maxLength) {
					return joined
				}
				return t('@astryx.powersearch.valueEditor.itemsCount', { count: labels.length })
			}

			if (items.length === 1) {
				return truncate(items[0], maxLength)
			}
			return t('@astryx.powersearch.valueEditor.itemsCount', { count: items.length })
		}
		case 'entity_list': {
			const entities = filterValue.value
			if (entities.length === 0) {
				return ''
			}
			if (entities.length === 1) {
				return truncate(entities[0].label, maxLength)
			}
			const joined = entities.map((e) => e.label).join(', ')
			if (joined.length <= maxLength) {
				return joined
			}
			return t('@astryx.powersearch.valueEditor.entitiesCount', { count: entities.length })
		}
		case 'time':
			return filterValue.value
		case 'date_absolute':
			return truncate(formatDateAbsolute(filterValue.unixSeconds, locale, timezoneID), maxLength)
		case 'date_relative':
			return filterValue.value
		case 'date_range':
			return t('@astryx.powersearch.valueEditor.dateRange')
		case 'custom':
			if (operatorValue.type === 'custom') {
				return truncate(operatorValue.getString(filterValue.value), maxLength)
			}

			return filterValue.value
		case 'nested': {
			const count = filterValue.value.length
			return t('@astryx.powersearch.valueEditor.filtersCount', { count })
		}
		default:
			return ''
	}
}

// =============================================================================
// Field typeahead source
// =============================================================================

interface ValueMatch {
	displayValue: string
	filterValue: FilterValue
	/** Wrap the display value in quotes (arbitrary string values). */
	quoted: boolean
}

function resolveValueMatches(op: PowerSearchOperator, rawValue: string): ValueMatch[] {
	const opType = op.value.type
	if (opType === 'string') {
		return [
			{ displayValue: rawValue, filterValue: { type: 'string', value: rawValue }, quoted: true },
		]
	}

	if (opType === 'string_list') {
		return [
			{
				displayValue: rawValue,
				filterValue: { type: 'string_list', value: [rawValue] },
				quoted: true,
			},
		]
	}

	if (opType === 'enum') {
		const lower = rawValue.toLowerCase()
		return op.value.values
			.filter((item) => item.label.toLowerCase().includes(lower))
			.map((item) => ({
				displayValue: item.label,
				filterValue: { type: 'enum' as const, value: item.value },
				quoted: false,
			}))
	}

	if (opType === 'enum_list') {
		const lower = rawValue.toLowerCase()
		return op.value.values
			.filter((item) => item.label.toLowerCase().includes(lower))
			.map((item) => ({
				displayValue: item.label,
				filterValue: { type: 'enum_list' as const, value: [item.value] },
				quoted: false,
			}))
	}

	return []
}

function buildFieldItems(config: PowerSearchInternalConfig): PowerSearchItem[] {
	const ungrouped: PowerSearchItem[] = []
	const groups = new Map<string, PowerSearchItem[]>()
	for (const field of config.getVisibleFields()) {
		const defaultOp = config.getDefaultOperator(field.key)
		const item: PowerSearchItem = {
			id: field.key,
			label: field.label,
			auxiliaryData: { fieldKey: field.key, operatorKey: defaultOp?.key, group: field.group },
		}

		if (field.group != null) {
			if (!groups.has(field.group)) {
				groups.set(field.group, [])
			}
			groups.get(field.group)!.push(item)
		} else {
			ungrouped.push(item)
		}
	}

	// Ungrouped fields first, then groups in first-seen order.
	return [...ungrouped, ...[...groups.values()].flat()]
}

/** The field/operator/value suggestion source behind the main input —
 *  `search(query)` ranks field labels, field+operator combos, value matches,
 *  and the free-text content-search entry; `bootstrap()` lists every field. */
export function createPowerSearchSource(
	config: PowerSearchInternalConfig,
	maxTypedResults: number,
	t: PowerSearchTranslate = powerSearchTranslate,
): SearchSource<PowerSearchItem> {
	const allItems = buildFieldItems(config)
	const opLabel = (op: PowerSearchOperator): string => resolveOperatorLabel(op, t)

	return {
		search(query: string): PowerSearchItem[] {
			const lower = query.toLowerCase().trim()
			if (lower === '') {
				return allItems
			}

			const results: PowerSearchItem[] = []
			const seen = new Set<string>()

			for (const field of config.getVisibleFields()) {
				if (field.typeaheadMinQueryLength != null && lower.length < field.typeaheadMinQueryLength) {
					continue
				}

				const fieldMatches =
					field.label.toLowerCase().includes(lower) ||
					field.typeaheadAliases?.some((alias) => alias.toLowerCase().includes(lower))

				if (fieldMatches) {
					const defaultOp = config.getDefaultOperator(field.key)
					if (!seen.has(field.key)) {
						seen.add(field.key)
						results.push({
							id: field.key,
							label: field.label,
							auxiliaryData: { fieldKey: field.key, operatorKey: defaultOp?.key },
						})
					}
				}

				for (const op of field.operators) {
					const combinedLabel = `${field.label} ${opLabel(op)}`.toLowerCase()
					if (combinedLabel.includes(lower)) {
						const id = `${field.key}:${op.key}`
						if (!seen.has(id)) {
							seen.add(id)
							results.push({
								id,
								label: `${field.label} ${opLabel(op)}`,
								auxiliaryData: { fieldKey: field.key, operatorKey: op.key },
							})
						}
					}
				}
			}

			// Field+operator+value suggestions: "title foo" → Title contains "foo",
			// "genre fiction" → Genre is Fiction.
			for (const field of config.getVisibleFields()) {
				if (field.isValueMatchAllowed === false) {
					continue
				}
				const fieldLabel = field.label.toLowerCase()

				let hasExactOperatorMatch = false
				for (const op of field.operators) {
					const prefix = `${fieldLabel} ${opLabel(op).toLowerCase()} `
					if (lower.startsWith(prefix) && lower.length > prefix.length) {
						const rawValue = query.slice(prefix.length)
						const matches = resolveValueMatches(op, rawValue)
						if (matches.length > 0) {
							hasExactOperatorMatch = true
						}
						for (const match of matches) {
							const id = `${field.key}:${op.key}:value:${match.displayValue}`
							if (!seen.has(id)) {
								seen.add(id)
								results.push({
									id,
									label: `${field.label} ${opLabel(op)} ${match.quoted ? `"${match.displayValue}"` : match.displayValue}`,
									auxiliaryData: {
										fieldKey: field.key,
										operatorKey: op.key,
										filterValue: match.filterValue,
									},
								})
							}
						}
					}
				}

				const fieldPrefix = `${fieldLabel} `
				if (
					!hasExactOperatorMatch &&
					lower.startsWith(fieldPrefix) &&
					lower.length > fieldPrefix.length
				) {
					const remainder = lower.slice(fieldPrefix.length)
					const isOperatorPrefix = field.operators.some((op) =>
						opLabel(op).toLowerCase().startsWith(remainder),
					)
					if (!isOperatorPrefix) {
						const rawValue = query.slice(fieldPrefix.length)
						for (const op of field.operators) {
							for (const match of resolveValueMatches(op, rawValue)) {
								const id = `${field.key}:${op.key}:value:${match.displayValue}`
								if (!seen.has(id)) {
									seen.add(id)
									results.push({
										id,
										label: `${field.label} ${opLabel(op)} ${match.quoted ? `"${match.displayValue}"` : match.displayValue}`,
										auxiliaryData: {
											fieldKey: field.key,
											operatorKey: op.key,
											filterValue: match.filterValue,
										},
									})
								}
							}
						}
					}
				}
			}

			// Free-text content search when no field/operator exactly matches.
			const contentFieldKey = config.config.contentSearchFieldKey
			const hasExactMatch = config
				.getVisibleFields()
				.some(
					(f) =>
						f.label.toLowerCase() === lower ||
						f.operators.some((op) => `${f.label} ${opLabel(op)}`.toLowerCase() === lower),
				)

			if (contentFieldKey && !hasExactMatch) {
				const contentField = config.getField(contentFieldKey)
				const contentOp = config.getDefaultOperator(contentFieldKey)
				if (contentField && contentOp) {
					results.unshift({
						id: `__content_search__:${query}`,
						label: `"${query}"`,
						auxiliaryData: {
							fieldKey: contentFieldKey,
							operatorKey: contentOp.key,
							filterValue: { type: 'string', value: query },
						},
					})
				}
			}

			return results.slice(0, maxTypedResults)
		},
		bootstrap(): PowerSearchItem[] {
			return allItems
		},
	}
}

export function usePowerSearchSource(
	config: PowerSearchInternalConfig,
	maxTypedResults: number,
	t: PowerSearchTranslate = powerSearchTranslate,
): SearchSource<PowerSearchItem> {
	return useMemo(
		() => createPowerSearchSource(config, maxTypedResults, t),
		[config, maxTypedResults, t],
	)
}

// =============================================================================
// createPowerSearchConfig — field definitions → config + applyFilters
// =============================================================================

const StringOps = {
	CONTAINS: 'contains',
	NOT_CONTAINS: 'not_contains',
	STARTS_WITH: 'starts_with',
	NOT_STARTS_WITH: 'not_starts_with',
	ENDS_WITH: 'ends_with',
	NOT_ENDS_WITH: 'not_ends_with',
	IS: 'is',
	IS_NOT: 'is_not',
} as const

const NumberOps = {
	EQUALS: 'equals',
	NOT_EQUALS: 'not_equals',
	GREATER_THAN: 'greater_than',
	LESS_THAN: 'less_than',
	GREATER_THAN_OR_EQUAL: 'greater_than_or_equal',
	LESS_THAN_OR_EQUAL: 'less_than_or_equal',
} as const

const DateOps = { BEFORE: 'before', AFTER: 'after', BETWEEN: 'between' } as const
const BooleanOps = { IS_TRUE: 'is_true', IS_FALSE: 'is_false' } as const
const EnumOps = { IS: 'is', IS_NOT: 'is_not' } as const
const ListOps = { IS_ANY_OF: 'is_any_of', IS_NONE_OF: 'is_none_of' } as const

const op = (key: string, i18nKey: string, value: OperatorValue): PowerSearchOperator => ({
	key,
	i18nKey,
	value,
})

function buildField(def: FieldDefinition): PowerSearchField {
	const label = def.label ?? def.key
	switch (def.type) {
		case 'string':
			return {
				key: def.key,
				label,
				defaultOperator: StringOps.CONTAINS,
				operators: [
					op(StringOps.CONTAINS, '@astryx.powersearch.operator.contains', { type: 'string' }),
					op(StringOps.NOT_CONTAINS, '@astryx.powersearch.operator.notContains', {
						type: 'string',
					}),
					op(StringOps.STARTS_WITH, '@astryx.powersearch.operator.startsWith', { type: 'string' }),
					op(StringOps.NOT_STARTS_WITH, '@astryx.powersearch.operator.notStartsWith', {
						type: 'string',
					}),
					op(StringOps.ENDS_WITH, '@astryx.powersearch.operator.endsWith', { type: 'string' }),
					op(StringOps.NOT_ENDS_WITH, '@astryx.powersearch.operator.notEndsWith', {
						type: 'string',
					}),
					op(StringOps.IS, '@astryx.powersearch.operator.is', { type: 'string' }),
					op(StringOps.IS_NOT, '@astryx.powersearch.operator.isNot', { type: 'string' }),
				],
			}
		case 'number':
			return {
				key: def.key,
				label,
				defaultOperator: NumberOps.EQUALS,
				operators: [
					op(NumberOps.EQUALS, '@astryx.powersearch.operator.equals', { type: 'float' }),
					op(NumberOps.NOT_EQUALS, '@astryx.powersearch.operator.notEquals', { type: 'float' }),
					op(NumberOps.GREATER_THAN, '@astryx.powersearch.operator.greaterThan', { type: 'float' }),
					op(NumberOps.LESS_THAN, '@astryx.powersearch.operator.lessThan', { type: 'float' }),
					op(NumberOps.GREATER_THAN_OR_EQUAL, '@astryx.powersearch.operator.greaterThanOrEqual', {
						type: 'float',
					}),
					op(NumberOps.LESS_THAN_OR_EQUAL, '@astryx.powersearch.operator.lessThanOrEqual', {
						type: 'float',
					}),
				],
			}
		case 'date':
			return {
				key: def.key,
				label,
				defaultOperator: DateOps.AFTER,
				operators: [
					op(DateOps.BEFORE, '@astryx.powersearch.operator.before', { type: 'date_absolute' }),
					op(DateOps.AFTER, '@astryx.powersearch.operator.after', { type: 'date_absolute' }),
					op(DateOps.BETWEEN, '@astryx.powersearch.operator.between', { type: 'date_range' }),
				],
			}
		case 'boolean':
			return {
				key: def.key,
				label,
				defaultOperator: BooleanOps.IS_TRUE,
				operators: [
					op(BooleanOps.IS_TRUE, '@astryx.powersearch.operator.isTrue', { type: 'empty' }),
					op(BooleanOps.IS_FALSE, '@astryx.powersearch.operator.isFalse', { type: 'empty' }),
				],
			}
		case 'enum': {
			const values = def.enumValues ?? []
			return {
				key: def.key,
				label,
				defaultOperator: EnumOps.IS,
				operators: [
					op(EnumOps.IS, '@astryx.powersearch.operator.is', { type: 'enum', values }),
					op(EnumOps.IS_NOT, '@astryx.powersearch.operator.isNot', { type: 'enum', values }),
				],
			}
		}
		case 'enum_list': {
			const values = def.enumValues ?? []
			return {
				key: def.key,
				label,
				defaultOperator: ListOps.IS_ANY_OF,
				operators: [
					op(ListOps.IS_ANY_OF, '@astryx.powersearch.operator.isAnyOf', {
						type: 'enum_list',
						values,
					}),
					op(ListOps.IS_NONE_OF, '@astryx.powersearch.operator.isNoneOf', {
						type: 'enum_list',
						values,
					}),
				],
			}
		}
		case 'string_list':
			return {
				key: def.key,
				label,
				defaultOperator: ListOps.IS_ANY_OF,
				operators: [
					op(ListOps.IS_ANY_OF, '@astryx.powersearch.operator.isAnyOf', { type: 'string_list' }),
					op(ListOps.IS_NONE_OF, '@astryx.powersearch.operator.isNoneOf', { type: 'string_list' }),
				],
			}
	}
}

function toUnixSeconds(value: Date | number): number {
	return value instanceof Date ? Math.floor(value.getTime() / 1000) : value
}

function toStringValues(value: unknown): string[] | null {
	if (typeof value === 'string') {
		return [value]
	}
	if (Array.isArray(value) && value.every((item) => typeof item === 'string')) {
		return value
	}
	return null
}

const stringOpHandlers: Record<string, (s: string, t: string) => boolean> = {
	[StringOps.CONTAINS]: (s, t) => s.includes(t),
	[StringOps.NOT_CONTAINS]: (s, t) => !s.includes(t),
	[StringOps.STARTS_WITH]: (s, t) => s.startsWith(t),
	[StringOps.NOT_STARTS_WITH]: (s, t) => !s.startsWith(t),
	[StringOps.ENDS_WITH]: (s, t) => s.endsWith(t),
	[StringOps.NOT_ENDS_WITH]: (s, t) => !s.endsWith(t),
	[StringOps.IS]: (s, t) => s === t,
	[StringOps.IS_NOT]: (s, t) => s !== t,
}

const numberOpHandlers: Record<string, (n: number, t: number) => boolean> = {
	[NumberOps.EQUALS]: (n, t) => n === t,
	[NumberOps.NOT_EQUALS]: (n, t) => n !== t,
	[NumberOps.GREATER_THAN]: (n, t) => n > t,
	[NumberOps.LESS_THAN]: (n, t) => n < t,
	[NumberOps.GREATER_THAN_OR_EQUAL]: (n, t) => n >= t,
	[NumberOps.LESS_THAN_OR_EQUAL]: (n, t) => n <= t,
}

/** Whether one record satisfies one filter — client-side matching used by
 *  `applyFilters`. Types without a local predicate (time, date_relative,
 *  entity_list, custom, nested) pass through like upstream. */
export function matchesFilter(row: Record<string, unknown>, filter: PowerSearchFilter): boolean {
	const fieldValue = row[filter.field]
	const { operator, value: filterValue } = filter

	switch (filterValue.type) {
		case 'empty': {
			if (operator === BooleanOps.IS_TRUE) {
				return Boolean(fieldValue) === true
			}
			if (operator === BooleanOps.IS_FALSE) {
				return Boolean(fieldValue) === false
			}
			return true
		}
		case 'string': {
			if (typeof fieldValue !== 'string') {
				return false
			}
			const handler = stringOpHandlers[operator]
			if (handler) {
				return handler(fieldValue.toLowerCase(), filterValue.value.toLowerCase())
			}
			return true
		}
		case 'integer':
		case 'float': {
			if (typeof fieldValue !== 'number') {
				return false
			}
			const handler = numberOpHandlers[operator]
			if (handler) {
				return handler(fieldValue, filterValue.value)
			}
			return true
		}
		case 'date_absolute': {
			if (!(fieldValue instanceof Date) && typeof fieldValue !== 'number') {
				return false
			}
			const ts = toUnixSeconds(fieldValue)
			if (operator === DateOps.BEFORE) {
				return ts < filterValue.unixSeconds
			}
			if (operator === DateOps.AFTER) {
				return ts > filterValue.unixSeconds
			}
			return true
		}
		case 'date_range': {
			if (!(fieldValue instanceof Date) && typeof fieldValue !== 'number') {
				return false
			}
			const ts = toUnixSeconds(fieldValue)
			if (operator === DateOps.BETWEEN) {
				const nowSeconds = Date.now() / 1000
				const start = resolveDateTimeRangePart(filterValue.value.start, nowSeconds)
				const end = resolveDateTimeRangePart(filterValue.value.end, nowSeconds)
				return ts >= start && ts <= end
			}

			return true
		}
		case 'enum': {
			if (typeof fieldValue !== 'string') {
				return false
			}
			if (operator === EnumOps.IS) {
				return fieldValue === filterValue.value
			}
			if (operator === EnumOps.IS_NOT) {
				return fieldValue !== filterValue.value
			}
			return true
		}
		case 'enum_list':
		case 'string_list': {
			const values = toStringValues(fieldValue)
			if (values == null) {
				return false
			}
			if (operator === ListOps.IS_ANY_OF) {
				return values.some((v) => filterValue.value.includes(v))
			}
			if (operator === ListOps.IS_NONE_OF) {
				return values.every((v) => !filterValue.value.includes(v))
			}
			return true
		}
		case 'time':
		case 'date_relative':
		case 'entity_list':
		case 'custom':
		case 'nested':
			return true
	}
}

/**
 * Build a `PowerSearchConfig` and a matching `applyFilters` from simplified
 * field definitions.
 *
 * @example
 * ```
 * const defs = [
 *   { key: 'name', type: 'string', label: 'Name' },
 *   { key: 'age', type: 'number', label: 'Age' },
 *   { key: 'active', type: 'boolean', label: 'Active' },
 * ] as const;
 * const { config, applyFilters } = createPowerSearchConfig(defs);
 * const filtered = applyFilters(filters, data);
 * ```
 */
export function createPowerSearchConfig<const D extends ReadonlyArray<FieldDefinition>>(
	definitions: D,
	configName?: string,
): {
	config: PowerSearchConfig
	applyFilters: <T extends InferData<D>>(
		filters: ReadonlyArray<PowerSearchFilter>,
		data: ReadonlyArray<T>,
	) => T[]
} {
	const config: PowerSearchConfig = {
		name: configName ?? 'PowerSearchConfig',
		fields: definitions.map(buildField),
	}

	function applyFilters<T extends InferData<D>>(
		filters: ReadonlyArray<PowerSearchFilter>,
		data: ReadonlyArray<T>,
	): T[] {
		if (filters.length === 0) {
			return [...data]
		}
		return data.filter((row) =>
			filters.every((f) => matchesFilter(row as Record<string, unknown>, f)),
		)
	}

	return { config, applyFilters }
}

/** Memoized `createPowerSearchConfig` for component bodies. */
export function usePowerSearchConfig<const D extends ReadonlyArray<FieldDefinition>>(
	definitions: D,
	configName?: string,
) {
	return useMemo(() => createPowerSearchConfig(definitions, configName), [definitions, configName])
}
