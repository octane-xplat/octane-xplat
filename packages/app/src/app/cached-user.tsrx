import 'octane/signals'
import { Screen, Text } from '@octane-xplat/ui'
import { useQuery$ } from '@octane-xplat/ui/data'
import { demoQueries, demoUsers } from '../shared-query-data'
import type { RouteLoaderArgs, RouteProps } from '../routes.gen.contracts'

export function validateSearch(raw: { id?: unknown }) {
	if (raw.id !== undefined && typeof raw.id !== 'string') {
		throw new TypeError('id must be a string')
	}

	return { id: raw.id ?? '42' }
}

/** Preparation warms the same definition and client used by the screen. */
export function loader({ search }: RouteLoaderArgs<'/cached-user'>) {
	return demoQueries.ensureData(demoUsers, search.id)
}

export function CachedUser(props: RouteProps<'/cached-user'>) @{
	const reader = useQuery$(demoQueries, demoUsers, props.search.id)

	<Screen className="vx-app gap-3">
		<Text className="text-2xl font-semibold">Prepared user</Text>
		@if (!reader) {
			<Text>Opening user…</Text>
		} @else {
			@try {
				<Text>{reader.data$.get().name}</Text>
			} @pending {
				<Text>Loading user…</Text>
			} @catch (error) {
				<Text>Could not load user</Text>
			}
		}
	</Screen>
}
