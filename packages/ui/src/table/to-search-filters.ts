// toSearchFilters — converts table filter state to PowerSearchFilter[] for
// `applyFilters`. Port of upstream plugins/filtering/useTableFiltering's
// resolution (Astryx 0.6.4, MIT).

import type { TableFilterFieldRef, TableColumn } from '../props'
import type { TableFilterState, TableFilterValue } from './types'
import type {
	PowerSearchConfig,
	PowerSearchField,
	PowerSearchOperator,
	PowerSearchFilter,
	FilterValue,
	OperatorValue,
} from '../props'

/** Resolve the operator for a PowerSearch field — explicit key, then
 *  `defaultOperator`, then the first operator. */
function resolveOperator(
	field: PowerSearchField,
	operatorKey?: string,
): PowerSearchOperator | undefined {
	if (operatorKey) {
		return field.operators.find((o) => o.key === operatorKey)
	}
	if (field.defaultOperator) {
		return field.operators.find((o) => o.key === field.defaultOperator)
	}
	return field.operators[0]
}

/** Resolve a column's filter field reference to a concrete OperatorValue. */
export function resolveFilterConfig(
	filter: TableFilterFieldRef | string,
	searchConfig: PowerSearchConfig,
): OperatorValue | undefined {
	const fieldKey = typeof filter === 'string' ? filter : filter.field
	const operatorKey = typeof filter === 'string' ? undefined : filter.operator
	const field = searchConfig.fields.find((f) => f.key === fieldKey)
	if (!field) {
		return undefined
	}
	const operator = resolveOperator(field, operatorKey)
	return operator?.value
}

/** Convert a table filter value to a PowerSearch FilterValue based on the
 *  operator's value type. */
function tableValueToFilterValue(
	value: TableFilterValue,
	opValue: OperatorValue,
): FilterValue | undefined {
	switch (opValue.type) {
		case 'string':
			return typeof value === 'string' ? { type: 'string', value } : undefined
		case 'integer':
			return typeof value === 'number' ? { type: 'integer', value } : undefined
		case 'float':
			return typeof value === 'number' ? { type: 'float', value } : undefined
		case 'enum':
			return typeof value === 'string' ? { type: 'enum', value } : undefined
		case 'enum_list':
			return Array.isArray(value) ? { type: 'enum_list', value } : undefined
		case 'date_absolute':
			return typeof value === 'string'
				? { type: 'date_absolute', unixSeconds: Math.floor(new Date(value).getTime() / 1000) }
				: undefined
		case 'time':
			return typeof value === 'string' ? { type: 'time', value } : undefined
		case 'string_list':
			return Array.isArray(value) ? { type: 'string_list', value } : undefined
		case 'entity_list':
			return Array.isArray(value)
				? { type: 'entity_list', value: value.map((id) => ({ id, label: id })) }
				: undefined
		default:
			return undefined
	}
}

/**
 * Convert table filter state to `PowerSearchFilter[]` for use with
 * `applyFilters`. Each non-empty entry resolves its field/operator from the
 * column config + `searchConfig`.
 */
export function toSearchFilters<_T extends Record<string, unknown>>(
	filters: TableFilterState,
	columns: ReadonlyArray<Pick<TableColumn<_T>, 'key' | 'filter'>>,
	searchConfig: PowerSearchConfig,
): PowerSearchFilter[] {
	const result: PowerSearchFilter[] = []
	for (const col of columns) {
		if (!col.filter) {
			continue
		}

		const value = filters[col.key]
		if (value == null) {
			continue
		}

		const fieldKey = typeof col.filter === 'string' ? col.filter : col.filter.field
		const operatorKey = typeof col.filter === 'string' ? undefined : col.filter.operator
		const field = searchConfig.fields.find((f) => f.key === fieldKey)
		if (!field) {
			continue
		}

		const operator = resolveOperator(field, operatorKey)
		if (!operator) {
			continue
		}

		const filterValue = tableValueToFilterValue(value, operator.value)
		if (!filterValue) {
			continue
		}

		result.push({ field: fieldKey, operator: operator.key, value: filterValue })
	}
	return result
}
