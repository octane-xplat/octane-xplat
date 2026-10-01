/** @jsxImportSource @xplat/macos/renderer */
import { Select } from './Select.macos.tsrx'
import type { SelectProps } from './props'

/** SelectMenu — multi-select anchored listbox (Select with `multiple`). */
export function SelectMenu(props: SelectProps) @{
	return <Select {...props} multiple={true} />
}
