/** @jsxImportSource @nativescript-community/octane */
import { Select } from './Select'
import type { MultiSelectorProps } from './props'

/** SelectMenu — multi-select anchored listbox (Select with `multiple`). */
export function SelectMenu(props: MultiSelectorProps) @{
	return <Select
		{...props}
		multiple={true}
		onValueChange={(value) => props.onValueChange?.(Array.isArray(value) ? value : [])}
		changeAction={props.changeAction ? (value) => props.changeAction?.(Array.isArray(value) ? value : []) : undefined}
	/>
}
