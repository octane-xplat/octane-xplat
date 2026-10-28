# Fetching data

> Load server data once, share it between screens, and handle loading and failures.

Use the official shared query cache for server data that several screens read
or edit. Start with one definition and one app client, then add policies when
your app needs them. For a request owned by one screen or a live stream, see
[owner-local requests](#owner-local-requests-and-streams).

A **query** loads data; a **cache** keeps a result so another screen can reuse
it. Start with the shared query example below, or choose a narrower task:

| Task | Section |
| --- | --- |
| Recover a failed request | [Retry and error states](#recovering-failed-reads) |
| Save an edit across screens | [Shared optimistic edits](#shared-optimistic-edits) |
| Change accounts safely | [Account and request lifetimes](#account-and-request-lifetimes) |
| Load one screen or consume a stream | [Requests owned by one screen](#owner-local-requests-and-streams) |
| Try the cache without a backend | [Maintained shared workflow](#try-the-shared-workflow) |

## The shared query cache

Use a shared cache when two screens need the same server record. Define the
loader once, create a client for your app or signed-in account, then observe
that definition in each screen. Equal selections share data and an in-flight
request. Two selections in the same screen stay independent. Replace the example API
host below with your server. To try this without a server, open the maintained
[shared workflow](#try-the-shared-workflow).

```ts
// src/queries.ts
import { createQueryClient, defineQuery } from '@octane-xplat/ui/data'

export interface User { id: string; name: string }

export const queries = createQueryClient()

export const users = defineQuery(['users'], async (id: string, { signal }) => {
	const response = await fetch(`https://api.example.com/users/${encodeURIComponent(id)}`, { signal })
	if (!response.ok) throw new Error('Could not load user')

	return response.json() as Promise<User>
}, { staleTimeMs: 60_000 })
```

The screen supplies its own user ID. `useQuery$` releases that screen's reader
when its selection changes or the screen unmounts. It returns `undefined` until
that reader is acquired after rendering. Read `data$.get()` under a
pending/error boundary to show the first result; later refreshes keep the
record visible. Import `octane/signals` in modules that read signals during
render so native screens subscribe too.

```tsrx
// src/UserCard.tsrx
import 'octane/signals'
import { Text } from '@octane-xplat/ui'
import { useQuery$ } from '@octane-xplat/ui/data'
import { queries, users } from './queries'

export function UserCard(props: { userId: string }) @{
	const user = useQuery$(queries, users, props.userId)
	@if (!user) {
		<Text>Loading user…</Text>
	} @else {
		@try {
			<Text>{user.data$.get().name}</Text>
		} @pending {
			<Text>Loading user…</Text>
		} @catch (error) {
			<Text>{String(error)}</Text>
		}
	}
}
```

A definition owns the loader and options for its family. Declare it outside
rendering and reuse the same object. Another definition using a family that the client
already holds throws instead of silently taking the first loader. Keys and
selections contain JSON values; object field order does not affect identity.

```ts
// Add to src/queries.ts; each selection identifies one search result.
export const searches = defineQuery(['users', 'search'], async (
	selection: { text: string; limit: number }, { signal },
) => {
	const params = new URLSearchParams({ q: selection.text, limit: String(selection.limit) })
	const response = await fetch(`https://api.example.com/api/users?${params}`, { signal })
	if (!response.ok) throw new Error('Could not search users')

	return response.json() as Promise<User[]>
})
```

When a loader reads its last confirmed result, annotate its context with
`QueryLoadContext<User>` so TypeScript knows the type of `previous`.

```ts
import { defineQuery, type QueryLoadContext } from '@octane-xplat/ui/data'
import type { User } from './queries'

export const refreshedUsers = defineQuery(['refreshed-users'], async (
	id: string, { signal, previous }: QueryLoadContext<User>,
) => {
	const response = await fetch(`https://api.example.com/users/${encodeURIComponent(id)}`, { signal })
	if (response.status === 304 && previous) return previous
	if (!response.ok) throw new Error('Could not load user')

	return response.json() as Promise<User>
})
```

### Keeping inactive data

A query stays in memory while a reader uses it. After the last reader leaves,
`gcTimeMs` keeps settled data for five minutes by default; remounting before
that timer expires reuses the entry. `staleTimeMs` separately decides whether
to refresh it. The last reader leaving cancels any request, and a transport
that ignores cancellation cannot publish its late result.

```ts
import { defineQuery } from '@octane-xplat/ui/data'

export const headlines = defineQuery(['headlines'], async (topic: string, { signal }) => {
	const response = await fetch(`https://api.example.com/api/headlines?topic=${encodeURIComponent(topic)}`, { signal })
	if (!response.ok) throw new Error('Could not load headlines')

	return response.json() as Promise<string[]>
}, { staleTimeMs: 30_000, gcTimeMs: 300_000 })
```

Memory collection keeps durable records available for later restoration. A
namespaced storage index lets sign-out purge records collected from memory
and records saved by an earlier client lifetime. Explicit purge completion
still reports storage failures; collection does not keep a Node process alive.

```ts
import { createQueryClient } from '@octane-xplat/ui/data'

const accountQueries = createQueryClient({ namespace: 'account:42' })
// After using persistent definitions, sign-out can remove their namespace records:
await accountQueries.dispose({ purgePersisted: true })
```

### Recovering failed reads

Shared reads retry twice after the first attempt, waiting one second and then
two seconds. Longer retry sequences use exponential delays capped at 30 seconds.
Set `retryCount: 0` to report the first failure immediately, or choose a delay
in milliseconds. All readers share one retry sequence. Aborts, client disposal,
and final-reader cancellation never start another retry.

```ts
import { defineQuery } from '@octane-xplat/ui/data'

export const weather = defineQuery(['weather'], async (city: string, { signal }) => {
	const response = await fetch(`https://api.example.com/api/weather?city=${encodeURIComponent(city)}`, { signal })
	if (!response.ok) throw new Error('Could not load weather')

	return response.json() as Promise<{ temperature: number }>
}, { retryCount: 2, retryDelayMs: failureCount => Math.min(1000 * 2 ** (failureCount - 1), 30_000) })
```

Stale observed queries refresh when the app resumes or connectivity returns.
Fresh and unobserved entries do not refresh for those events. Polling is
optional; it pauses while the app is inactive or the network is offline and
resumes without replaying missed intervals. Set either lifecycle policy to
`false` to disable that trigger; paused work still resumes when it can run.

```ts
import { defineQuery } from '@octane-xplat/ui/data'

export const liveScores = defineQuery(['scores'], async (league: string, { signal }) => {
	const response = await fetch(`https://api.example.com/api/scores?league=${encodeURIComponent(league)}`, { signal })
	if (!response.ok) throw new Error('Could not load scores')

	return response.json() as Promise<number[]>
}, { refetchIntervalMs: 15_000, refetchOnResume: true, refetchOnReconnect: true })
```

Clients use the platform environment automatically and release its listeners
when their last lease ends. The browser adapter uses visibility/network events;
NativeScript, including experimental native Windows, uses app suspend/resume
and connectivity; AppKit uses its host activity and Network framework bridge.
Hosts without a capability report it explicitly. Other desktop hosts need a
custom environment for lifecycle refresh when their adapter lacks those events.

```ts
import { environment } from '@octane-xplat/platform/environment'

const capabilities = environment.getSnapshot().capabilities
console.log('Activity events available:', capabilities?.activity ?? false)
```

On Windows, the default client reads the WinRT connection level independently
of the adapter's transport label. Local or limited connectivity permits requests;
it does not guarantee that your server is reachable. Missing projection reports
unknown connectivity rather than pausing work as offline. Activity follows
NativeScript app suspension, which the Windows host derives from window
visibility, rather than individual window keyboard focus. Reconnect delivery and
query refresh in a Windows app still need runtime qualification.

```ts
import { createQueryClient } from '@octane-xplat/ui/data'

// Uses the target's platform environment without a browser or custom adapter.
const queries = createQueryClient({ namespace: 'travel' })
```

Custom hosts can provide connectivity through an environment. Known offline
work reports `fetchStatus: 'paused'`; missing connectivity information allows
work to run. Use `networkMode: 'always'` for a local database or another loader
that does not require the network. `failureCount` reports attempts that failed
in the current sequence, separately from whether the reader has usable data.

```ts
import { createQueryClient, defineQuery, type QueryEnvironment } from '@octane-xplat/ui/data'

export function queriesForHost(environment: QueryEnvironment) {
	return createQueryClient({ environment })
}

export const localNotes = defineQuery(['local-notes'], (folder: string) => [folder], {
	networkMode: 'always', retryCount: 0,
})
```

For APIs that classify failures, `shouldRetry` can narrow the allowed retries.
The count still caps the sequence. The cache does not guess HTTP status from
an arbitrary error; the loader gives your policy the information it needs.

```ts
import { defineQuery } from '@octane-xplat/ui/data'

class ApiReadError extends Error {
	retryable: boolean
	constructor(retryable: boolean) { super('Could not load record'); this.retryable = retryable }
}

export const records = defineQuery(['records'], async (id: string, { signal }) => {
	const response = await fetch(`https://api.example.com/api/records/${encodeURIComponent(id)}`, { signal })
	if (!response.ok) throw new ApiReadError(response.status >= 500)

	return response.json() as Promise<{ title: string }>
}, { shouldRetry: (_failureCount, error) => !(error instanceof ApiReadError) || error.retryable })
```

### Refresh and writes

`refetch()` returns the loaded value or rejects with the error. Overlapping
calls share one request. `state$.get()` reports `fetchStatus` separately from
`hasData`, so a refresh failure can show an error alongside the previous
record. Handle the promise when calling a verb from an event.

```ts
import type { QueryReader } from '@octane-xplat/ui/data'
import type { User } from './queries'

export async function refreshUser(reader: QueryReader<User>) {
	try {
		await reader.refetch()
	} catch {
		// Render reader.state$.get().error alongside the retained data.
	}
}
```

When a save returns the confirmed record, publish it with `setQueryData`.
Every reader sees that value immediately, and it becomes eligible for
persistence. A write starts a new freshness window and cancels an older fetch;
a late fetch or restore cannot overwrite it. A later explicit refetch can
reconcile with the server again.

```ts
import { queries, users, type User } from './queries'

export async function renameUser(id: string, name: string) {
	const response = await fetch(`https://api.example.com/api/users/${encodeURIComponent(id)}`, {
		method: 'PATCH',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ name }),
	})
	if (!response.ok) throw new Error('Could not save user')
	const saved = await response.json() as User
	queries.setQueryData(users, id, saved)
}
```

Use `getQueryData` for a confirmed snapshot outside rendering. For a bulk
response, `setQueriesData` updates only matching entries that already exist.
It does not create missing entries or guess relationships between list and
detail queries. Both operations infer their value types from the definition.

```ts
import { queries, users, type User } from './queries'

export function hasCachedUser(id: string) {
	return queries.getQueryData(users, id) !== undefined
}

export function publishExistingUsers(receipts: readonly User[]) {
	for (const saved of receipts) {
		queries.setQueriesData(users, () => saved, { key: ['users', saved.id], exact: true })
	}
}
```

If the server does not return enough data to publish a complete record,
invalidate the affected family or exact family-plus-selection key. Observed
entries refresh; unobserved entries wait for their next reader. An invalidation
during a request starts a follow-up before it settles. For immediate feedback while a save is pending, use the shared optimistic
action below.

```ts
import { queries } from './queries'

export function reloadUser(id: string) {
	queries.invalidateQueries({ key: ['users', id], exact: true })
}
```

### Shared optimistic edits

`runOptimistic` composes Octane's native action operations with one loaded
shared record. Its tentative view appears in every reader, while
`getQueryData` and persistence retain confirmed data. Give a definition a
`compareAuthority` function when the server supplies ordered revisions;
only a positive result accepts an incoming revision. Use that same definition
in both screens and save functions.

```ts
// src/editable-user-data.ts
import { createQueryClient, defineQuery } from '@octane-xplat/ui/data'

export interface EditableUser { id: string; name: string; revision: number }

export const userQueries = createQueryClient()

export const editableUsers = defineQuery(['editable-users'], async (id: string, { signal }) => {
	const response = await fetch(`https://api.example.com/users/${encodeURIComponent(id)}`, { signal })
	if (!response.ok) throw new Error('Could not load user')

	return response.json() as Promise<EditableUser>
}, { staleTimeMs: 60_000, compareAuthority: (incoming, current) => incoming.revision - current.revision })
```

Set an operation's tentative value, then adopt the confirmed server receipt.
A definitive failure removes only that operation's contribution. The operation
holds a cache lease even if its screen leaves. Older receipts cannot replace
newer confirmed authority when a comparator is configured; overlapping pending
operations retain Octane's own presentation rules. Writes are never retried
automatically.

```ts
import { userQueries, editableUsers, type EditableUser } from './editable-user-data'

export async function renameUser(
	id: string, name: string,
	save: (input: { id: string; name: string; operationId: string; signal: AbortSignal }) => Promise<EditableUser>,
) {
	await userQueries.ensureData(editableUsers, id)

	return userQueries.runOptimistic(editableUsers, id, async (operation, view$, { signal }) => {
		operation.set(view$, previous => ({ ...previous, name }))
		const confirmed = await save({ id, name, operationId: operation.id, signal })
		operation.adopt(confirmed)
	})
}
```

A transport can report that the server outcome is uncertain rather than
rejected. Native uncertainty remains explicit: use `isActionUncertain` and
your API's operation-status contract to reconcile it before retrying. Tentative
values are not durable writes. Disposing the client aborts the operation's
signal and prevents a late receipt from reaching that client; it cannot prove
that the server cancelled a write. Durable offline write replay is outside
this cache's contract.

```ts
import { isActionUncertain } from 'octane/signals'

export async function saveMessage(save: () => Promise<void>) {
	try { await save(); return 'Saved' }
	catch (error) {
		if (isActionUncertain(error)) return 'Awaiting server confirmation'
		throw error
	}
}
```

### Preparing the next screen

Use `ensureData` in navigation preparation when opening the screen needs the
record. It returns fresh data or rejects, sharing any request already needed
by a screen. Choose a freshness window so a screen mounting after preparation
reuses the result. The maintained [prepared-user route](../../packages/app/src/app/cached-user.tsrx)
uses the same definition in its loader and screen.

```ts
// packages/app/src/app/cached-user.tsrx — loader beside the maintained screen.
import { demoQueries, demoUsers } from '../shared-query-data'
import type { RouteLoaderArgs } from '../routes.gen.contracts'

export function loader({ search }: RouteLoaderArgs<'/cached-user'>) {
	return demoQueries.ensureData(demoUsers, search.id)
}
```

For an optional navigation hint, `prefetch` warms the entry and returns an
explicit success, error, or cancellation result. It does not reject on loader
failure. Pass a caller's abort signal when that navigation intent can end;
cancelling it leaves another reader's shared request running. Successful
operations release their temporary leases into normal inactive collection.

```ts
import { queries, users } from './queries'

export async function prepareUserHint(id: string, signal: AbortSignal) {
	const result = await queries.prefetch(users, id, { signal })
	if (result.status === 'error') return 'Could not prepare user'

	return result.status === 'cancelled' ? 'Preparation cancelled' : 'User ready'
}

export async function requireUser(id: string, signal: AbortSignal) {
	return queries.ensureData(users, id, { signal })
}
```

### Account and request lifetimes

Create a different client for each signed-in account or server request. There
is no default global client. Disposing the old client retires its signals and
aborts its work immediately, so an old screen cannot keep reading the old
account. Even a transport that ignores abort cannot repopulate that client.
A disposed client cannot be reused.

```ts
import { createQueryClient } from '@octane-xplat/ui/data'

export function createAccountQueries(accountId: string) {
	return createQueryClient({ namespace: accountId })
}

export async function signOut(oldQueries: ReturnType<typeof createAccountQueries>) {
	await oldQueries.dispose({ purgePersisted: true })
	// Your authentication layer can now replace the session and screen tree.
}
```

Outside a component, `observe$` gives an explicit reader. Release it when the
operation ends. `evictQueries` retires matching entries and their signals;
it keeps durable records unless `purgePersisted` is requested. Use client
disposal for sign-out rather than retaining a client with an old namespace.

```ts
import { queries, users } from './queries'

export async function readUserOnce(id: string) {
	const reader = queries.observe$(users, id)
	try { return await reader.refetch() }
	finally { reader.dispose() }
}

export function evictUser(id: string) {
	return queries.evictQueries({ key: ['users', id], exact: true })
}
```

### Persisting records

Persistence stores completed JSON data between app launches. Give the client
an immutable namespace and opt the definition into a storage adapter. The
version identifies the stored shape; `maxAgeMs` is its maximum age in
milliseconds. Persistent definitions fail explicitly on a client without a
namespace. Pending requests, errors, and tentative changes are not saved.

```ts
import { createQueryClient, defineQuery, platformQueryStorage } from '@octane-xplat/ui/data'
import type { User } from './queries'

export const accountQueries = createQueryClient({ namespace: 'account:42' })

export const persistentUsers = defineQuery(['users'], async (id: string, { signal }) => {
	const response = await fetch(`https://api.example.com/users/${encodeURIComponent(id)}`, { signal })
	if (!response.ok) throw new Error('Could not load user')

	return response.json() as Promise<User>
}, {
	staleTimeMs: 60_000,
	persist: { storage: platformQueryStorage, version: 'user-v1', maxAgeMs: 86_400_000 },
})
```

The platform adapter uses browser local storage, NativeScript application
settings on iOS/Android, and the AppKit preferences bridge on macOS. Use a
custom asynchronous adapter for larger records or a secure store for sensitive
data. Storage failures leave the in-memory query usable; an explicit durable
purge rejects if removal fails, so sign-out code can handle that outcome.

```ts
import type { QueryStorageAdapter } from '@octane-xplat/ui/data'

export function storageAdapter(store: {
	read(key: string): Promise<string | null>
	write(key: string, value: string): Promise<void>
	delete(key: string): Promise<void>
}): QueryStorageAdapter {
	return { get: key => store.read(key), set: (key, value) => store.write(key, value), remove: key => store.delete(key) }
}
```

On experimental AppKit, the default query adapter uses the native bridge only
when get, set and remove hooks are all available. Otherwise it keeps an
isolated session cache and does not copy that cache into a later native store.
Query restore and writes are best effort. Native read or removal failures
remain observable to explicit purge, including an incomplete or lost bridge.
Handle that outcome before reporting that saved account data was cleared:

```ts
// Continue the accountQueries example above; run during sign-out.
export async function clearSavedAccountQueries(): Promise<boolean> {
	try {
		await accountQueries.dispose({ purgePersisted: true })
		return true
	} catch {
		return false // The client is retired, but saved records may remain.
	}
}
```

AppKit restart persistence and native bridge behavior remain unqualified.

### Shared cursor feeds

Use `defineCursorQuery` when several screens need the same paged feed. A cursor
is the server's marker for where a page begins. One selection identifies the
feed/filter/sort combination; its shared record contains pages and their exact
parameters. `undefined` means a direction has ended; a `null` cursor is valid.

```ts
// src/feed.ts
import { defineCursorQuery, type CursorPage, type CursorPageContext } from '@octane-xplat/ui/data'

export interface FeedItem { id: string; title: string }

export async function loadFeed(tag: string, { cursor, signal }: CursorPageContext<string>): Promise<CursorPage<FeedItem, string>> {
	const params = new URLSearchParams({ tag, cursor })
	const response = await fetch(`https://api.example.com/api/feed?${params}`, { signal })
	if (!response.ok) throw new Error('Could not load feed')

	return response.json()
}

export const feed = defineCursorQuery(['feed'], loadFeed, { initialCursor: '', maxPages: 3, staleTimeMs: 30_000 })
```

Read it through the same hook and client as other shared queries. Next-page
calls share one request. A failed page leaves earlier rows visible and retrying
uses the same cursor. `fetchPreviousPage` prepends when `hasPreviousPage` is
true. Page loading and full refresh run in order; refresh follows fresh server
cursors from the first retained page and publishes the window together.

```tsrx
import 'octane/signals'
import { Text, Pressable } from '@octane-xplat/ui'
import { useQuery$ } from '@octane-xplat/ui/data'
import { queries } from './queries'
import { feed } from './feed'

export function Feed() @{
	const reader = useQuery$(queries, feed, 'news')
	@if (!reader) {
		<Text>Opening feed…</Text>
	} @else {
		@try {
			const data = reader.data$.get()
			<>
				@for (const item of data.pages.flatMap(page => page.items); key item.id) {
					<Text>{item.title}</Text>
				}
				@if (reader.state$.get().status === 'error') { <Text>Could not load more. Try again.</Text> }
				<Pressable disabled={!data.hasNextPage || reader.state$.get().fetchStatus !== 'idle'} onPress={() => {
					void queries.fetchNextPage(feed, 'news').catch(() => {})
				}}><Text>Load more</Text></Pressable>
			</>
		} @pending {
			<Text>Loading feed…</Text>
		} @catch (error) {
			<Pressable onPress={() => { void reader.refetch().catch(() => {}) }}><Text>Retry feed</Text></Pressable>
		}
	}
}
```

`maxPages` bounds the retained window, dropping the opposite end when a page
is added. Persistence saves that window and its parameters as one confirmed
record. Set a client namespace and an explicit record version as for any
persistent query; increment the version if the stored page shape changes.

```ts
import { createQueryClient, defineCursorQuery, platformQueryStorage } from '@octane-xplat/ui/data'
import { loadFeed } from './feed'

const savedQueries = createQueryClient({ namespace: 'public-feed' })
const savedFeed = defineCursorQuery(['feed'], loadFeed, {
	initialCursor: '', maxPages: 3,
	persist: { storage: platformQueryStorage, version: 'feed-window-v1', maxAgeMs: 86_400_000 },
})
await savedQueries.ensureData(savedFeed, 'news')
```

### Inspecting a development cache

When a screen keeps old data or waits for connectivity, inspect its cache
metadata. Enable this only in development. Supply static labels that are safe
to share; the inspector never derives labels from query keys or account names.
Snapshots include state, freshness and reader counts. The event history keeps
100 events by default (at most 1,000), without values or error messages.

```ts
// In the module that owns queries and the users definition:
if (import.meta.env.DEV) {
	const { inspectQueryClient, registerQueryInspection } =
		await import('@octane-xplat/ui/data/dev')
	const inspector = inspectQueryClient(queries, {
		labels: [{ definition: users, label: 'users.detail' }],
		eventLimit: 100,
	})
	const registration = registerQueryInspection(inspector)
	console.log(inspector.snapshot())
	import.meta.hot?.dispose(() => {
		registration.dispose()
		inspector.dispose()
	})
}
```

The registration uses the [development-action bridge](../testing/development-actions.md).
List actions in your bound app, then invoke its `queries.inspect.*` action with
the exact instance and revision from the listing. Read the completed job's
`snapshot` result as JSON text. Inspection acquires no reader lease and does
not fetch or change data. Remove the registration before disposing its inspector.

```sh
pnpm exec xplat actions list --json
# Replace these placeholders with the identities from that listing.
pnpm exec xplat actions invoke --action ACTION_ID --instance INSTANCE_ID --revision REVISION --input '{}' --request-key query-inspect-1 --json
pnpm exec xplat actions status JOB_ID --json
```

The bridge is qualified on web and one Android device. iOS transport remains
unqualified; AppKit macOS and Linux cannot connect through this bridge. Use a
local snapshot in those hosts; a declaration alone does not establish a live
connection. A missing app or instance is reported by action discovery instead
of choosing another running app.

```ts
// Local diagnostic output on a host without the development-action bridge:
console.log(inspector.snapshot())
```

## Owner-local requests and streams

> Load information from a server and show what's happening while you wait.

For example, a trips screen can show “Loading trips…” while waiting,
a list when the request succeeds, and a Retry button when it fails. If
you're using an agent, ask for all three outcomes together.

This guide assumes you have a server or another source to request data from.
Its examples use an app-specific `api` client: code that sends those requests.
Xplat does not supply that server or client. If you're building your first
app, start with [a list that stays in memory](../start/toolchain.md#build-and-check-your-first-flow),
then add server data when you need it.

```ts
// src/api.ts — replace the host and paths with your server.
export type Post = { id: string; title: string }

export type User = { id: string; name: string }

async function request<T>(path: string, signal?: AbortSignal): Promise<T> {
	const response = await fetch(`https://api.example.com${path}`, { signal })
	if (!response.ok) throw new Error(`Request failed: ${response.status}`)

	return response.json() as Promise<T>
}

export const api = {
	posts: {
		list: ({ mode, signal }: { mode: string; signal: AbortSignal }) =>
			request<Post[]>(`/api/posts?mode=${encodeURIComponent(mode)}`, signal),
	},
	user: {
		get: ({ id, signal }: { id: string; signal: AbortSignal }) =>
			request<User>(`/api/users/${encodeURIComponent(id)}`, signal),
	},
}
```

A **query** loads data and tracks whether the request is waiting, ready, or
failed. Use `query$` from `octane/signals` for this. A **signal** holds a
changing value that the UI can follow, such as which feed someone selected.
The `$` at the end of names matters to the compiler; keep it in your names.

```ts
// src/feed.ts
import { query$, signal$ } from 'octane/signals'
import { api } from './api'

export const feedMode$ = signal$<'global' | 'following'>('global')

export const feed$ = query$(
	() => feedMode$.get(),
	(mode, { signal }) => api.posts.list({ mode, signal }),
)
```

A query declared in a shared file can be used by several screens in the same
running app, including dialogs and sheets. A query declared inside a screen
belongs to that screen. [Query ownership](#module-scope-vs-screen-scope)
explains when to choose each.

```tsx
// In each reading component's .tsrx file:
import 'octane/signals'
import { Text } from '@octane-xplat/ui'
import { feed$ } from './feed'

export function FeedCount() {
	return <Text>{feed$.latest([]).length} posts</Text>
}
```

## The shape

A query has two functions:

- The **selector** chooses what to request, such as the “global” or “following” feed.
- The **loader** makes that request and returns the data.

This fragment uses `api.posts.list({ mode, signal })` from your app. Replace
it with your own request function. `Feed` and `api.user.get` in later
fragments are also supplied by your app; `Text`, `Pressable`, and `Spinner`
come from `@octane-xplat/ui`. These are building blocks, not a complete screen.

```ts
// src/feed.ts (same module as above)
import { query$, signal$ } from 'octane/signals'
import { api } from './api'

export const feedMode$ = signal$<'global' | 'following'>('global')

export const feed$ = query$(
	() => feedMode$.get(), // selection — re-runs reactively
	(mode, { signal }) => api.posts.list({ mode, signal }),
)
```

The selector follows the signals it reads. A changed selection starts a new
request; return `skip` when there is no request to make. Equivalent encoded
selections share work within an owner; keep object field order stable on this
version, whose encoding is positional.

```ts
import { query$, signal$, skip } from 'octane/signals'
import { api } from './api'

const userId$ = signal$<string | null>(null)
const user$ = query$(
	() => userId$.get() ?? skip,
	(id, { signal }) => api.user.get({ id, signal }),
)
```

The loader receives the selected value, an abort signal, and optional previous
data. Pass the signal to your request so changing selections can cancel work.
A loader can return a value or a promise; streaming loaders return an async
iterable and use `{ kind: 'stream' }`.

```ts
import { query$ } from 'octane/signals'
import { api } from './api'

const user$ = query$(
	() => '42',
	(id, { signal, previous }) => {
		console.log('Refreshing a previous result:', previous !== undefined)

		return api.user.get({ id, signal })
	},
)
const updates$ = query$(
	() => 'welcome',
	async function* (message) {
		yield message
	},
	{ kind: 'stream' },
)
```

Previous data stays visible during refresh. This is called
stale-while-revalidate: show the last result while requesting an updated one.

```tsx
import 'octane/signals'
import { Text } from '@octane-xplat/ui'
import { feed$ } from './feed'

export function RefreshStatus() {
	return (
		<Text>
			{feed$.latest([]).length} posts{feed$.snapshot().refreshing ? ' (refreshing)' : ''}
		</Text>
	)
}
```

## Reading in a screen

A read that **suspends** asks the screen to wait for data before showing that
part of the UI. `@try` contains the data-dependent content, `@pending` shows
while it waits, and `@catch` shows if the request fails. These are TSRX
blocks; use them inside a `.tsrx` component. See the table for other ways
to read a query without waiting.

```tsx
// src/Feed.tsrx
import { Text, View } from '@octane-xplat/ui'
import type { Post } from './api'

export function Feed(props: { posts: Post[] }) {
	return (
		<View>
			{props.posts.map((post) => (
				<Text>{post.title}</Text>
			))}
		</View>
	)
}
```

| Call               | Effect                                                                                              |
| ------------------ | --------------------------------------------------------------------------------------------------- |
| `feed$.get()`      | Suspends until first data — use under `@try`/`@pending`/`@catch`                                    |
| `feed$.latest()`   | Non-suspending read; `undefined` before data (`latest(fallback)` too)                               |
| `feed$.snapshot()` | `{ status: 'idle' \| 'pending' \| 'ready' \| 'error' }` plus `refreshing`, `connection`, `complete` |
| `feed$.refetch()`  | Reload with the current selection                                                                   |
| `feed$.retry()`    | Retry after an error (`retry({ pending: true })` re-pends)                                          |
| `feed$.reset()`    | Return to pending and reload; `latest()` still returns previous data                                |

A suspending read belongs under a boundary:

```tsrx
import 'octane/signals'
import { Text, Pressable, Spinner } from '@octane-xplat/ui'
import { feed$ } from './feed'
import { Feed } from './Feed'

export function FeedScreen() @{
@try {
	const posts = feed$.get()
	<Feed posts={posts} />
} @pending {
	<Spinner />
} @catch (e) {
	<Text>Could not load the feed.</Text>
}
}
```

Queries keep previous data during selection changes and `refetch()`, so those
operations do not re-pend a ready boundary. `reset()` and
`retry({ pending: true })` deliberately return to pending: `.get()` suspends,
while `.latest()` can still return the previous value. On the patched native
renderer, a re-suspending boundary retains and hides its committed body until
the request settles. Use `.snapshot()`/`.latest()` for an explicit loading
indicator that leaves the previous records visible; `snapshot().refreshing`
distinguishes a background refetch from pending.

```tsx
import 'octane/signals'
import { Pressable, Text, View } from '@octane-xplat/ui'
import { feed$ } from './feed'
import { Feed } from './Feed'

export function RefreshableFeed() {
	return (
		<View>
			<Feed posts={feed$.latest([])} />
			<Text>{feed$.snapshot().refreshing ? 'Refreshing' : feed$.snapshot().status}</Text>
			<Pressable onPress={() => feed$.refetch()}>
				<Text>Refresh</Text>
			</Pressable>
			<Pressable onPress={() => feed$.reset()}>
				<Text>Reset</Text>
			</Pressable>
			<Pressable onPress={() => feed$.retry({ pending: true })}>
				<Text>Retry</Text>
			</Pressable>
		</View>
	)
}
```

When a failed suspending read reaches `@catch`, retry the request and reset
the boundary together:

```tsrx
import 'octane/signals'
import { Text, Pressable, Spinner } from '@octane-xplat/ui'
import { feed$ } from './feed'
import { Feed } from './Feed'

export function RetryScreen() @{
@try {
	<Feed posts={feed$.get()} />
} @pending {
	<Spinner />
} @catch (error, resetBoundary) {
	<Pressable onPress={() => {
		feed$.retry({ pending: true })
		resetBoundary()
	}}><Text>Retry</Text></Pressable>
}
}
```

`Pressable`, `Text`, and `Spinner` come from `@octane-xplat/ui`;
`Feed` remains an app-owned component. Resetting the boundary alone does not
restart the failed request.

```tsx
// Inside the @catch(error, resetBoundary) arm shown above:
<Pressable
	onPress={() => {
		feed$.retry({ pending: true })
		resetBoundary()
	}}
>
	<Text>Retry</Text>
</Pressable>
```

## Writes

A **mutation** changes data on the server, such as saving a trip. Wait for
that request to succeed, then call `refetch()` on the query that displays
it so the screen shows the updated record — or the client’s `invalidateQueries` when the
data lives in the [shared query cache](#the-shared-query-cache).

```ts
import { feed$ } from './feed'

export async function savePost(id: string, title: string) {
	const response = await fetch(`/api/posts/${encodeURIComponent(id)}`, {
		method: 'PATCH',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ title }),
	})
	if (!response.ok) throw new Error('Could not save the post')
	feed$.refetch()
}
```

An **optimistic update** shows a proposed change before the server confirms
it. For this advanced pattern, `optimistic$(source$)` wraps a signal so it
can show tentative values, and `action$` confirms writes on success or
rolls them back on rejection. `isActionUncertain` handles cases where you
cannot tell whether a request reached the server. See
[Octane's signals reference](https://raw.githubusercontent.com/octanejs/octane/refs/heads/main/docs/signals.md)
for the full behavior before using this pattern.

```ts
import { signal$, optimistic$, action$, isActionUncertain } from 'octane/signals'

const savedTitle$ = signal$('Packing list')
const title$ = optimistic$(savedTitle$)
const saveTitle$ = action$(async (operation, title: string) => {
	operation.set(title$, title)
	const response = await fetch('/api/title', {
		method: 'PUT',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ title }),
	})
	if (!response.ok) {
		operation.reject()
		throw new Error('Save rejected')
	}
	operation.adopt(title) // this endpoint confirms the supplied title
})

