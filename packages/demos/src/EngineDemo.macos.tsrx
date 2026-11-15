/** @jsxImportSource @octane-xplat/jsx */
import { Text, View } from '@octane-xplat/ui'

export function EngineDemo() @{
  <View className="gap-4">
    <Text className="text-lg font-semibold">3D engines</Text>
    <Text id="engine-status-pc">
      Canvas and WebGL2 are unsupported by the experimental AppKit host.
    </Text>
  </View>
}
