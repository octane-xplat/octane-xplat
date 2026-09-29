import { useState } from 'octane'
import { Heading, Text, View } from '@octane-xplat/ui'
import { NativePicker } from './nativePickerControl'
import type { NativePickerOption } from '@octane-xplat/native-picker/types'

const POLL_LENGTHS: NativePickerOption[] = [
	{ value: '60', label: '1 hour' },
	{ value: '1440', label: '1 day' },
	{ value: '10080', label: '7 days' },
]

/** Native island pilot, using TextCoral's existing poll-length choices. */
export function NativePickerDemo() @{
	const [duration, setDuration] = useState('1440')
	const selected = POLL_LENGTHS.find((option) => option.value === duration)

	<View className="controls-demo gap-4">
		<Heading>Native picker</Heading>
		<Text>Poll length</Text>
		<NativePicker
			id="native-picker-poll-length"
			label="Poll length"
			options={POLL_LENGTHS}
			value={duration}
			onValueChange={setDuration}
			accessibilityLabel="Poll length"
		/>
		<Text>{`Selected: ${selected?.label ?? 'none'} (${duration} minutes)`}</Text>
	</View>
}