export async function rename(title: string) {
	try {
		await saveTitle$(title)
	} catch (error) {
		if (isActionUncertain(error)) console.log('Check the server before retrying')
		else throw error
	}
}
```

To check this flow, use an endpoint you can delay and fail: the first request
should show pending, success should show records or an explicit empty state,
and failure should offer retry. Change the selection after success and check
that previous records stay visible while `snapshot().refreshing` is true.
After a successful mutation, await it before calling the owning query’s
`refetch()`; verify the changed record appears. These fragments describe the
composition, not a complete fetch-demo screen.

## Module scope vs screen scope

“Module scope” means code declared in a file, outside a component.
“Screen scope” means code inside that screen's component. This decides
whether two open screens share the same query selection:

- **Module level** (`export const feed$ = query$(...)`) gets document
  scope: one selection for the whole app. On native the module is shared by
  every root — every stacked page, modal, and sheet reads the same
  selection. Right for app-global data: the feed filter, the current user,
  the notifications list.
- **Inside a component** (`const profile$ = query$(...)` in the component
  body) gets instance scope: each mounted screen owns its selection and the
  request retires when the screen unmounts. Right for data keyed by route
  params — detail pages, profiles, follower lists — where several instances
  can be alive in the navigation stack at once:

```tsrx
import { query$ } from 'octane/signals'
import { Spinner, Text } from '@octane-xplat/ui'
import { api } from './api'

