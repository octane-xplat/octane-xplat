/** @jsxImportSource @nativescript-community/octane */
import { Text, View } from '@octane-xplat/ui'

export function NativeDatePickerDemo() @{
	<View className="gap-4">
		<Text className="text-lg font-semibold">Native date picker</Text>
		<Text id="native-date-picker-status">
			Native date pickers are unsupported on the Windows host.
		</Text>
	</View>;
}
