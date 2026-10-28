import { Select } from './Select.web.tsrx'
import type { MultiSelectorProps } from './props'

/** SelectMenu — multi-select anchored listbox (`Selector` with selectionMode="multiple"). */
export function SelectMenu(props: MultiSelectorProps) @{
	return <Select {...props} selectionMode="multiple" />
}