export function Profile(props: { id: string }) @{
	const profile$ = query$(
		() => props.id,
		(id, { signal }) => api.user.get({ id, signal }),
	)
	@try {
		const user = profile$.get()
		<Text>{user.name}</Text>
	} @pending { <Spinner /> }
}
```

Avoid this mistake: copying route params into a shared selector
signal during render (`openUserId$.set(props.id)` at the top of a screen).
On native, pushing a second profile page rewrites the selection the page
underneath is reading — the covered page silently re-keys to the pushed
page's params. On web it depends on render order. Reads in render, never
writes.

```tsx
import { query$ } from 'octane/signals'
import { Text } from '@octane-xplat/ui'
import { api } from './api'

export function ProfileName(props: { id: string }) {
	const profile$ = query$(
		() => props.id,
		(id, { signal }) => api.user.get({ id, signal }),
	)

	return <Text>{profile$.latest()?.name ?? 'Loading'}</Text>
}
```

Two limits of screen-owned `query$`: the results don't dedupe across
instances (two screens showing the same user fetch twice — each query cell
owns its request), and a mutation can't refetch "the" profile query from
outside — refetch from the owning screen, or use the shared cache below,
which exists to close both gaps.

```tsx
import { query$ } from 'octane/signals'
import { Pressable, Text } from '@octane-xplat/ui'
import { api } from './api'

