/** @jsxImportSource @octane-xplat/jsx */
import type { SelectProps } from './props'
import { useFieldControlProps } from './field-context'
import { useSelect } from './useSelect'
import { SelectView } from './SelectView.macos.tsrx'

/** Finite-list selection with local search; Typeahead owns async result sources. */
export function Select(inputProps: SelectProps) @{
	const props = useFieldControlProps(inputProps)
	const state = useSelect(props)

	<SelectView
		{...props}
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
		onOpenChange={state.setOpen}
		onQueryChange={state.setQuery}
		onPick={state.pick}
		onClear={state.clear}
		onSelectAll={state.selectAll}
	/>
}
