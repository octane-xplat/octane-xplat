// Web leaf of @octane-xplat/ui/routing/dev — binds the browser default router.
import { router } from '../default-router.web'
import { registerRouterDevActionsFor } from './dev-shared'

export function registerRouterDevActions(): { dispose(): void } {
	return registerRouterDevActionsFor(router)
}