export function RefreshProfile(props: { id: string }) {
	const profile$ = query$(
		() => props.id,
		(id, { signal }) => api.user.get({ id, signal }),
	)

	return (
		<Pressable onPress={() => profile$.refetch()}>
			<Text>Refresh this profile</Text>
		</Pressable>
	)
}
```

Read the screen-owned query in children or event handlers as needed: it stays
with the component that declared it, rather than starting another child-owned
request. Unmount retires that component's queries and signal subscriptions.
Pass the loader's `signal` to your transport so cancellation also stops its
work. Responses from an aborted selection are ignored even if the transport
does not honor cancellation. Module-level queries remain app-owned after an
individual reader unmounts.

```tsx
import { query$ } from 'octane/signals'
import { Text } from '@octane-xplat/ui'
import { api } from './api'

function Name(props: {
	profile$: ReturnType<typeof query$<string, { id: string; name: string }>>
}) {
	return <Text>{props.profile$.latest()?.name ?? 'Loading'}</Text>
}

export function ProfileWithChild(props: { id: string }) {
	const profile$ = query$(
		() => props.id,
		(id, { signal }) => api.user.get({ id, signal }),
	)

	return <Name profile$={profile$} />
}
```

A selector reacts to signals it reads. A plain route prop supplies the initial
selection in the example above; replacing that prop on an already-mounted
component does not itself invalidate the selector — it tracks signal reads,
not prop identity. For an
editable selection within a screen, use `useSignal$` from
`octane/signals/client`, read it in the selector, and update it from an event.
Mount a new route instance for new immutable route params. Do not copy props
into a shared signal during render to work around this limitation.

```tsx
import { query$ } from 'octane/signals'
import { useSignal$ } from 'octane/signals/client'
import { Pressable, Text } from '@octane-xplat/ui'
import { api } from './api'

