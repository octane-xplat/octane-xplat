/** @jsxImportSource @octane-xplat/macos-renderer */
import { Text, View } from '@octane-xplat/ui'

export function NativeSheetDemo() @{
	<View className="gap-4">
		<Text className="text-lg font-semibold">Native sheet</Text>
		<Text id="native-sheet-status">
			Native sheets are unsupported by the experimental AppKit host.
		</Text>
	</View>;
}
