/** @jsxImportSource @octane-xplat/jsx */
import type { SelectProps } from './props'
import { useFieldControl } from './field-context'
import { useId } from 'octane'
import { FormField } from './FormField.macos.tsrx'
import { useSelect } from './useSelect'
import { SelectView } from './SelectView.macos.tsrx'

/** Finite-list selection with local search; Typeahead owns async result sources. */
export function Select(inputProps: SelectProps) @{
	const { props, inField } = useFieldControl(inputProps)
	const generatedID = useId()
	const controlID = props.id ?? generatedID
	const state = useSelect(props)

	const view = <SelectView
		{...props}
		id={controlID}
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
		onOpenChange={state.setOpen}
		onQueryChange={state.setQuery}
		onPick={state.pick}
		onClear={state.clear}
		onSelectAll={state.selectAll}
	/>
	@if (inField) {
		{view}
	} @else {
		<FormField inputID={controlID} label={props.label} description={props.description} status={props.status}
			statusVariant={props.statusVariant} isDisabled={props.isDisabled} isReadOnly={props.isReadOnly}
			isLoading={props.isLoading || state.pending} isRequired={props.isRequired} isOptional={props.isOptional}
			isLabelHidden={props.isLabelHidden} disabledMessage={props.disabledMessage} labelTooltip={props.labelTooltip}
			width={props.width} size={props.size}>{view}</FormField>
	}

}
