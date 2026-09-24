import { View, Text, Pressable } from '@octane-xplat/ui';
import { closeSheet } from './platform/sheet';

/** Bottom-sheet content — hosted in a ContentView by RootLayout.open. */
export function SheetPanel() @{
	console.log('[probe] SheetPanel render');

	<View
		className="sheet-panel"
		style={{ padding: 24, backgroundColor: '#222', borderTopLeftRadius: 16, borderTopRightRadius: 16 }}
	>
		<Text className="text-xl font-bold">Sheet content</Text>
		<Pressable onPress={closeSheet} className="btn bg-primary">
			<Text className="text-onprimary">Dismiss</Text>
		</Pressable>
	</View>
}
