import type { PaneRouteTransitions } from './pane-route-transition-types'

/** Other hosts require an explicit platform executor. */
export function createPaneRouteTransitions(): PaneRouteTransitions {
	return {
		interrupt() {},
		run(context, name, definition) {
			return Promise.resolve({
				status: 'skipped',
				reason:
					context.action === 'refresh' || !name || name === 'none' || definition?.kind === 'skip'
						? 'disabled'
						: 'unsupported',
			})
		},
	}
}
