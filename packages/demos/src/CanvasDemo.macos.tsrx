/** @jsxImportSource @xplat/macos/renderer */
import { Text, View } from '@octane-xplat/ui'

export function CanvasDemo() @{
	<View className="gap-4">
		<Text className="text-lg font-semibold">Canvas / WebGPU</Text>
		<Text id="gpu-canvas-status">
			Canvas and WebGPU are unsupported by the experimental AppKit host.
		</Text>
	</View>;
}
