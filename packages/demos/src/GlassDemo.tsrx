import { Screen, Text, View } from '@octane-xplat/ui';

/** Shared fallback — Liquid Glass is iOS-authentic (UIGlassEffect, iOS 26+),
 *  so it lives behind `@octane-xplat/ui/ios` and only the `.ios.tsrx` leaf
 *  of this demo renders it. There is deliberately no backdrop-filter
 *  stand-in: an approximation would be fake parity, not the material. */
export function GlassDemo() @{
	<Screen className="vx-app flex-1 gap-4">
		<Text className="text-xl font-semibold">Liquid Glass</Text>
		<View className="sink-section">
			<Text className="text-sm text-muted">
				Liquid Glass is an iOS-authentic widget — it lives in @octane-xplat/ui/ios
				and renders only inside `.ios.tsrx` leaves on iOS 26+. There is no shared
				or web version on purpose.
			</Text>
		</View>
	</Screen>
}
