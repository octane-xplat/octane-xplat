import { Screen, Text, View } from '@octane-xplat/ui';

/** Shared fallback — view-effect shaders are platform-authentic
 *  (`@octane-xplat/effects/{ios,android}`) and have no web surface: the
 *  DOM has no per-element fragment shader. `.ios.tsrx`/`.android.tsrx`
 *  leaves of this demo render the real effects. */
export function EffectsDemo() @{
	<Screen className="vx-app flex-1 gap-4">
		<Text className="text-xl font-semibold">Shader effects</Text>
		<View className="sink-section">
			<Text className="text-sm text-muted">
				View-effect shaders are platform-authentic — iOS uses SwiftUI
				stitchable Metal (iOS 17+), Android uses AGSL RuntimeShader
				(API 33+). There is no web equivalent on purpose: a canvas
				overlay pretending to affect rendered views would be fake
				parity, not the feature.
			</Text>
		</View>
	</Screen>
}
