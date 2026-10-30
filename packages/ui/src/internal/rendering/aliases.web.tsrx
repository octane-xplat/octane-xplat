/** @jsxImportSource @octane-xplat/jsx/dom */
import { Select } from '../../components/forms/Select.web.tsrx'
import type { MultiSelectorProps } from '../../props'
import type { JSX } from 'octane/jsx-runtime'

/** SelectMenu — multi-select anchored listbox (`Selector` with selectionMode="multiple"). */
export function SelectMenu(props: MultiSelectorProps): JSX.Element @{
	return <Select {...props} selectionMode="multiple" />
}
