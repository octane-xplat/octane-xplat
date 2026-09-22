import { Screen, Text, Pressable } from '@xplat/ui';
import { goBack } from './platform/nav';

/** Second screen — pushed via Frame.navigate on native, own Octane root. */
export function Detail() @{
	console.log('[probe] Detail render');
	<Screen className="vx-app detail">
		<Text className="text-xl font-bold">Detail screen</Text>
		<Pressable onPress={goBack} className="btn bg-primary">
			<Text className="text-onprimary">Back</Text>
		</Pressable>
	</Screen>
}
