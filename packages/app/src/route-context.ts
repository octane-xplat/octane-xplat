import { router } from '@octane-xplat/ui/routing'
/** Client harness dependency; guards receive a stable snapshot before commit. */
export function routeContext(): { previousRouteName: string } {
	return { previousRouteName: router.getSnapshot().route?.name ?? 'none' }
}
