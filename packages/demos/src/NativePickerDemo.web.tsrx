import { useState } from 'octane'
import { Heading, Text, View } from '@octane-xplat/ui'
import { Select } from '@octane-xplat/picker/web'
import type { SelectOption } from '@octane-xplat/picker/web'

const POLL_LENGTHS: SelectOption[] = [
	{ value: '60', label: '1 hour' },
	{ value: '1440', label: '1 day' },
	{ value: '10080', label: '7 days' },
]

/** Demonstrates the browser select value and change contract. */
export function NativePickerDemo() @{
	const [value, setValue] = useState('1440')
	const selected = POLL_LENGTHS.find((option) => option.value === value)

	<View className="controls-demo gap-4">
		<Heading>Web select</Heading>
		<Text>Poll length</Text>
		<Select
			id="native-picker-poll-length"
			label="Poll length"
			options={POLL_LENGTHS}
			value={value}
			onChange={setValue}
			accessibilityLabel="Poll length"
		/>
		<Text>{`Selected: ${selected?.label ?? 'none'} (${value} minutes)`}</Text>
	</View>
}
