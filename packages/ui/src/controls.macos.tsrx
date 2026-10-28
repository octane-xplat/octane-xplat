/** @jsxImportSource @octane-xplat/jsx */
import { useState } from 'octane'
import type { SearchInputProps } from './props'

import { TextInput } from './text-controls.macos.tsrx'

export { Button } from './Button.macos.tsrx'

export { Checkbox } from './Checkbox.macos.tsrx'

export { Switch } from './Switch.macos.tsrx'

export { Slider } from './Slider.macos.tsrx'

export { SegmentedControl } from './SegmentedControl.macos.tsrx'

export function SearchInput(props: SearchInputProps) @{
	const [internal, setInternal] = useState(props.defaultValue ?? '')
	const value = props.value ?? internal
	const setValue = (next: string) => {
		if (props.isDisabled || props.isReadOnly) {
			return
		}

		if (props.value === undefined) {
			setInternal(next)
		}

		props.onChange?.(next)
	}

	<TextInput
		{...props}
		value={value}
		onChange={setValue}
		hasClear={props.hasClear !== false}
		placeholder={props.placeholder}
		returnKeyType="search"
		startIcon={props.icon === false ? undefined : props.icon ?? 'xplat-search'}
	/>
}

export { ActivityIndicator } from './ActivityIndicator.macos.tsrx'
