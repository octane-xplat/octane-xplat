import { View, Text, Pressable } from '@octane-xplat/ui';
import { closeOverlay } from './platform/overlay';

/** Overlay content — rendered into a ContentView hosted by RootLayout.open. */
export function OverlayPanel() @{
	console.log('[probe] OverlayPanel render');

	<View className="overlay-panel">
		<Text className="text-xl font-semibold">Overlay content</Text>
		<Pressable onPress={closeOverlay} className="btn btn-secondary">
			<Text>Close</Text>
		</Pressable>
	</View>
}
