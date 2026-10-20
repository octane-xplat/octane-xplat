import type { RouteTransitionContext, RouteTransitionResult, TransitionDefinition } from './props'

/** @internal Platform animation boundary for incoming retained panes. */
export interface PaneRouteTransitions {
	run(
		context: RouteTransitionContext,
		name: string | undefined,
		definition: TransitionDefinition | undefined,
		view: unknown,
	): Promise<RouteTransitionResult>
	interrupt(): void
}
