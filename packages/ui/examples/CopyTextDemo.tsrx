import { useSignal$ } from 'octane/signals/client'
import { Pressable, Text, View, useClipboard } from '@octane-xplat/ui'

export function CopyTextDemo() @{
	const status$ = useSignal$('Ready to copy')
	const { clipboardProps } = useClipboard({
		getItems: () => 'Hello from Xplat',
		onCopy: (success) => status$.set(success ? 'Copied' : 'Copy unavailable'),
	})

	<View>
		<Pressable {...clipboardProps}><Text>Copy greeting</Text></Pressable>
		<Text>{status$.get()}</Text>
	</View>
}
