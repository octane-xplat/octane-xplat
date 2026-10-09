/** @jsxImportSource @octane-xplat/macos-renderer */
import { Text, View } from '@octane-xplat/ui'

/** The motion leaf's gesture/reduced-motion hosts are mobile + web only —
 *  same scope as the motion-probe route stub. */
export function MotionPatterns() @{
	<View className="gap-4">
		<Text className="text-lg font-semibold">Motion patterns</Text>
		<Text id="motion-patterns-status">
			The motion patterns showcase runs on web, iOS, and Android.
		</Text>
	</View>
}
