// macOS leaf of @octane-xplat/ui/routing/dev — binds the AppKit default router.
import { router } from '../default-router.macos'
import { registerRouterDevActionsFor } from './dev-shared'

export function registerRouterDevActions(): { dispose(): void } {
	return registerRouterDevActionsFor(router)
}
