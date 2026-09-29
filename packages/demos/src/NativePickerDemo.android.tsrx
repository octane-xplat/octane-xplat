import { useState } from 'octane'
import { Heading, Text, View } from '@octane-xplat/ui'
import { MaterialDropdown } from '@octane-xplat/picker/android'
import type { MaterialDropdownItem } from '@octane-xplat/picker/android'

const POLL_LENGTHS: MaterialDropdownItem[] = [
	{ key: '60', text: '1 hour' },
	{ key: '1440', text: '1 day' },
	{ key: '10080', text: '7 days' },
]

/** Demonstrates the Material dropdown key and enabled contract. */
export function NativePickerDemo() @{
	const [selectedKey, setSelectedKey] = useState('1440')
	const selected = POLL_LENGTHS.find((item) => item.key === selectedKey)

	<View className="controls-demo gap-4">
		<Heading>Material dropdown</Heading>
		<Text>Poll length</Text>
		<MaterialDropdown
			id="native-picker-poll-length"
			label="Poll length"
			items={POLL_LENGTHS}
			selectedKey={selectedKey}
			onSelectedKeyChange={setSelectedKey}
			accessibilityLabel="Poll length"
		/>
		<Text>{`Selected: ${selected?.text ?? 'none'} (${selectedKey} minutes)`}</Text>
	</View>
}
