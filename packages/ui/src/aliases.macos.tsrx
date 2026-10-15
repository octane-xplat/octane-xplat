/** @jsxImportSource @octane-xplat/macos-renderer */
import { Select } from './Select.macos.tsrx'
import type { MultiSelectorProps } from './props'

/** SelectMenu — multi-select anchored listbox (`Selector` with selectionMode="multiple"). */
export function SelectMenu(props: MultiSelectorProps) @{
	return <Select
		{...props}
		selectionMode="multiple"
	/>
}
