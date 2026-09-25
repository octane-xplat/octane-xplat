import { Pressable, Screen, Text } from '@octane-xplat/ui';

/** about+modal — the `+modal` suffix declares presentation:'modal' on the
 *  manifest: native shows it as a showModal root over the presenter,
 *  web overlays it on the shell while keeping the underlying URL. The
 *  screen gets a `close` prop (and popRoute also dismisses). */
export function About(props: { close?: () => void }) @{
	console.log('[probe] About modal render');

	<Screen className="vx-app about-modal gap-3">
		<Text className="text-2xl font-semibold">About (modal route)</Text>
		<Pressable onPress={() => props.close?.()} className="btn btn-secondary">
			<Text>Close</Text>
		</Pressable>
	</Screen>
}
