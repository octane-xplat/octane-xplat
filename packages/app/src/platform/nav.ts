import { popRoute, pushRoute } from '@octane-xplat/ui'

import type { NavigateArgs, RouteName } from '../routes'

/**
 * Frame stack navigation. `navigate(name, params, {into})` delegates to
 * `@octane-xplat/ui`'s pushRoute — the screen table is derived from the
 * app/ route dir (registerRoutes in ../routes.ts), each pushed Page
 * hosts its own Octane root (modals/pages never share context with their
 * presenter — decision #9). Params land as props; `_stack` is injected on
 * named-stack pushes so the pushed screen can goBack its own stack.
 * Default target: the 'root' stack (the app's root Frame).
 */
export function navigate(...args: NavigateArgs) {
	const [name, params, opts] = args as [
		RouteName,
		Record<string, unknown>?,
		{ into?: string; presentation?: 'push' | 'modal' | 'fade' }?,
	]

	lastNavStack = opts?.into ?? 'root'
	pushRoute({ stack: lastNavStack, name, params: params ?? {}, presentation: opts?.presentation })
	console.log('[probe] nav pushed ' + name + ' into ' + lastNavStack)
}

export function goBack(opts: { into?: string } = {}) {
	popRoute(opts.into ?? 'root')
	console.log('[probe] nav goBack ' + (opts.into ?? 'root'))
}

let lastNavStack = 'root'

/** Android hardware back is framework-owned: `route.native` installs the
 *  `activityBackPressed` listener at screen/stack registration and pops
 *  the visible stack (modal → root → most-recently-used named stack).
 *  Apps needing first dibs register `useBackInterceptor`/`addBackInterceptor`
 *  from `@octane-xplat/ui`. */
