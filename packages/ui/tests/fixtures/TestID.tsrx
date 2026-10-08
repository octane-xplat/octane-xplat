import { useState } from 'octane'
import { Button, Overlay, Pressable, SearchInput, Stack, Switch, Text, TextArea, TextInput, View } from '@octane-xplat/ui'

/** Maintained nonvisual automation fixture; every launch starts from known state. */
export default function TestID() {
	const [count, setCount] = useState(0)
	const [message, setMessage] = useState('')
	const [open, setOpen] = useState(false)
	const [item, setItem] = useState<string | undefined>('a')
	const [checked, setChecked] = useState(false)
	return <Stack testID="screen.controls" style={{ padding: 24, gap: 8 }}>
		<Text testID="counter.value">{'Count: ' + count}</Text>
		<View testID="counter.group">
			<Button id="legacy-increment" testID="counter.increment" accessibilityLabel="Increment" label="Increment" onPress={() => setCount(count + 1)} />
		</View>
		<TextInput id="legacy-entry" testID="message.entry" accessibilityLabel="Message" value={message} onChange={setMessage} />
		<Text testID="message.value">{'Message: ' + message}</Text>
		<TextArea testID="message.notes" accessibilityLabel="Notes" value="notes" rows={1} />
		<SearchInput testID="message.search" accessibilityLabel="Search messages" icon={false} hasClear={false} />
		<Switch testID="settings.enabled" label="Enable setting" checked={checked} onCheckedChange={setChecked} />
		<Text testID="settings.value">{'Enabled: ' + checked}</Text>
		<Pressable testID={item ? 'item.' + item + '.open' : undefined} accessibilityLabel="Reusable item" accessibilityRole="button" onPress={() => setCount(count + 1)}><Text>Reusable item</Text></Pressable>
		<Button testID="items.rebind" label="Rebind item" accessibilityLabel="Rebind item" onPress={() => setItem(item === 'a' ? 'b' : undefined)} />
		<Button testID="overlay.open" label="Open overlay" accessibilityLabel="Open overlay" onPress={() => setOpen(true)} />
		<Overlay testID="overlay.content" open={open} accessibilityLabel="Message overlay" onDismiss={() => setOpen(false)}>
			<Stack style={{ padding: 48, gap: 16 }}>
				<Text testID="overlay.status">Overlay is open</Text>
				<Button testID="overlay.close" label="Close overlay" accessibilityLabel="Close overlay" onPress={() => setOpen(false)} />
			</Stack>
		</Overlay>
	</Stack>
}
