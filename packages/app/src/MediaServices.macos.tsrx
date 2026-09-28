/** @jsxImportSource @xplat/macos/renderer */
import { Text, View } from '@octane-xplat/ui'

export function MediaServices() @{
	<View className="sink-section gap-2">
		<Text className="section-label">Optional media services</Text>
		<Text>Audio playback, UI sounds, and haptic feedback are unsupported by the experimental AppKit host.</Text>
	</View>;
}
