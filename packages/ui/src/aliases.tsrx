/** @jsxImportSource @nativescript-community/octane */
import { Select } from './Select.tsrx'
import type { SelectProps } from './props'

/** SelectMenu — multi-select anchored listbox (Select with `multiple`). */
export function SelectMenu(props: SelectProps) @{
	return <Select {...props} multiple={true} />
}

/** Combobox — searchable anchored listbox (Select with `searchable`). */
export function Combobox(props: SelectProps) @{
	return <Select {...props} searchable={true} />
}

/** InputMenu — alias of Combobox (searchable anchored listbox). */
export function InputMenu(props: SelectProps) @{
	return <Select {...props} searchable={true} />
}
