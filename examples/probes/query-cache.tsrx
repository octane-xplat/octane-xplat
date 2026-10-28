/** @jsxImportSource @octane-xplat/jsx */
import 'octane/signals'
import { View, Text, Pressable } from '@octane-xplat/ui'
import {
	createQueryClient,
	defineQuery,
	defineCursorQuery,
	createMemoryQueryStorage,
	createStore,
	useStore,
	useQuery$,
} from '@octane-xplat/ui/data'

import { inspectQueryClient } from '@octane-xplat/ui/data/dev'
import { environment } from '../../packages/platform/src/environment'
import type { ProbeContext } from '../../scripts/probe/context'

function deferred<T>() {
	let resolve!: (value: T) => void
	let reject!: (error: unknown) => void
	const promise = new Promise<T>((yes, no) => {
		resolve = yes
		reject = no
	})

	return { promise, resolve, reject }
}

type RecordValue = { value: number; revision: number }
const initial = deferred<RecordValue>()
const queries = createQueryClient()
let loads = 0
let transport: AbortSignal | undefined
const record = defineQuery(
	['qualification-record'],
	(_id: string, { signal }) => {
		loads++
		transport = signal
		return initial.promise
	},
	{
		staleTimeMs: Infinity,
		compareAuthority: (incoming: RecordValue, current: RecordValue) =>
			incoming.revision - current.revision,
	},
)

const firstVisible = createStore(true)

function Reader(props: { id: string }) @{
	const reader = useQuery$(queries, record, 'shared')

	@if (!reader) {
		<Text id={props.id}>opening</Text>
	} @else {
		@try {
			<Text id={props.id}>{String(reader.data$.get().value)}</Text>
		} @pending {
			<Text id={props.id}>pending</Text>
		} @catch (error) {
			<Text id={props.id}>retired</Text>
		}
	}
}

export default function QueryCacheProbe() @{
	const show = useStore(firstVisible)

	<View>
		@if (show) {
			<Reader id="query-first" />
		}
		<Reader id="query-second" />
		<Pressable id="query-toggle" onPress={() => firstVisible.update((value) => !value)}>
			<Text>Toggle first reader</Text>
		</Pressable>
	</View>
}

