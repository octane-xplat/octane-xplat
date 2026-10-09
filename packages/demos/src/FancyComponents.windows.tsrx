/** @jsxImportSource @nativescript-community/octane */
import { Text, View } from '@octane-xplat/ui'

/** The motion leaf is verified on web, iOS, and Android — keep an explicit
 *  unsupported notice on the Windows host rather than silent divergence. */
export function FancyComponents() @{
	<View className="gap-4">
		<Text className="text-lg font-semibold">Fancy components</Text>
		<Text id="fancy-components-status">
			The fancy components showcase runs on web, iOS, and Android.
		</Text>
	</View>
}
