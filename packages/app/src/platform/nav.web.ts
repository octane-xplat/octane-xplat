import type { RouteName } from '../screens';

import { pushRoute } from '@xplat/ui';

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

export function goBack(_opts: { into?: string } = {}) {
	history.back();
}
