import { useSignal$ } from 'octane/signals/client'
import { Pressable, Text, View, useClipboard } from '@octane-xplat/ui'

export function CopyTextDemo() @{
	const failed$ = useSignal$(false)
	const { clipboardProps, isCopied } = useClipboard({
		getItems: () => 'Hello from Xplat',
		announce: 'Copied',
		onCopy: (success) => failed$.set(!success),
	})

	<View>
		<Pressable {...clipboardProps}>
			<Text>{isCopied ? 'Copied' : 'Copy greeting'}</Text>
		</Pressable>
		{failed$.get() && !isCopied ? <Text>Copy unavailable</Text> : null}
	</View>
}
