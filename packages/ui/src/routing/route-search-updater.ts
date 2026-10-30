import { readRouterMatch } from './router-instance'
import type {
	NavigationResult,
	PreparedRouteMatch,
	RouteDestinationInput,
	RouterNavigator,
} from '../props'

export type SearchUpdateResult =
	| NavigationResult<any>
	| {
			readonly status: 'cancelled'
			readonly reason: 'superseded'
			readonly path?: undefined
			readonly error?: undefined
	  }
	| {
			readonly status: 'invalid-input'
			readonly path: 'search'
			readonly error: unknown
			readonly reason?: undefined
	  }

/** A rendering entry owns search edits. This cannot target an inactive entry
 * or quietly change another record that uses the same route pattern. */
export function createSearchUpdater(
	owner: object,
	navigator: RouterNavigator<any, string, string>,
	entry: PreparedRouteMatch,
) {
	return async (search: unknown, options?: { replace?: boolean }): Promise<SearchUpdateResult> => {
		const before = navigator.getSnapshot()
		if (!before.route || readRouterMatch(owner, before.route) !== entry) {
			return { status: 'cancelled', reason: 'superseded' } as const
		}
		try {
			const previous = Object.fromEntries(
				Object.entries(entry.search).map(([key, value]) => [
					key,
					Array.isArray(value) ? [...value] : value,
				]),
			)

			const next = typeof search === 'function' ? search(previous) : search
			// A callback must be synchronous and pure. Reentrant navigation or
			// disposal cannot turn this stale read into a later winning edit.
			if (navigator.getSnapshot() !== before) {
				return { status: 'cancelled', reason: 'superseded' } as const
			}

			if (
				next === null ||
				typeof next !== 'object' ||
				Array.isArray(next) ||
				typeof (next as { then?: unknown }).then === 'function'
			) {
				throw new TypeError('Search updates must return a search input object synchronously')
			}

			const destination: RouteDestinationInput = {
				to: entry.to,
				params: entry.params,
				search: next,
				hash: entry.hash,
				replace: options?.replace ?? true,
				presentation: 'push',
				transition: 'none',
			}

			// The named accessor established the route contract. This erased
			// implementation still goes through the ordinary runtime pipeline.
			return navigator.navigate(destination as Parameters<typeof navigator.navigate>[0])
		} catch (error) {
			return { status: 'invalid-input', path: 'search', error } as const
		}
	}
}
