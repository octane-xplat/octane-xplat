import type { ClientRouteEntry } from './client-route-entry'
import type { RouterHostCommand, RouterHostPreparation, RouterInstance } from './props'

/** A retained entry supplies a location and presentation, never authorization
 * or reusable loader data. The original attempt owns validation and context. */
export function prepareHistoryEntry(
	instance: RouterInstance<any>,
	command: RouterHostCommand,
	entry: Pick<ClientRouteEntry, 'flow' | 'route'>,
): Promise<RouterHostPreparation> {
	if (!command.prepare) {
		return Promise.resolve({ status: 'unsupported', operation: 'history-preparation' })
	}
	const resolved = instance.resolveUrl(entry.route.href)
	if (resolved.status !== 'matched') {
		return Promise.resolve(resolved)
	}
	return command.prepare(
		{
			...resolved.destination,
			stack: entry.route.stack,
			presentation: entry.route.presentation,
			transition: entry.route.transition,
		},
		entry.flow,
	)
}
