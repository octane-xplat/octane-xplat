/** @jsxImportSource @octane-xplat/jsx */
import 'octane/signals'
import { useQuery$ } from '../src/data/use-query'
import type { QueryClient, QueryDefinition } from '../src/data/query-cache'
import type { CursorQueryDefinition } from '../src/data/cursor-query'

export function InstanceProfile(props: {
	id: string
	client: QueryClient
	definition: QueryDefinition<string, string>
}) @{
	const reader = useQuery$(props.client, props.definition, props.id)
	const state = reader?.state$.get()
	const value = state?.hasData ? reader!.data$.get() : 'none'

	<label
		text={`${props.id}:${state?.status ?? 'pending'}:${value}:${state?.fetchStatus ?? 'idle'}`}
	/>
}

export function TwoProfiles(props: {
	client: QueryClient
	definition: QueryDefinition<string, string>
}) @{
	const a = useQuery$(props.client, props.definition, 'a')
	const b = useQuery$(props.client, props.definition, 'b')

	<label
		text={`${a?.state$.get().hasData ? a.data$.get() : 'none'}:${b?.state$.get().hasData ? b.data$.get() : 'none'}`}
	/>
}

export function SuspenseProfile(props: {
	client: QueryClient
	definition: QueryDefinition<string, string>
}) @{
	const reader = useQuery$(props.client, props.definition, 'same')

	@if (!reader) {
		<label text="mounting" />
	} @else {
		@try {
			<label text={reader.data$.get()} />
		} @pending {
			<label text="loading" />
		} @catch (error) {
			<label text="retired" />
		}
	}
}

export function CursorFeed(props: {
	client: QueryClient
	definition: CursorQueryDefinition<string, number, number>
}) @{
	const reader = useQuery$(props.client, props.definition, 'all')
	const state = reader?.state$.get()
	const data = state?.hasData ? reader!.data$.get() : undefined

	<label text={data ? data.pages.flatMap((page) => page.items).join(',') : 'loading'} />
}
