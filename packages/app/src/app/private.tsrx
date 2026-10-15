import { Screen, Text } from '@octane-xplat/ui';
import { redirect } from '@octane-xplat/ui/routing';
import type { BeforeLoadArgs } from '@octane-xplat/ui/routing';

/** Guard-redirect probe: beforeLoad throws RouteRedirect to detail — this
 *  screen never commits; Detail's own beforeLoad still runs on the target,
 *  so the pushed page shows 'guard: private'. */
export function beforeLoad(_args: BeforeLoadArgs) {
	redirect({ stack: 'root', name: 'detail', params: { from: 'private' } });
}

export function Private() @{
	<Screen className="vx-app">
		<Text>unreachable — the guard always redirects</Text>
	</Screen>
}
