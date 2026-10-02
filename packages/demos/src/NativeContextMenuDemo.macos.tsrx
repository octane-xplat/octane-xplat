/** @jsxImportSource @octane-xplat/macos-renderer */
import { Text, View } from '@octane-xplat/ui'

export function NativeContextMenuDemo() @{
	<View className="gap-4">
		<Text className="text-lg font-semibold">Native context menu</Text>
		<Text id="native-context-menu-status">
			Native context menus are unsupported by the experimental AppKit host.
		</Text>
	</View>;
}