export function EditableProfile(props: { id: string }) {
	const id$ = useSignal$(props.id)
	const profile$ = query$(
		() => id$.get(),
		(id, { signal }) => api.user.get({ id, signal }),
	)

	return (
		<>
			<Text>{profile$.latest()?.name ?? 'Loading'}</Text>
			<Pressable onPress={() => id$.set('42')}>
				<Text>Show user 42</Text>
			</Pressable>
		</>
	)
}
```

The maintained [data probe](../../packages/app/src/data-probe.tsrx) and
[trace](../../packages/app/src/data-trace.ts) exercise independent queries,
pending/error/retry/refetch/reset, cancellation, stale settlement, and
cross-root signals with a controlled transport. Per-target execution evidence
belongs in [testing notes](../../.agents/docs/notes/testing-notes.md#data-lifecycle-regressions).
`query$` does not automatically refetch or pause on app background/resume;
wire an app lifecycle event to the owning query's `refetch()` if needed.

```tsx
import { useEffect } from 'octane'
import 'octane/signals'
import { useAppState } from '@octane-xplat/platform'
import { feed$ } from './feed'

export function ResumeRefresh() {
	const state = useAppState()
	useEffect(() => {
		if (state === 'active') feed$.refetch()
	}, [state])

	return null
}
```

## Paged collections and tree moves

Use `useAsyncList` for a collection that loads pages. Sort, reload, and
pagination preserve selection for keys still present; a reload prunes keys it
removes. Subscribers receive complete replacements. A failed page keeps its
cursor and earlier rows, so another `loadMore()` retries it. Completion promises
resolve on errors; inspect `loadingState` and `error` for the result.

```tsx
import { Button, Text } from '@octane-xplat/ui'
import { useAsyncList } from '@octane-xplat/ui/data'

