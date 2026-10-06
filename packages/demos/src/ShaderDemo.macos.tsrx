/** @jsxImportSource @octane-xplat/macos-renderer */
import { Text, View } from '@octane-xplat/ui'

export function ShaderDemo() @{
	<View className="flex-1 gap-4">
		<Text className="text-xl font-semibold">Shader / SimplexNoise</Text>
		<Text>
			The shaders adapter is unsupported by the AppKit host — there is no
			WebGPU surface here. On web and NativeScript iOS/Android the same
			demo renders a live SimplexNoise shader.
		</Text>
	</View>;
}
