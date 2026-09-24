import { Application, Frame } from '@nativescript/core';
import { getStack, popRoute, pushRoute, stackEntries } from '@octane-xplat/ui';
import type { RouteName } from '../routes';

/**
 * Frame stack navigation. `navigate(name, params, {into})` delegates to
 * `@octane-xplat/ui`'s pushRoute — the screen table is derived from the
 * app/ route dir (registerRoutes in ../routes.ts), each pushed Page
 * hosts its own Octane root (modals/pages never share context with their
 * presenter — decision #9). Params land as props; `_stack` is injected on
 * named-stack pushes so the pushed screen can goBack its own stack.
 * Default target: the 'root' stack (the app's root Frame).
 */
export function navigate(
	name: RouteName,
	params: Record<string, unknown> = {},
	opts: { into?: string } = {},
) {
	lastNavStack = opts.into ?? 'root';
	pushRoute({ stack: lastNavStack, name, params });
	console.log('[probe] nav pushed ' + name + ' into ' + lastNavStack);
}

export function goBack(opts: { into?: string } = {}) {
	popRoute(opts.into ?? 'root');
	console.log('[probe] nav goBack ' + (opts.into ?? 'root'));
}

let lastNavStack = 'root';

/** Android hardware back. NS's default pops `Frame.topmost()` — the
 *  innermost frame — which is wrong when a root-pushed page covers the
 *  screen, and broken for TabViewItem frames anyway (their backStack
 *  bookkeeping stalls upstream). Pop order: the root stack when it has
 *  a pushed page covering the shell, else the most recently targeted
 *  named stack, else any named stack with entries. */
export function wireHardwareBack() {
	if (!Application.android) return;
	Application.android.on('activityBackPressed', (e: any) => {
		const root = getStack('root') as Frame | undefined;
		if (root && root.backStack.length > 0) {
			root.goBack();
			e.cancel = true;
			return;
		}

		const order = [lastNavStack, ...[...stackEntries()].map(([n]) => n).reverse()];
		for (const name of order) {
			if (name === 'root') continue;
			const f = getStack(name) as Frame | undefined;
			if (f && f.backStack.length > 0) {
				f.goBack();
				e.cancel = true;
				return;
			}
		}
	});

	console.log('[probe] hardware back wired (android)');
}
