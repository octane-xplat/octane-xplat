/** @jsxImportSource @nativescript-community/octane */
import { useState } from 'octane'
import { Heading, Text, View } from '@octane-xplat/ui'
import { SwiftUIDatePicker } from '@octane-xplat/date-picker/ios'

// Module-scope constants — props pushed across the bridge on every re-render
// should be identity-stable, or the native side may see its inputs as changed
// and drop picker state.
const INITIAL = new Date(Date.now() + 86400000)
const MINIMUM = new Date()

/** Demonstrates the SwiftUI DatePicker selection contract. */
export function NativeDatePickerDemo() @{
	const [selection, setSelection] = useState(INITIAL)

	<View className="controls-demo gap-4">
		<Heading>SwiftUI date picker</Heading>
		<Text>Poll closes</Text>
		<SwiftUIDatePicker
			id="native-date-picker-poll-close"
			title="Closes"
			selection={selection}
			minimumDate={MINIMUM}
			displayedComponents={['date', 'hourAndMinute']}
			onSelectionChange={setSelection}
			accessibilityLabel="Poll closing time"
		/>
		<Text>{`Closes: ${selection.toLocaleString()}`}</Text>
	</View>
}
