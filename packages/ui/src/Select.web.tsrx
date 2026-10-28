import { useState } from 'octane'
import type { SelectProps } from './props'
import { useFieldControlProps } from './field-context'
import { useSelect } from './useSelect'
import { SelectView } from './SelectView.web.tsrx'

/** Finite-list selection. Async entity search belongs to Typeahead. */
export function Select(inputProps: SelectProps) @{
	const props = useFieldControlProps(inputProps)
	const state = useSelect(props)
	const [highlight, setHighlight] = useState<string | null>(null)
	const active =
		state.enabled.find((option) => option.value === highlight) ??
		state.enabled.find((option) => state.selected.includes(option.value)) ??
		state.enabled[0]

	<SelectView
		{...props}
		multiple={props.selectionMode === 'multiple'}
		open={state.open}
		query={state.query}
		selected={state.selected}
		groups={state.groups}
		shown={state.shown}
		enabled={state.enabled}
		selectAllState={state.selectAllState}
		pending={state.pending}
		triggerText={state.triggerText}
		emptyText={state.emptyText}
		announcement={state.announcement}
		activeValue={active?.value ?? null}
		onOpenChange={state.setOpen}
		onQueryChange={state.setQuery}
		onPick={state.pick}
		onClear={state.clear}
		onSelectAll={state.selectAll}
		onActiveValueChange={setHighlight}
	/>
}
