import { useEffect, useMemo, useRef, useState } from 'octane'
import type { SelectOption, SelectProps } from './props'
import {
	filterSelectOptions,
	groupSelectOptions,
	sameSelection,
	selectValues,
	toggleVisibleSelection,
} from './select-options'

/** Shared finite-list state; platform leaves own focus, events, and hosting. */
export function useSelect(props: SelectProps) {
	const latest = useRef(props)
	latest.current = props
	const [internalOpen, setInternalOpen] = useState(props.defaultOpen ?? false)
	const [internalValue, setInternalValue] = useState(selectValues(props.defaultValue))
	const [query, setQueryState] = useState('')
	const [pending, setPending] = useState<string[] | null>(null)
	const pendingRef = useRef(false)
	const alive = useRef(true)
	const blocked = props.isDisabled || props.isReadOnly
	const requestedOpen = props.open ?? internalOpen
	const open = requestedOpen && !blocked
	const selected =
		pending ?? (props.value !== undefined ? selectValues(props.value) : internalValue)

	const groups = groupSelectOptions(
		filterSelectOptions(props.options, props.searchable ? query : ''),
	)

	const shown = groups.flatMap((group) => group.options)
	const enabled = shown.filter((option) => !option.isDisabled)
	const selectedCount = enabled.filter((option) => selected.includes(option.value)).length
	const allSelected = enabled.length > 0 && selectedCount === enabled.length
	const selectAllState: 'checked' | 'indeterminate' | 'unchecked' = allSelected
		? 'checked'
		: selectedCount
			? 'indeterminate'
			: 'unchecked'

	const busy = Boolean(props.isLoading || pending)

	const setQuery = (next: string) => {
		setQueryState(next)
		latest.current.onChangeQuery?.(next)
	}

	const setOpen = (next: boolean) => {
		if (next && (latest.current.isDisabled || latest.current.isReadOnly)) {
			return
		}

		if (latest.current.open === undefined) {
			setInternalOpen(next)
		}

		if (!next && query) {
			setQuery('')
		}

		latest.current.onOpenChange?.(next)
	}

	useEffect(() => {
		if (blocked && requestedOpen) {
			setOpen(false)
		}
	}, [blocked, requestedOpen])

	useEffect(() => {
		if (!open && query) {
			setQuery('')
		}
	}, [open])

	useEffect(
		() => () => {
			alive.current = false
		},
		[],
	)

	const report = async (keys: string[]) => {
		const current = latest.current
		if (current.isDisabled || current.isReadOnly || pendingRef.current) {
			return
		}

		const previous = selected
		const value = current.multiple ? keys : (keys[0] ?? null)
		const action = current.changeAction
		if (action) {
			pendingRef.current = true
			setPending(keys)
		}

		if (current.value === undefined) {
			setInternalValue(keys)
		}

		try {
			current.onValueChange?.(value)
			await action?.(value)
		} catch (error) {
			if (!alive.current) {
				return
			}

			const nextProps = latest.current
			if (nextProps.value === undefined || sameSelection(selectValues(nextProps.value), keys)) {
				if (nextProps.value === undefined) {
					setInternalValue(previous)
				}

				nextProps.onValueChange?.(nextProps.multiple ? previous : (previous[0] ?? null))
			}

			nextProps.onChangeError?.(error)
		} finally {
			pendingRef.current = false
			if (alive.current) {
				setPending(null)
			}
		}
	}

	const pick = (option: SelectOption) => {
		if (option.isDisabled || blocked || pendingRef.current) {
			return
		}

		void report(
			props.multiple
				? selected.includes(option.value)
					? selected.filter((value) => value !== option.value)
					: [...selected, option.value]
				: [option.value],
		)

		if (!props.multiple) {
			setOpen(false)
		}
	}

	const clear = () => {
		if (!props.hasClear || blocked || pendingRef.current) {
			return
		}

		void report([])
		props.onClear?.()
		setOpen(false)
	}

	const selectAll = () => {
		if (!props.multiple || !props.hasSelectAll || blocked || pendingRef.current) {
			return
		}

		void report(toggleVisibleSelection(selected, shown))
	}

	const items = selected.map((value) => ({
		value,
		label: props.options.find((option) => option.value === value)?.label ?? value,
	}))

	const triggerText = items.length
		? (props.formatValue?.(items) ??
			(props.multiple && props.triggerDisplay === 'count'
				? `${items.length} selected`
				: items.map((item) => item.label).join(', ')))
		: (props.placeholder ?? '')

	const emptyText = query
		? (props.emptySearchText ?? 'No results found')
		: (props.emptyText ?? 'No options')

	const announcement = busy
		? 'Loading…'
		: query
			? `${shown.length} results. ${shown.length ? '' : emptyText}`
			: props.multiple
				? `${selected.length} selected`
				: ''

	return useMemo(
		() => ({
			open,
			selected,
			query,
			groups,
			shown,
			enabled,
			selectAllState,
			busy,
			pending: pending !== null,
			blocked: Boolean(blocked),
			triggerText,
			emptyText,
			announcement,
			setOpen,
			setQuery,
			pick,
			clear,
			selectAll,
		}),
		[open, selected, query, props, pending, internalValue, internalOpen],
	)
}
