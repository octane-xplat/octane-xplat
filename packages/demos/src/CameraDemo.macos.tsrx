/** @jsxImportSource @xplat/macos/renderer */
import { Text, View } from '@octane-xplat/ui'

export function CameraDemo() @{
	<View className="gap-4">
		<Text className="text-lg font-semibold">Camera</Text>
		<Text id="camera-status">
			Camera preview is unsupported by the experimental AppKit host.
		</Text>
	</View>;
}
