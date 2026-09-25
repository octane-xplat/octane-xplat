import { Screen, Text, Pressable, useCanGoBack } from '@octane-xplat/ui';
import type { BeforeLoadArgs, RouteHead } from '@octane-xplat/ui';
import { goBack } from '../platform/nav';

/** Route guards run before the URL/Page commit; the returned context is
 * merged into the pushed screen's props on both targets. */
export async function beforeLoad({ params }: BeforeLoadArgs) {
	return { loadedFrom: String(params.from ?? 'unknown') };
}

export const head = (params: Record<string, unknown>): RouteHead => ({
	title: 'Detail · Octane Xplat',
	meta: { description: `Detail opened from ${String(params.from ?? 'unknown')}` },
});

/** detail route — pushed via Frame.navigate on native, own Octane root.
 *  Route params land as props (navigate('detail', {from}) → props.from). */
export function Detail(props: { from?: string; loadedFrom?: string; _stack?: string; _pushed?: boolean }) @{
	const stack = props._stack ?? 'root';
	const back = useCanGoBack(stack);
	console.log('[probe] Detail render from=' + props.from);

	<Screen className="vx-app detail gap-3">
		<Text className="text-2xl font-semibold">Detail screen</Text>
		<Text className="text-sm text-muted">{'from: ' + (props.from ?? '—')}</Text>
		<Text className="text-sm text-muted">{'guard: ' + (props.loadedFrom ?? '—')}</Text>
		@if (back) {
			<Pressable id="detail-back" onPress={goBack} className="btn btn-secondary">
				<Text>Back</Text>
			</Pressable>
		}
	</Screen>
}
