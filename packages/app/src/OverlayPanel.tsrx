import { View, Text, Pressable } from '@octane-xplat/ui';
import { closeOverlay } from './platform/overlay';

/** Overlay content — rendered into a ContentView hosted by RootLayout.open. */
export function OverlayPanel() @{
	console.log('[probe] OverlayPanel render');
	<View className="overlay-panel" style={{ padding: 24, margin: 40 }}>
		<Text className="text-xl font-bold">Overlay content</Text>
		<Pressable onPress={closeOverlay} className="btn bg-primary">
			<Text className="text-onprimary">Close</Text>
		</Pressable>
	</View>
}
