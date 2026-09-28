/** @jsxImportSource @xplat/macos/renderer */
import { Text, View } from '@octane-xplat/ui'

export function EffectsDemo() @{
	<View className="flex-1 gap-4">
		<Text className="text-xl font-semibold">Shader effects</Text>
		<Text>Shader effects are unsupported by the experimental AppKit host.</Text>
	</View>;
}
