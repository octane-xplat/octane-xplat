import { useState } from 'octane'
import { Heading, Text, View } from '@octane-xplat/ui'
import { DateInput } from '@octane-xplat/date-picker/web'

function toLocalInputValue(date: Date): string {
	const pad = (n: number) => String(n).padStart(2, '0')
	return (
		`${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
		`T${pad(date.getHours())}:${pad(date.getMinutes())}`
	)
}

/** Demonstrates the browser datetime-local input contract. */
export function NativeDatePickerDemo() @{
	const [value, setValue] = useState(toLocalInputValue(new Date(Date.now() + 86400000)))

	<View className="controls-demo gap-4">
		<Heading>Web date input</Heading>
		<Text>Poll closes</Text>
		<DateInput
			id="native-date-picker-poll-close"
			label="Closes"
			type="datetime-local"
			value={value}
			min={toLocalInputValue(new Date())}
			onChange={setValue}
			accessibilityLabel="Poll closing time"
		/>
		<Text>{`Closes: ${value || 'unset'}`}</Text>
	</View>
}
