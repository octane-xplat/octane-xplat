import type { RouteName } from '../routes';

import { popRoute, pushRoute } from '@octane-xplat/ui';

// Web seam for the nav contract — real paths over history. `into` selects
// the outlet: a named stack renders inside its tab pane (nested-route
// semantics for parallel stacks), 'root' covers the whole shell.
export function navigate(
	name: RouteName,
	params: Record<string, unknown> = {},
	opts: { into?: string } = {},
) {
	pushRoute({ stack: opts.into ?? 'root', name, params });
	console.log('[probe] nav web → ' + location.pathname);
}

export function goBack(opts: { into?: string } = {}) {
	popRoute(opts.into ?? 'root');
}

/** Hardware back is an Android concern — no-op on web (browser back is
 *  already real history). */
export function wireHardwareBack() {}
