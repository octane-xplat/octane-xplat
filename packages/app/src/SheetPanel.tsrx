import { View, Text, Pressable } from '@octane-xplat/ui';
import { closeSheet } from './platform/sheet';

/** Bottom-sheet content — hosted in a ContentView by RootLayout.open. */
export function SheetPanel() @{
	console.log('[probe] SheetPanel render');

	<View className="sheet-panel">
		<Text className="text-xl font-semibold">Sheet content</Text>
		<Pressable onPress={closeSheet} className="btn btn-secondary">
			<Text>Dismiss</Text>
		</Pressable>
	</View>
}
