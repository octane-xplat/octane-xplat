import { useState } from 'octane'
import { Heading, Text, View } from '@octane-xplat/ui'
import { SwiftUIPicker } from '@octane-xplat/picker/ios'
import type { SwiftUIPickerOption } from '@octane-xplat/picker/ios'

const POLL_LENGTHS: SwiftUIPickerOption[] = [
	{ id: '60', title: '1 hour' },
	{ id: '1440', title: '1 day' },
	{ id: '10080', title: '7 days' },
]

/** Demonstrates the SwiftUI Picker selection contract. */
export function NativePickerDemo() @{
	const [selection, setSelection] = useState('1440')
	const selected = POLL_LENGTHS.find((option) => option.id === selection)

	<View className="controls-demo gap-4">
		<Heading>SwiftUI picker</Heading>
		<Text>Poll length</Text>
		<SwiftUIPicker
			id="native-picker-poll-length"
			label="Poll length"
			options={POLL_LENGTHS}
			selection={selection}
			onSelectionChange={setSelection}
			accessibilityLabel="Poll length"
		/>
		<Text>{`Selected: ${selected?.title ?? 'none'} (${selection} minutes)`}</Text>
	</View>
}
