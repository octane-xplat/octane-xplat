import type { NavigateArgs, RouteName } from '../routes'

import { popRoute, pushRoute } from '@octane-xplat/ui'

// Web seam for the nav contract — real paths over history. `into` selects
// the outlet: a named stack renders inside its tab pane (nested-route
// semantics for parallel stacks), 'root' covers the whole shell.
export function navigate(...args: NavigateArgs) {
	const [name, params, opts] = args as [
		RouteName,
		Record<string, unknown>?,
		{ into?: string; presentation?: 'push' | 'modal' | 'fade' }?,
	]
	pushRoute({
		stack: opts?.into ?? 'root',
		name,
		params: params ?? {},
		presentation: opts?.presentation,
	})
	console.log('[probe] nav web → ' + location.pathname)
}

export function goBack(opts: { into?: string } = {}) {
	popRoute(opts.into ?? 'root')
}

/** Hardware back is an Android concern — no-op on web (browser back is
 *  already real history). */
export function wireHardwareBack() {}