export function ItemPages() {
	const rows = useAsyncList<{ id: string; name: string }>({
		async load({ cursor, signal }) {
			const response = await fetch(
				`https://api.example.com/items?cursor=${encodeURIComponent(cursor ?? '')}`,
				{ signal },
			)
			if (!response.ok) throw new Error('Could not load items')

			return response.json() as Promise<{ items: { id: string; name: string }[]; cursor?: string }>
		},
	})

	return <>
		<Text>{rows.items.map((item) => item.name).join(', ')}</Text>
		<Button isDisabled={!rows.hasMore || rows.isLoading} clickAction={() => rows.loadMore()}>
			{rows.loadingState === 'error' ? 'Retry page' : 'Load more'}
		</Button>
	</>
}
```

`useTreeData().move` publishes the complete moved subtree in one update and
keeps its selection. Moving into the same node, one of its descendants, or a
missing parent leaves the tree unchanged. Use `null` as the root destination.

```tsx
import { Button } from '@octane-xplat/ui'
import { useTreeData } from '@octane-xplat/ui/data'

export function ArchiveDrafts() {
	const folders = useTreeData({
		initialItems: [{ id: 'archive' }, { id: 'drafts', children: [{ id: 'note' }] }],
	})

	return <Button clickAction={() => folders.move('drafts', 'archive', 0)}>Archive drafts</Button>
}
```

## Rules that bite on native

These rules prevent cases where a value changes but a phone screen does not
update. “Render” means the code that draws the UI, and “subscribe” means
following later changes to a value.

**Name signals with a `$` suffix** (`feed$`, `user$`). The compiler uses
this suffix to preserve reactive reads through caches and props.

```tsx
import { signal$ } from 'octane/signals'
import { Text } from '@octane-xplat/ui'

