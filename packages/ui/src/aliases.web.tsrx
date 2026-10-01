import { Select } from './Select.web.tsrx'
import type { SelectProps } from './props'

/** SelectMenu — multi-select anchored listbox (Select with `multiple`). */
export function SelectMenu(props: SelectProps) @{
	return <Select {...props} multiple={true} />
}
