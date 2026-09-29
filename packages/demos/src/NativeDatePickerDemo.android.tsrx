/** @jsxImportSource @nativescript-community/octane */
import { useState } from 'octane'
import { Heading, Text, View } from '@octane-xplat/ui'
import { MaterialDatePicker } from '@octane-xplat/date-picker/android'

// Module-scope constants — DatePickerState keys `remember` on initialDate and
// the selectable range, so per-render `new Date(...)` would recreate the
// picker state and reset the selection on every emitted event.
const INITIAL = new Date(Date.now() + 86400000)
const MINIMUM = new Date()

/** Demonstrates the Material 3 DatePicker initialDate/onDateSelected contract. */
export function NativeDatePickerDemo() @{
	const [selected, setSelected] = useState<Date | null>(null)

	<View className="controls-demo gap-4">
		<Heading>Material date picker</Heading>
		<Text>Poll closes</Text>
		<MaterialDatePicker
			id="native-date-picker-poll-close"
			style={{ height: 400 }}
			initialDate={INITIAL}
			displayedComponents="date"
			selectableDates={{ start: MINIMUM }}
			onDateSelected={setSelected}
			accessibilityLabel="Poll closing date"
		/>
		<Text>{`Selected: ${selected ? selected.toDateString() : 'none'}`}</Text>
	</View>
}