// src/UserName.tsrx
export const user$ = signal$('Alex')

export function UserName() {
	return <Text>{user$.get()}</Text>
}
```

**Every module that touches a signal needs a runtime import** of
`octane/signals` (or `octane/signals/client`). A side-effect import belongs
in a consuming module that otherwise only calls `.get()`.

```tsx
// A second module, consuming user$ from the preceding example.
import 'octane/signals'
import { user$ } from './UserName'
import { Text } from '@octane-xplat/ui'

export function Welcome() {
	return <Text>{user$.get()}</Text>
}
```

**Reads outside render never subscribe** — this includes module initialization
and event handlers. Write with `.set()` and read imperatively there.

```tsx
import { useSignal$ } from 'octane/signals/client'
import { Pressable, Text } from '@octane-xplat/ui'

export function Count() {
	const count$ = useSignal$(0)

	return (
		<Pressable onPress={() => count$.set(count$.get() + 1)}>
			<Text>{String(count$.get())}</Text>
		</Pressable>
	)
}
```

**Non-signal module state needs a subscription on native.** Plain stores
separate the reactive read from the one-time snapshot: `useStore(store)`
subscribes the reading component, while `store.getSnapshot()` reads the
current value once and never subscribes. The universal renderer retains
unchanged-prop children, so a bare snapshot read in a render goes stale on
native (decision #27). Write with `store.set(value)` or compute from the
previous value with `store.update((prev) => next)` — snapshots are readonly.
Prefer `signal$` when possible.

```tsx
import { Text } from '@octane-xplat/ui'
import { createStore, useStore } from '@octane-xplat/ui/data'

