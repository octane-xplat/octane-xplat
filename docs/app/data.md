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
it so the screen shows the updated record — or `invalidateQueries` when the
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
belongs in [testing notes](../notes/testing-notes.md#data-lifecycle-regressions).
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

`cachedQuery$` from `@octane-xplat/ui` is `query$` plus a shared, app-wide
result cache. You write the same selector and loader, and add a required
**family key** — a stable name for the kind of data, such as `'user'` — that
gives the query a cross-screen identity. Two screens that resolve the same
key and selection share the request and its record, so the second screen
shows the cached value immediately instead of fetching again.

```ts
// src/queries.ts
import { cachedQuery$ } from '@octane-xplat/ui'
import { api } from './api'

export const user$ = cachedQuery$(
	['user'],
	() => openUserId$.get(),
	(id, { signal }) => api.user.get({ id, signal }),
)
```

The full cache key is the family key plus the selector's current selection,
so `['user']` with selection `'42'` is a different entry than `'43'` — each
screen instance keeps its own selection, the same ownership rules as
`query$`, while the results live in one shared store. Key parts must be
JSON-serializable values (strings, numbers, booleans, null, arrays, plain
objects); object field order does not matter.

```ts
import { cachedQuery$ } from '@octane-xplat/ui'
import { api } from './api'

// ['user', { id: '42', mode: 'full' }] and the same parts in another order
// resolve to the same cache entry.
export const userDetail$ = cachedQuery$(
	['user'],
	() => ({ id: openUserId$.get(), mode: 'full' }),
	(selection, { signal }) => api.user.get({ id: selection.id, signal }),
)
```

Everything from `query$` still applies — `.get()` suspends,
`.latest()`/`.snapshot()` read state, `@try`/`@pending`/`@catch` render the
same states, `.refetch()`/`.retry()`/`.reset()` force a fresh request. A new
reader of a stale entry sees the cached value right away while a background
request refreshes it; `snapshot().refreshing` is `true` during that
refresh. `staleTime` widens the window where a fresh entry is served without
any request at all.

```ts
// src/queries.ts — serve the cached record for up to a minute before
// revalidating on mount.
export const user$ = cachedQuery$(
	['user'],
	() => openUserId$.get(),
	(id, { signal }) => api.user.get({ id, signal }),
	{ staleTime: 60_000 },
)
```

`invalidateQueries` marks entries stale and refetches every screen that
currently owns them — a whole family, or one exact key. Callers keep showing
their previous data while the new request runs, so a pull-to-refresh or a
save never blanks the screen.

```ts
import { invalidateQueries } from '@octane-xplat/ui'

// Refetch every 'user' selection on every live screen.
invalidateQueries(['user'])
// Refetch only user '42'.
invalidateQueries(['user', '42'], { exact: true })
```

`clearQueryCache` drops entries — and their persisted records, when the
query opts into persistence — without refetching. Mounted screens keep
their current data; the next reader repopulates. Reach for it on sign-out
or a schema bump, not for ordinary refreshes.

```ts
import { clearQueryCache } from '@octane-xplat/ui'

export function signOut() {
	clearQueryCache() // everything
	// or one family: clearQueryCache(['user'])
}
```

### Mutations against the cache

There is no `mutation$`. A mutation stays an ordinary async function:
await the write, then invalidate the keys it affects. That is the whole
contract — the query layer owns reads, your code owns writes.

```ts
import { invalidateQueries } from '@octane-xplat/ui'

export async function renameUser(id: string, name: string) {
	const response = await fetch(`/api/users/${encodeURIComponent(id)}`, {
		method: 'PATCH',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ name }),
	})
	if (!response.ok) throw new Error('Could not save the user')
	invalidateQueries(['user', id], { exact: true })
}
```

Optimistic updates keep working the way they do for plain `query$`: wrap the
query with `optimistic$` and confirm through `action$`, then invalidate on
success so the cache also refreshes.

```ts
import { action$, optimistic$ } from 'octane/signals'
import { invalidateQueries } from '@octane-xplat/ui'
import { user$ } from './queries'

const userView$ = optimistic$(user$)
const rename$ = action$(async (operation, name: string) => {
	operation.set(userView$, { ...userView$.latest()!, name })
	await api.user.rename({ name })
	operation.adopt(name)
	invalidateQueries(['user'])
})
```

### Persisting records

`persist` opts a query into durable snapshots — records that survive an app
restart. It's per-query and off by default. The envelope stored under each
key is `{ v, t, d }`: your compatibility **version**, the save **t**ime, and
the **d**ata. `maxAge` expires old records, and `scope` names the boundary
the records belong to — typically the signed-in account — evaluated on each
read and write. Return `null` from `scope` to keep the query memory-only for
that boundary, and clear the cache before the boundary changes.

```ts
// src/queries.ts
import { cachedQuery$, platformQueryStorage } from '@octane-xplat/ui'
import { api } from './api'

export const user$ = cachedQuery$(
	['user'],
	() => openUserId$.get(),
	(id, { signal }) => api.user.get({ id, signal }),
	{
		staleTime: 60_000,
		persist: {
			storage: platformQueryStorage,
			version: 'user-v1', // bump when the record shape changes
			maxAge: 24 * 60 * 60 * 1000,
			scope: () => currentAccountId(), // your auth layer answers this
		},
	},
)
```

`platformQueryStorage` is the built-in adapter — `localStorage` on web,
NativeScript `ApplicationSettings` on iOS/Android — fine for bounded JSON
snapshots. Any object with `get`/`set`/`remove` works as a
`QueryStorageAdapter`, so a web app can swap in an idb-keyval-style async
store and a native app can use a file-backed or secure store:

```ts
import type { QueryStorageAdapter } from '@octane-xplat/ui'
import { get, set, del } from 'idb-keyval' // example; install it yourself

const idb: QueryStorageAdapter = {
	get: (key) => get(key),
	set: (key, value) => set(key, value),
	remove: (key) => del(key),
}
```

Persistence restores only completed data — never pending or error state —
and writes are best-effort: a failing or full store is ignored rather than
breaking queries. Persisted values must JSON-serialize cleanly, so keep
records to plain data and small payloads.

Two boundaries worth knowing before you adopt it:

- **One boundary per session.** The in-memory cache is not partitioned by
  `scope`; the app contract is `clearQueryCache()` on sign-out _before_ the
  boundary changes, then let the new boundary repopulate.
- **Same family, same scope, shared cell.** Two `cachedQuery$` calls that
  resolve the same family in one scope share a query cell — the first
  selector and loader bound there wins. Pass `options.key` to keep them
  distinct, and keep different data in different families.

```ts
import { cachedQuery$ } from '@octane-xplat/ui'
import { api } from './api'

// A distinct cell in the same scope, same family.
export const userPinned$ = cachedQuery$(
	['user'],
	() => pinnedUserId$.get(),
	(id, { signal }) => api.user.get({ id, signal }),
	{ key: 'pinned' },
)
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
need `useStore(store)` per reading component: the universal renderer retains
unchanged-prop children, so bare reads go stale (decision #27). Prefer `signal$`
when possible.

```tsx
import { createStore, useStore, Text } from '@octane-xplat/ui'

const store = createStore({ name: 'Alex' })
export function StoredName() {
	const value = useStore(store)
	return <Text>{value.name}</Text>
}
```

**Route `loader` exports run on navigation** and deliver `data` or `error`
props; they do not provide a reactive query cache or suspense boundary.
Keep remote state in a screen-owned `query$` when it must react to inputs
or support refresh; see [route loaders](navigation.md#present-a-route-modally).

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
import { QueryClient, useQuery } from '@octanejs/tanstack-query'
import { Text } from '@octane-xplat/ui'

const client = new QueryClient()
export function Greeting() {
	const query = useQuery(
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

Also prefer a module-level `QueryClient` over `QueryClientProvider` —
context does not cross native modal/overlay/list-cell roots.
`useSuspenseQuery` under `universalTry` is unverified on native.

```tsx
import { QueryClient, useQuery } from '@octanejs/tanstack-query'
import { Text } from '@octane-xplat/ui'

const client = new QueryClient()
export function Greeting() {
	const query = useQuery(
		{ queryKey: ['greeting'], queryFn: () => Promise.resolve('Hello') },
		client,
	)
	return <Text>{query.data ?? 'Loading'}</Text>
}
```
