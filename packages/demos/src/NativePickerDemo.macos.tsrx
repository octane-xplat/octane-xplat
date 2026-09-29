/** @jsxImportSource @xplat/macos/renderer */
import { Text, View } from '@octane-xplat/ui'

export function NativePickerDemo() @{
	<View className="gap-4">
		<Text className="text-lg font-semibold">Native picker</Text>
		<Text id="native-picker-status">
			Native pickers are unsupported by the experimental AppKit host.
		</Text>
	</View>;
}
