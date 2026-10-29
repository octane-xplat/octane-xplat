import { useEffect, useState } from 'octane'
import {
	canonicalQueryKey,
	type QueryClient,
	type QueryDefinition,
	type QueryKeyPart,
	type QueryReader,
} from './query-cache'

/**
 * Observe shared data for this component's committed selection. Returns undefined
 * until the effect acquires the reader; changing selection immediately hides the
 * previous reader, and unmount releases its lease. No cache signals are created
 * during render or in an abandoned render.
 * @example
 * import { useQuery$ } from '@octane-xplat/ui/data'
 * // Inside a component: const user = useQuery$(client, users, userId)
 * // If user is undefined, show loading. Otherwise read user.data$.get()
 * // under a pending/error boundary.
 */
export function useQuery$<A extends QueryKeyPart, T>(
	client: QueryClient,
	definition: QueryDefinition<A, T>,
	selection: A,
): QueryReader<T> | undefined {
	const identity = canonicalQueryKey(selection)
	const [observation, setObservation] = useState<
		| {
				client: QueryClient
				definition: QueryDefinition<A, T>
				identity: string
				reader: QueryReader<T>
		  }
		| undefined
	>(undefined)
	useEffect(() => {
		const reader = client.observe$(definition, selection)
		setObservation({ client, definition, identity, reader })
		return () => reader.dispose()
	}, [client, definition, identity])
	return observation?.client === client &&
		observation.definition === definition &&
		observation.identity === identity
		? observation.reader
		: undefined
}
