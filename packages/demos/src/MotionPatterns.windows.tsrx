/** @jsxImportSource @nativescript-community/octane */
import { Text, View } from '@octane-xplat/ui'

/** The motion leaf is verified on web, iOS, and Android — keep an explicit
 *  unsupported notice on the Windows host rather than silent divergence. */
export function MotionPatterns() @{
	<View className="gap-4">
		<Text className="text-lg font-semibold">Motion patterns</Text>
		<Text id="motion-patterns-status">
			The motion patterns showcase runs on web, iOS, and Android.
		</Text>
	</View>
}
