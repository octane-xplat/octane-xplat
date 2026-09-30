/** @jsxImportSource @xplat/macos/renderer */
import { Text, View } from '@octane-xplat/ui'

export function NativeDatePickerDemo() @{
	<View className="gap-4">
		<Text className="text-lg font-semibold">Native date picker</Text>
		<Text id="native-date-picker-status">
			Native date pickers are unsupported by the experimental AppKit host.
		</Text>
	</View>;
}
