import { useState } from 'octane'
import { Field, Pressable, Text, TextInput, View, useKeyboardInset } from '@octane-xplat/ui'

export function KeyboardSpaceDemo() @{
	const [enabled, setEnabled] = useState(true)
	const inset = useKeyboardInset({ enabled })

	<View>
		<Text>Keyboard space: {inset} dip</Text>
		<Pressable onPress={() => setEnabled(!enabled)}>
			<Text>{enabled ? 'Pause keyboard tracking' : 'Resume keyboard tracking'}</Text>
		</Pressable>
		<Field label="Message">
			<TextInput placeholder="Tap to open the keyboard" />
		</Field>
	</View>
}
