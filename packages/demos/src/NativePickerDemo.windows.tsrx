/** @jsxImportSource @nativescript-community/octane */
import { Text, View } from '@octane-xplat/ui'

export function NativePickerDemo() @{
	<View className="gap-4">
		<Text className="text-lg font-semibold">Native picker</Text>
		<Text id="native-picker-status">
			Native pickers are unsupported on the Windows host.
		</Text>
	</View>;
}
