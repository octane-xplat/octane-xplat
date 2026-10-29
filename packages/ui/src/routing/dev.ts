// @octane-xplat/ui/routing/dev — dev-only framework actions for the default
// router. Loaded by generated route registration behind import.meta.env.DEV;
// absent from production builds.
import { router } from './default-router'
import { registerRouterDevActionsFor } from './dev-shared'

export function registerRouterDevActions(): { dispose(): void } {
	return registerRouterDevActionsFor(router)
}
