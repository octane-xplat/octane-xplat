import { Screen, Text, Pressable } from '@octane-xplat/ui';
import { redirect, useRouter, useRouterState } from '@octane-xplat/ui/routing';
import type { RouteHead } from '@octane-xplat/ui/routing';
import type { RouteGuardArgs, RouteProps } from '../routes.gen.contracts';

/** External URL search is untrusted; screens receive validated strings. */
export function validateSearch(raw: { from?: unknown }) {
	if (raw.from !== undefined && typeof raw.from !== 'string') throw new TypeError('from must be a string');
	return { from: raw.from ?? 'unknown' };
}

export function beforeLoad({ search, context }: RouteGuardArgs<'/detail'>) {
	if (search.from === 'redirect') redirect({ to: '/detail', search: { from: 'redirect-target' } });
	return { loadedFrom: search.from, guardSawRoute: context.previousRouteName };
}

export const head = (): RouteHead => ({
	title: 'Detail · Octane Xplat',
	meta: { description: 'Detail screen' },
});

/** Every native pushed Page owns its navigator; browser screens use the same hook. */
export function Detail(props: RouteProps<'/detail'>) @{
	const navigation = useRouter();
	const state = useRouterState();
	const back = state.canGoBack;
	console.log('[probe] Detail render from=' + props.search.from);

	<Screen className="vx-app detail gap-3">
		<Text className="text-2xl font-semibold">Detail screen</Text>
		<Text className="text-sm text-muted">{'from: ' + (props.search.from ?? '—')}</Text>
		<Text className="text-sm text-muted">{'guard: ' + (props.context.loadedFrom ?? '—')}</Text>
		<Text className="text-sm text-muted">{'guard saw route: ' + (props.context.guardSawRoute ?? '—')}</Text>
		<Text className="text-sm text-muted">{'pushed: ' + String(state.route?.to === '/detail')}</Text>
		<Text className="text-sm text-muted">{'can go back: ' + String(back)}</Text>
		@if (back) {
			<Pressable id="detail-back" onPress={() => navigation.back()} className="btn btn-secondary">
				<Text>Back</Text>
			</Pressable>
		}
	</Screen>
}
