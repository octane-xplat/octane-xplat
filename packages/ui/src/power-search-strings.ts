/** Default English strings for the PowerSearch family — the portable stand-in
 *  for Astryx's `@astryx.powersearch.*` / `@astryx.moreMenu.*` catalog keys.
 *  There is no i18n provider seam in this build: `label` operator variants are
 *  verbatim, `i18nKey` variants resolve through this map, and an unknown key
 *  falls back to its final path segment. `{count}` plurals collapse to the
 *  English one/other rule. */

const STRINGS: Record<string, string> = {
	'@astryx.powersearch.label': 'Search',
	'@astryx.powersearch.placeholder': 'Search\u2026',
	'@astryx.powersearch.resultCount': '{count, plural, one {# result} other {# results}}',
	'@astryx.powersearch.editor.field': 'Field',
	'@astryx.powersearch.editor.operator': 'Operator',
	'@astryx.powersearch.editor.addFilter': '+ Add filter',
	'@astryx.powersearch.editor.removeFilter': 'Remove filter',
	'@astryx.powersearch.editor.groupOperator': 'Group operator',
	'@astryx.powersearch.editor.group': 'Group',
	'@astryx.powersearch.editor.delete': 'Delete',
	'@astryx.powersearch.editor.cancel': 'Cancel',
	'@astryx.powersearch.editor.apply': 'Apply',
	'@astryx.powersearch.valueEditor.value': 'Value',
	'@astryx.powersearch.valueEditor.values': 'Values',
	'@astryx.powersearch.valueEditor.time': 'Time',
	'@astryx.powersearch.valueEditor.date': 'Date',
	'@astryx.powersearch.valueEditor.relativeDate': 'Relative date',
	'@astryx.powersearch.valueEditor.startDate': 'Start date',
	'@astryx.powersearch.valueEditor.endDate': 'End date',
	'@astryx.powersearch.valueEditor.entities': 'Entities',
	'@astryx.powersearch.valueEditor.searchPlaceholder': 'Search\u2026',
	'@astryx.powersearch.valueEditor.enterValuePlaceholder': 'Enter value\u2026',
	'@astryx.powersearch.valueEditor.addValuesPlaceholder': 'Add values\u2026',
	'@astryx.powersearch.valueEditor.enterNumberPlaceholder': 'Enter number\u2026',
	'@astryx.powersearch.valueEditor.selectValuesPlaceholder': 'Select values\u2026',
	'@astryx.powersearch.valueEditor.dateRange': 'date range',
	'@astryx.powersearch.valueEditor.itemsCount': '{count, plural, one {# item} other {# items}}',
	'@astryx.powersearch.valueEditor.entitiesCount': '{count, plural, one {# entity} other {# entities}}',
	'@astryx.powersearch.valueEditor.filtersCount': '{count, plural, one {# filter} other {# filters}}',
	'@astryx.powersearch.operator.contains': 'contains',
	'@astryx.powersearch.operator.notContains': 'does not contain',
	'@astryx.powersearch.operator.startsWith': 'starts with',
	'@astryx.powersearch.operator.notStartsWith': 'does not start with',
	'@astryx.powersearch.operator.endsWith': 'ends with',
	'@astryx.powersearch.operator.notEndsWith': 'does not end with',
	'@astryx.powersearch.operator.is': 'is',
	'@astryx.powersearch.operator.isNot': 'is not',
	'@astryx.powersearch.operator.equals': 'is',
	'@astryx.powersearch.operator.notEquals': 'is not',
	'@astryx.powersearch.operator.greaterThan': 'is greater than',
	'@astryx.powersearch.operator.lessThan': 'is less than',
	'@astryx.powersearch.operator.greaterThanOrEqual': 'is greater than or equal to',
	'@astryx.powersearch.operator.lessThanOrEqual': 'is less than or equal to',
	'@astryx.powersearch.operator.before': 'is before',
	'@astryx.powersearch.operator.after': 'is after',
	'@astryx.powersearch.operator.between': 'is between',
	'@astryx.powersearch.operator.isTrue': 'is true',
	'@astryx.powersearch.operator.isFalse': 'is false',
	'@astryx.powersearch.operator.isAnyOf': 'is any of',
	'@astryx.powersearch.operator.isNoneOf': 'is none of',
	'@astryx.moreMenu.label': 'More options',
}

export type PowerSearchTranslate = (key: string, params?: { count?: number }) => string

/** Catalog lookup with a `{count, plural, ...}` subset. Not exported as a
 *  general i18n facility — PowerSearch internals only. */
export const powerSearchTranslate: PowerSearchTranslate = (key, params) => {
	let text = STRINGS[key]
	if (text == null) {
		// Unknown catalog key — fall back to the last path segment so a custom
		// operator still reads sensibly ('my.app.operator.inRegion' → 'inRegion').
		const segment = key.split('.').pop() ?? key
		return segment.replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase()
	}

	if (params?.count != null) {
		const count = params.count
		text = text.replace(
			/\{count, plural, one \{([^}]*)\} other \{([^}]*)\}\}/g,
			(_m, one, other) => (count === 1 ? one : other),
		)

		text = text.replace(/\{count, number\}|#/g, String(count))
	}

	return text
}
