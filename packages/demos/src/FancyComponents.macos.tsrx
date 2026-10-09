/** @jsxImportSource @octane-xplat/macos-renderer */
import { Text, View } from '@octane-xplat/ui'

/** The motion leaf's hosts are mobile + web only — same scope as the
 *  motion-probe route stub. */
export function FancyComponents() @{
	<View className="gap-4">
		<Text className="text-lg font-semibold">Fancy components</Text>
		<Text id="fancy-components-status">
			The fancy components showcase runs on web, iOS, and Android.
		</Text>
	</View>
}
