import type { SelectOption } from './props'

export function selectValues(value: string | string[] | null | undefined): string[] {
	return value == null ? [] : Array.isArray(value) ? [...new Set(value)] : [value]
}

export function sameSelection(a: string[], b: string[]): boolean {
	return a.length === b.length && a.every((value, index) => value === b[index])
}

export function filterSelectOptions(options: SelectOption[], query: string): SelectOption[] {
	const lower = query.toLowerCase()
	return options.filter((option) => (option.label ?? option.value).toLowerCase().includes(lower))
}

export function groupSelectOptions(
	options: SelectOption[],
): { heading: string | undefined; options: SelectOption[] }[] {
	const groups = new Map<string | undefined, SelectOption[]>()
	for (const option of options) {
		const rows = groups.get(option.group)
		if (rows) {
			rows.push(option)
		} else {
			groups.set(option.group, [option])
		}
	}

	return [...groups].map(([heading, rows]) => ({ heading, options: rows }))
}

/** Bulk toggles affect only the visible enabled set, retaining hidden/disabled values. */
export function toggleVisibleSelection(selected: string[], options: SelectOption[]): string[] {
	const enabled = options.filter((option) => !option.isDisabled).map((option) => option.value)
	if (!enabled.length) {
		return selected
	}

	const allSelected = enabled.every((value) => selected.includes(value))
	return allSelected
		? selected.filter((value) => !enabled.includes(value))
		: [...new Set([...selected, ...enabled])]
}
