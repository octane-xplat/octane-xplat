/** @jsxImportSource @nativescript-community/octane */
import { Text, View } from '@octane-xplat/ui'

export function NativeSheetDemo() @{
	<View className="gap-4">
		<Text className="text-lg font-semibold">Native sheet</Text>
		<Text id="native-sheet-status">
			Native sheets are unsupported on the Windows host.
		</Text>
	</View>;
}
