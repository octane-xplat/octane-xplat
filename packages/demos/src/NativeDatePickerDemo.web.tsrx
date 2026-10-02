import { useState } from 'octane'
import { Heading, Text, View, Pressable } from '@octane-xplat/ui'
import { DateInput, DateRangeInput, type DateRange, type ISODateString } from '@octane-xplat/ui'

function toLocalDate(date: Date): ISODateString {
	const pad = (n: number) => String(n).padStart(2, '0')
	return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` as ISODateString
}

/** Demonstrates the shared ISO date contract with the adaptive calendar. */
export function NativeDatePickerDemo() @{
	const [range, setRange] = useState<DateRange | null>(null)
	const [value, setValue] = useState<ISODateString | undefined>(toLocalDate(new Date(Date.now() + 86400000)))

	<View className="controls-demo gap-4">
		<Heading>Date input</Heading>
		<Text>Poll closes</Text>
		<DateInput
			id="native-date-picker-poll-close"
			label="Closes"
			value={value}
			min={toLocalDate(new Date())}
			onChange={setValue}
			accessibilityLabel="Poll closing date"
		/>
		<Text>{`Closes: ${value || 'unset'}`}</Text>
		<DateRangeInput
			label="Booking dates"
			value={range}
			onChange={setRange}
			maxRangeSpan={7}
			presets={[
				{ label: 'Tomorrow', getRange: () => {
					const date = toLocalDate(new Date(Date.now() + 86400000))
					return { start: date, end: date }
				} },
			]}
		/>
		<Text>{range ? `Booking: ${range.start} – ${range.end}` : 'Booking unset'}</Text>
		<Pressable onPress={() => { setValue(undefined); setRange(null) }}>
			<Text>Reset dates</Text>
		</Pressable>
	</View>
}