/** Maintained text assertions. Handler dispatch establishes state, not OS input. */
export async function run(ctx: ProbeContext) {
	ctx.onCleanup(() => queries.dispose())
	ctx.record('environment', environment.getSnapshot())
	const inspector = inspectQueryClient(queries, {
		eventLimit: 16,
		labels: [{ definition: record, label: 'record' }],
	})

	ctx.onCleanup(() => inspector.dispose())
	await ctx.waitFor(() => loads === 1)
	ctx.assert('two rendered readers share one request', loads, 1)
	await ctx.waitFor(() => inspector.snapshot().queries[0]?.observers === 2)
	await ctx.press('query-toggle')
	await ctx.waitFor(() => inspector.snapshot().queries[0]?.observers === 1)
	ctx.assert('retiring one reader preserves transport', transport?.aborted, false)
	initial.resolve({ value: 1, revision: 1 })
	await ctx.waitFor(() => ctx.inspect('query-second').text === '1')
	await ctx.press('query-toggle')
	await ctx.waitFor(() => ctx.inspect('query-first').text === '1')
	ctx.assert('remount reuses fresh confirmed data', loads, 1)

	const oldReceipt = deferred<RecordValue>()
	const newReceipt = deferred<RecordValue>()
	const older = queries.runOptimistic(record, 'shared', async (operation, view$) => {
		operation.set(view$, (value) => ({ ...value, value: value.value + 1 }))
		operation.adopt(await oldReceipt.promise)
	})

	const newer = queries.runOptimistic(record, 'shared', async (operation, view$) => {
		operation.set(view$, (value) => ({ ...value, value: value.value + 10 }))
		operation.adopt(await newReceipt.promise)
	})

	await ctx.waitFor(
		() => ctx.inspect('query-first').text === '12' && ctx.inspect('query-second').text === '12',
	)

	ctx.assert(
		'tentative overlays do not replace confirmed data',
		queries.getQueryData(record, 'shared')?.value,
		1,
	)

	newReceipt.resolve({ value: 12, revision: 3 })
	await newer
	oldReceipt.resolve({ value: 2, revision: 2 })
	await older
	await ctx.waitFor(() => ctx.inspect('query-second').text === '12')
	ctx.assert(
		'older save cannot replace newer authority',
		queries.getQueryData(record, 'shared')?.revision,
		3,
	)

	const rejected = deferred<void>()
	const rollback = queries
		.runOptimistic(record, 'shared', async (operation, view$) => {
			operation.set(view$, (value) => ({ ...value, value: value.value + 100 }))
			await rejected.promise
		})
		.catch(() => 'rejected')

	await ctx.waitFor(() => ctx.inspect('query-second').text === '112')
	rejected.reject(new Error('Controlled rejection'))
	ctx.assert('failed edit settles explicitly', await rollback, 'rejected')
	await ctx.waitFor(
		() => ctx.inspect('query-first').text === '12' && ctx.inspect('query-second').text === '12',
	)

	ctx.assert(
		'failed edit removes its own overlay',
		queries.getQueryData(record, 'shared')?.value,
		12,
	)

	const storage = createMemoryQueryStorage()
	let pagesLoaded = 0
	const feed = defineCursorQuery(
		['qualification-feed'],
		async (_filter: string, { cursor }) => {
			pagesLoaded++
			return { items: [cursor], nextCursor: cursor < 1 ? cursor + 1 : undefined }
		},
		{ initialCursor: 0, maxPages: 2, staleTimeMs: Infinity, persist: { storage, version: 1 } },
	)

	const first = createQueryClient({ namespace: 'qualification-a' })
	ctx.onCleanup(() => first.dispose())
	await first.prefetch(feed, 'all')
	await Promise.all([first.fetchNextPage(feed, 'all'), first.fetchNextPage(feed, 'all')])
	ctx.assert('page callers share one append', pagesLoaded, 2)
	ctx.assert(
		'pages retain ordered parameters',
		JSON.stringify(first.getQueryData(feed, 'all')?.pageParams),
		'[0,1]',
	)

	await first.dispose()
	const restored = createQueryClient({ namespace: 'qualification-a' })
	ctx.onCleanup(() => restored.dispose())
	const restoredPages = await restored.ensureData(feed, 'all')
	ctx.assert('new client restores coherent page window', restoredPages.pages.length, 2)
	ctx.assert('fresh restore needs no transport', pagesLoaded, 2)
	const isolated = createQueryClient({ namespace: 'qualification-b' })
	ctx.onCleanup(() => isolated.dispose())
	ctx.assert(
		'new account does not inherit cached pages',
		isolated.getQueryData(feed, 'all') === undefined,
		true,
	)

	ctx.assert(
		'another account starts at its own first page',
		(await isolated.ensureData(feed, 'all')).pages.length,
		1,
	)

	const saveGate = deferred<RecordValue>()
	let saveSignal: AbortSignal | undefined
	const authority = defineQuery(['qualification-account'], (_id: string) => ({
		value: 1,
		revision: 1,
	}))

	await first.dispose()
	const retired = createQueryClient()
	ctx.onCleanup(() => retired.dispose())
	await retired.ensureData(authority, 'same-id')
	const late = retired
		.runOptimistic(authority, 'same-id', async (operation, view$, { signal }) => {
			saveSignal = signal
			operation.set(view$, { value: 99, revision: 1 })
			operation.adopt(await saveGate.promise)
		})
		.catch(() => 'cancelled')

	await retired.dispose()
	ctx.assert('account disposal aborts outstanding writes', saveSignal?.aborted, true)
	ctx.assert('account write rejects promptly', await late, 'cancelled')
	saveGate.resolve({ value: 99, revision: 2 })
	const active = createQueryClient()
	ctx.onCleanup(() => active.dispose())
	ctx.assert(
		'late receipt cannot populate replacement account',
		(await active.ensureData(authority, 'same-id')).value,
		1,
	)

	const transient = createQueryClient()
	ctx.onCleanup(() => transient.dispose())
	const history = inspectQueryClient(transient, { eventLimit: 16 })
	ctx.onCleanup(() => history.dispose())
	const shortLived = defineQuery(['qualification-retention'], (id: number) => id, {
		gcTimeMs: 1,
		networkMode: 'always',
	})

	const observed = transient.observe$(shortLived, -1)
	await Promise.all(Array.from({ length: 1000 }, (_, id) => transient.ensureData(shortLived, id)))
	await ctx.waitFor(() => history.snapshot().queries.length === 1)
	ctx.assert('long session collects 1000 inactive entries', history.snapshot().queries.length, 1)
	ctx.assert('diagnostic history stays bounded', history.snapshot().events.length, 16)
	observed.dispose()
	await ctx.waitFor(() => history.snapshot().queries.length === 0)
	ctx.assert('last reader release permits collection', history.snapshot().queries.length, 0)
	ctx.assert('fresh observed data needs no extra reads during the workflow', loads, 1)
	ctx.record('query-inspection', inspector.snapshot())
}