const store = createStore({ name: 'Alex' })

export function StoredName() {
	const value = useStore(store)

	return <Text>{value.name}</Text>
}
// Renames the store and re-renders every subscriber.
store.update((prev) => ({ ...prev, name: 'Sam' }))
// A one-time read that never subscribes — right for event handlers.
store.getSnapshot().name
```

`useStore` also takes a selector to subscribe to one slice of the value. The
reader re-renders only when the selection changes under `Object.is` — pick
fields rather than building objects, or pass a third `isEqual` argument to
compare computed selections.

```tsx
const name = useStore(store, (s) => s.name)
```

**Migrating from the old store API:** `store.get()` is now
`store.getSnapshot()`, and an updater function moves from
`store.set((prev) => next)` to `store.update((prev) => next)`.
`store.set(value)` still assigns a plain value.

**Route `loader` exports run on navigation** and deliver `data` or `error`
props; they do not provide a reactive query cache or suspense boundary.
Use `ensureData` to prepare shared records, then `useQuery$` in the screen;
a screen-owned `query$` fits independent requests. For loader behavior, see [route loaders](navigation.md#handle-pending-work-and-failures).

```tsx
import { Text } from '@octane-xplat/ui'

export async function loader() {
	return { title: 'Packing list' }
}

export default function PackingPage(props: { data?: { title: string }; error?: unknown }) {
	return <Text>{props.error ? 'Could not load the page' : (props.data?.title ?? 'Loading')}</Text>
}
```

## TanStack Query as an opt-in

Choose the official cache for the shared-data workflow above. An existing app
may reasonably keep TanStack to reuse its mutation cache, SSR hydration, or
established tooling. These APIs have related purposes; they are not drop-in
replacements, and their ownership and optimistic settlement rules differ.

| Need | Official Xplat path | Difference or remaining gap |
| --- | --- | --- |
| Shared keyed reads | `defineQuery`, `useQuery$` | Explicit app/account/request client; no provider needed |
| Cache writes and invalidation | `setQueryData`, `setQueriesData`, `invalidateQueries` | Application chooses which list/detail records to reconcile |
| Navigation preparation | `ensureData`, `prefetch` | Own cancellation lease, shared transport |
| Retention, retries, resume, reconnect, polling | Definition policies and platform environment | Host capabilities and actual runtime verification matter |
| [Infinite queries](https://tanstack.com/query/latest/docs/framework/react/guides/infinite-queries) | `defineCursorQuery`, page operations, `maxPages` | One serialized request; refresh follows the retained window's current cursors |
| Optimistic edits | `runOptimistic` with native Octane operations | No separate mutation cache; uncertain server outcomes remain explicit |
| Persisted reads | Definition `persist` and immutable client namespace | Confirmed JSON records only |
| [Paused mutation persistence/replay](https://tanstack.com/query/latest/docs/framework/react/guides/mutations) | Application-owned | No durable offline write queue or automatic replay |
| [SSR hydration](https://tanstack.com/query/latest/docs/framework/react/guides/ssr) | Request-isolated clients | No official dehydrate/hydrate transfer yet |
| [Visual devtools](https://tanstack.com/query/latest/docs/framework/react/devtools) | Metadata snapshots and CLI actions | No visual cache panel; React tooling is not automatically compatible with Octane/native hosts |

For example, the official API keeps the definition, selection and client
explicit. Imports from another cache will have different contracts.

```ts
import { createQueryClient, defineQuery } from '@octane-xplat/ui/data'

const client = createQueryClient()
const greeting = defineQuery(['greeting'], (_language: string) => 'Hello')
const value = await client.ensureData(greeting, 'en')
await client.dispose()
```

If you choose TanStack, use the
[Octane binding](https://github.com/octanejs/octane/tree/main/packages/tanstack-query)
matching your installed Octane version. Its current upstream entrypoint exposes
`useQuery` and core types. Use the names from your installed binding; they differ
from Xplat's `useQuery$`. Xplat has not qualified that binding's suspense, lifecycle,
or devtools behavior on devices. Follow its version-specific setup and verify
your target before depending on those integrations.

```ts
// Alternative dependency, installed explicitly by the app:
import { QueryClient } from '@octanejs/tanstack-query'

const client = new QueryClient()
// Use that version's Octane binding and host setup, rather than mixing clients.
```

## Try the shared workflow

The maintained harness has a public-data fixture at `/cached-users`, also
available from **Test → Shared query workflow**. It uses a small in-memory
server substitute, so no credentials or endpoint are needed. Open a user,
choose **Rename** or **Reject rename**, then go back to see confirmed list
updates. **Load more users** retains pages; opening a user prepares the same
record that the detail screen reads.

```ts
// packages/app/src/shared-query-data.ts owns this composition:
const session = demoSession.getSnapshot()
await session.queries.ensureData(session.feed, '')
await session.queries.ensureData(session.users, '1')
await session.saveUser('1', 'Ada renamed')
```

**Switch demo account** replaces and disposes the whole client. **Reopen this
account** replaces it with the same persistence namespace so eligible confirmed
records can restore. Awaiting disposal drains already-confirmed storage writes
before completing. For a remote loader, default platform lifecycle and
connectivity policies pause known-offline work and refresh stale observed data
on recovery. The fixture's local transport does not simulate a real network or
establish an OS lifecycle qualification result.

```ts
await replaceDemoSession('Grace') // New, isolated memory boundary.
await replaceDemoSession('Grace') // New client, same durable boundary.
```

Read the [session/transport](../../packages/app/src/shared-query-data.ts),
[feed route](../../packages/app/src/app/cached-users.tsrx), and
[detail route](../../packages/app/src/app/cached-user.tsrx) together. The server
substitute resets on process restart; durable cache records are a read cache,
not a replacement for a server database.

```ts
// A real app supplies its transport and keeps each account's auth immutable:
const session = createDemoSession('Ada')
await session.queries.dispose({ purgePersisted: true })
```

## Try a small demo

[Try the packing list demo](../demos/packing-list.md) with bundled local content.
