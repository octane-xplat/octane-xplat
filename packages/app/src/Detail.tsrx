import { Screen, Text, Pressable } from '@octane-xplat/ui';
import { goBack } from './platform/nav';

/** Second screen — pushed via Frame.navigate on native, own Octane root.
 *  Route params land as props (navigate('detail', {from}) → props.from). */
export function Detail(props: { from?: string }) @{
	console.log('[probe] Detail render from=' + props.from);
	<Screen className="vx-app detail">
		<Text className="text-xl font-bold">Detail screen</Text>
		<Text>{'from: ' + (props.from ?? '—')}</Text>
		<Pressable onPress={goBack} className="btn bg-primary">
			<Text className="text-onprimary">Back</Text>
		</Pressable>
	</Screen>
}
