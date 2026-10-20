import { Pressable, Screen, Text } from '@octane-xplat/ui';

import { useRouter } from '@octane-xplat/ui/routing';

/** The route-owned navigator dismisses this presentation on every target. */
export function About() @{
	const navigation = useRouter();
	console.log('[probe] About modal render');

	<Screen className="vx-app about-modal gap-3">
		<Text className="text-2xl font-semibold">About (modal route)</Text>
		<Pressable onPress={() => navigation.dismiss()} className="btn btn-secondary">
			<Text>Close</Text>
		</Pressable>
	</Screen>
}
