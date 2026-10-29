/** @jsxImportSource @octane-xplat/jsx */
import { useState } from 'octane'
import { Button, Heading, SegmentedControl, Text, View } from '@octane-xplat/ui'
import { AppKitDatePicker } from '@octane-xplat/date-picker/macos'
import type { AppKitDatePickerComponents } from '@octane-xplat/date-picker/macos'

const INITIAL = new Date(2026, 9, 29, 12, 30)
const MINIMUM = new Date(2026, 0, 1), MAXIMUM = new Date(2026, 11, 31, 23, 59, 59, 999)

export function NativeDatePickerDemo() @{
	const [selection, setSelection] = useState(INITIAL), [mode, setMode] = useState<AppKitDatePickerComponents>('dateAndTime')
	const [graphical, setGraphical] = useState(false), [controlled, setControlled] = useState(true)
	const [disabled, setDisabled] = useState(false), [bounded, setBounded] = useState(true), [mounted, setMounted] = useState(true)
	const [invalid, setInvalid] = useState(false), [alternate, setAlternate] = useState(false)
	const [events, setEvents] = useState(0), [callback, setCallback] = useState('none')
	<View className="gap-4">
		<Heading>AppKit date picker</Heading>
		<SegmentedControl value={mode} options={[{ value: 'date', label: 'Date' }, { value: 'time', label: 'Time' }, { value: 'dateAndTime', label: 'Date and time' }]}
			onValueChange={(value) => { if (value === 'date' || value === 'time' || value === 'dateAndTime') setMode(value) }} accessibilityLabel="Displayed components" />
		<Button label="Toggle text/calendar style" clickAction={() => setGraphical(!graphical)} />
		<Button label="Toggle controlled selection" clickAction={() => setControlled(!controlled)} />
		<Button label="Toggle disabled" clickAction={() => setDisabled(!disabled)} />
		<Button label="Toggle bounds" clickAction={() => setBounded(!bounded)} />
		<Button label="Toggle invalid controlled date" clickAction={() => { setControlled(true); setInvalid(!invalid) }} />
		<Button label="Reset selection" clickAction={() => { setControlled(true); setSelection(INITIAL); setInvalid(false) }} />
		<Button label="Replace selection callback" clickAction={() => setAlternate(!alternate)} />
		<Button label="Mount/unmount picker" clickAction={() => setMounted(!mounted)} />
		@if (mounted) {
			<AppKitDatePicker id="native-date-picker-control" components={mode} pickerStyle={graphical ? 'graphical' : 'textField'}
				selection={controlled ? (invalid ? new Date(NaN) : selection) : undefined} defaultSelection={INITIAL}
				minimumDate={bounded ? MINIMUM : undefined} maximumDate={bounded ? MAXIMUM : undefined} disabled={disabled}
				accessibilityLabel="Poll closing time" onSelectionChange={(date) => { setSelection(date); setEvents((n) => n + 1); setCallback(alternate ? 'B' : 'A') }} />
		}
		<Text id="native-date-picker-status">
			{`${controlled ? 'Controlled' : 'Uncontrolled'} · ${mode} · ${selection.toLocaleString()} · ${events} changes · callback ${callback}`}
		</Text>
		<Text>Source implementation; native text/IME/Tab/VoiceOver and layout qualification is pending. Invalid or out-of-bounds controlled dates show a message; Reset selection recovers. Graphical style applies to date mode; time uses its native clock.</Text>
	</View>
}
