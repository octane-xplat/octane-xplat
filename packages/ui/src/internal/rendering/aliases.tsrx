/** @jsxImportSource @octane-xplat/jsx */
import { Select } from '../../components/forms/Select'
import type { MultiSelectorProps } from '../../props'

/** SelectMenu — multi-select anchored listbox (`Selector` with selectionMode="multiple"). */
export function SelectMenu(props: MultiSelectorProps): unknown @{
	return <Select {...props} selectionMode="multiple" />
}
