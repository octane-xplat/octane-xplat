# Fetching data

> Load the records your app needs and give users clear loading, empty, and
> error states.

Ask your agent for a complete flow: “Load the saved trips, show progress while
waiting, and let me retry a failed request.” Keep the request tied to the
screen or shared state that owns it; the patterns below explain that choice.

`query$` from `octane/signals` is the default for remote data. It is the
same reactive engine that backs `signal$` shared state, with shared APIs
for web and native, and a module-level query needs no provider — so it is
reachable from every root, including modals, sheets, and list cells, where
context cannot cross.

## The shape

A query is a selector plus a loader:

```ts
import { query$, signal$, skip } from 'octane/signals'

export const feedMode$ = signal$<'global' | 'following'>('global')

export const feed$ = query$(
	() => feedMode$.get(), // selection — re-runs reactively
	(mode, { signal }) => api.posts.list({ mode, signal }),
)
```

- **The selector is reactive.** It re-runs when the signals it reads
  change; a new selection refetches. Return `skip` for "no request right
  now" — a missing id, a logged-out session. The selection is compared by
  encoded value, not identity — a fresh object literal with the same
  contents is the same request (keep field order stable; encoding is
  positional).
- **The loader** receives the selection and a `QueryContext`
  (`signal: AbortSignal` for cancellation, `previous` for the last
  delivered value). It may return a value, a promise, or an
  `AsyncIterable` — pass `{ kind: 'stream' }` in the options for streams.
- **Reads are stale-while-revalidate.** A selection change keeps the
  previous data visible while the new request runs.

For a typed HTTP layer behind the loader, see Rouzer in the companion
libraries section of `AGENTS.md`.

## Reading in a screen

| Call                  | Effect                                                              |
| --------------------- | ------------------------------------------------------------------- |
| `feed$.get()`         | Suspends until first data — use under `@try`/`@pending`/`@catch`      |
| `feed$.latest()`      | Non-suspending read; `undefined` before data (`latest(fallback)` too) |
| `feed$.snapshot()`    | `{ status: 'idle' \| 'pending' \| 'ready' \| 'error' }` plus `refreshing`, `connection`, `complete` |
| `feed$.refetch()`     | Reload with the current selection                                   |
| `feed$.retry()`       | Retry after an error (`retry({ pending: true })` re-pends)          |
| `feed$.reset()`       | Return to pending and reload                                        |

A suspending read belongs under a boundary:

```tsrx
@try {
	const posts = feed$.get()
	<Feed posts={posts} />
} @pending {
	<ActivityIndicator />
} @catch (e) {
	<Text>Could not load the feed.</Text>
}
```

On native, a committed `@try` boundary must not suspend again. Queries are
stale-while-revalidate, so only the first read suspends — a later selection
change keeps rendering previous data inside the same boundary instead of
re-pending. Use `.snapshot()`/`latest()` when the UI should show a spinner
on refetch rather than suspend at all (`snapshot().refreshing` covers the
background-reload case).

## Writes

The common path is imperative: run the mutation, then `refetch()` the
queries it touched. For optimistic updates, `optimistic$(source$)` wraps a
signal in a writable projection, and `action$` wraps a handler so writes
inside it are confirmed on success and rolled back on rejection —
`isActionUncertain` covers transports that can't tell whether the request
landed. See the octane signals docs for the full action semantics.

## Module scope vs screen scope

Where a `query$` is declared decides who shares its selection:

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
export function Profile(props: { id: string }) @{
	const profile$ = query$(
		() => props.id,
		(id) => api.user.get({ id }),
	)
	@try {
		const user = profile$.get()
		...
	} @pending { <Spinner /> }
}
```

The anti-pattern this replaces: copying route params into a shared selector
signal during render (`openUserId$.set(props.id)` at the top of a screen).
On native, pushing a second profile page rewrites the selection the page
underneath is reading — the covered page silently re-keys to the pushed
page's params. On web it depends on render order. Reads in render, never
writes.

Two honest costs of screen-owned queries: they don't dedupe across
instances (two screens showing the same user fetch twice — there is no
global keyed cache), and a mutation can't refetch "the" profile query from
outside — refetch from the owning screen or fan out invalidation yourself.

## Rules that bite on native

- **Name signals with a `$` suffix** (`feed$`, `user$`). The compiler uses
  the suffix to preserve reactive reads through caches and props.
- **Every module that touches a signal needs a runtime import** of
  `octane/signals` (or `octane/signals/client`). A
  `import 'octane/signals'` side-effect line in the app entry covers
  modules that only call `.get()`.
- **Reads outside render never subscribe** — module init, event handlers.
  Write with `.set()`; read imperatively there.
- **Non-signal module state doesn't subscribe on native.** Plain stores
  and mutable objects need `useStore(store)` per reading component —
  the universal renderer retains unchanged-prop children, so bare reads go
  stale while web keeps working (decision #27). Prefer `signal$`.
- **Route `loader` exports are prefetch-only** (decision #30), not a data
  layer. The screen's `query$` stays the single source of truth.

## TanStack Query as an opt-in

[`@octanejs/tanstack-query`](https://github.com/octanejs/octane/tree/main/packages/tanstack-query)
binds the full `@tanstack/react-query` surface to octane hooks on top of
`@tanstack/query-core`. It is a supported opt-in for apps that want its
cache machinery — infinite queries, the mutation cache, familiar
invalidation patterns — but it is not the default: `query$` needs no
provider, no shims, and its stale-while-revalidate semantics already match
the native `@try` contract.

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
