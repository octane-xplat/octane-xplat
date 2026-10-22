# Fetching data

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
component does not itself invalidate the selector in Octane 0.6.3. For an
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

## The shared query cache

Use a shared cache when two screens need the same server record. Define the
loader once, create a client for your app or signed-in account, then observe
that definition in each screen. Equal selections share data and an in-flight
request. Two selections in the same screen stay independent.

```ts
// src/queries.ts
import { createQueryClient, defineQuery } from '@octane-xplat/ui/data'

export interface User { id: string; name: string }
export const queries = createQueryClient()
export const users = defineQuery(['users'], async (id: string, { signal }) => {
	const response = await fetch(`/api/users/${encodeURIComponent(id)}`, { signal })
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
rendering and reuse the same object. Another definition using that family in
one client throws instead of silently taking the first loader. Keys and
selections contain JSON values; object field order does not affect identity.

```ts
// Add to src/queries.ts; each selection identifies one search result.
export const searches = defineQuery(['users', 'search'], async (
	selection: { text: string; limit: number }, { signal },
) => {
	const params = new URLSearchParams({ q: selection.text, limit: String(selection.limit) })
	const response = await fetch(`/api/users?${params}`, { signal })
	if (!response.ok) throw new Error('Could not search users')
	return response.json() as Promise<User[]>
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
	const response = await fetch(`/api/headlines?topic=${encodeURIComponent(topic)}`, { signal })
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

After a save, invalidate the affected family or exact family-plus-selection
key. Observed entries refresh; unobserved entries wait for their next reader.
An invalidation arriving during a request schedules a follow-up before that
request settles. This cache does not yet expose optimistic actions; use the
[plain signal write workflow](#writes) for owner-local optimistic work.

```ts
import { queries } from './queries'

export async function renameUser(id: string, name: string) {
	const response = await fetch(`/api/users/${encodeURIComponent(id)}`, {
		method: 'PATCH',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ name }),
	})
	if (!response.ok) throw new Error('Could not save user')
	queries.invalidateQueries({ key: ['users', id], exact: true })
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
	const response = await fetch(`/api/users/${encodeURIComponent(id)}`, { signal })
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
Keep remote state in a screen-owned `query$` when it must react to inputs
or support refresh; see [route loaders](navigation.md#handle-pending-work-and-failures).

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

This is an optional integration for apps that need TanStack's data cache.
You can skip it when `query$` covers your requests — and for shared keys,
cross-screen invalidation, and persisted records without a second data
library, [the shared query cache](#the-shared-query-cache) above is the
built-in path. The native setup below has been checked in source code but
has not been verified on a device.

[`@octanejs/tanstack-query`](https://github.com/octanejs/octane/tree/main/packages/tanstack-query)
binds the full `@tanstack/react-query` surface to octane hooks on top of
`@tanstack/query-core`. It is a supported opt-in for apps that want its
cache machinery — infinite queries, the mutation cache, familiar
invalidation patterns — but it is not the default: `query$` needs no
provider and keeps previous data during background reloads.

```tsx
import { QueryClient, useQuery$ } from '@octanejs/tanstack-query'
import { Text } from '@octane-xplat/ui'

const client = new QueryClient()
export function Greeting() {
	const query = useQuery$(
		{ queryKey: ['greeting'], queryFn: () => Promise.resolve('Hello') },
		client,
	)
	return <Text>{query.data ?? 'Loading'}</Text>
}
```

On native it needs shims in the app entry (desk-source; not yet verified on
device):

```ts
// entry shim for native
import AbortController from '@nativescript/core/abortcontroller'
import AbortSignal from '@nativescript/core/abortcontroller/abortsignal'
import { environmentManager } from '@tanstack/query-core'

globalThis.AbortController = AbortController
globalThis.AbortSignal = AbortSignal
environmentManager.setIsServer(() => false)
```

- `AbortController` ships in `@nativescript/core` but the global install is
  commented out in 9.1.2 — `Query.fetch` constructs one unconditionally.
- `isServer` detection is `typeof window === 'undefined'`, so native is
  treated as SSR: no refetch timers, `retry` defaults to 0.
- `focusManager`/`onlineManager` are inert without `window`; wire them via
  `setEventListener` to NativeScript application/connectivity events if you
  want refetch-on-focus or refetch-on-reconnect.

Prefer a module-level `QueryClient` over `QueryClientProvider` when query
consumers may mount in independent native roots such as routed Pages, list
cells, or imperative modal/sheet services. UI-owned native portals, the iOS
and Android platform sheet/context-menu leaves, AppKitSheet, and the iOS
ShaderEffect carry their declaring Octane context, so provider-based setup
works across those boundaries.
`useSuspenseQuery` under `universalTry` is unverified on native.

```tsx
import { QueryClient, useQuery$ } from '@octanejs/tanstack-query'
import { Text } from '@octane-xplat/ui'

const client = new QueryClient()
export function Greeting() {
	const query = useQuery$(
		{ queryKey: ['greeting'], queryFn: () => Promise.resolve('Hello') },
		client,
	)
	return <Text>{query.data ?? 'Loading'}</Text>
}
```

## Try a small demo

[Try the packing list demo](../demos/packing-list.md) with bundled local content.
