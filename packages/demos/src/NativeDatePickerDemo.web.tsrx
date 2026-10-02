import { useState } from 'octane'
import { Heading, Text, View, Pressable } from '@octane-xplat/ui'
import { DateInput, DateRangeInput, DateTimeInput, type DateRange, type ISODateString, type ISODateTimeString } from '@octane-xplat/ui'

function toLocalDate(date: Date): ISODateString {
	const pad = (n: number) => String(n).padStart(2, '0')
	return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` as ISODateString
}

/** Demonstrates the shared ISO date contract with the adaptive calendar. */
export function NativeDatePickerDemo() @{
	const [appointment, setAppointment] = useState<ISODateTimeString | undefined>('2026-10-02T10:00')
	const [range, setRange] = useState<DateRange | null>(null)
	const [value, setValue] = useState<ISODateString | undefined>(toLocalDate(new Date(Date.now() + 86400000)))

	<View className="controls-demo gap-4">
		<Heading>Date input</Heading>
		<Text>Poll closes</Text>
		<DateInput
			id="native-date-picker-poll-close"
			label="Closes"
			locale="fr-FR"
			presentation="popover"
			messages={{ openCalendar: 'Ouvrir le calendrier', closeCalendar: 'Fermer le calendrier', invalidDate: 'Saisissez une date valide', previousMonth: 'Mois précédent', nextMonth: 'Mois suivant', selected: (date) => `Sélection : ${date}` }}
			value={value}
			min={toLocalDate(new Date())}
			onChange={setValue}
			accessibilityLabel="Poll closing date"
		/>
		<Text>{`Closes: ${value || 'unset'}`}</Text>
		<Text>French date entry: 04/05/2026 means 4 May. In the calendar, arrows move focus; Enter selects.</Text>
		<DateTimeInput label="Appointment" value={appointment} onChange={setAppointment} presentation="popover" timeOptionInterval={15} />
		<Text>Focus the time field, use arrows to highlight a choice, then Enter. Typed times between choices stay exact.</Text>
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
