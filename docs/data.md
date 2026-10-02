# Fetching data

> Load information from a server and show what's happening while you wait.

For example, a trips screen can show “Loading trips…” while waiting,
a list when the request succeeds, and a Retry button when it fails. If
you're using an agent, ask for all three outcomes together.

This guide assumes you have a server or another source to request data from.
Its examples use an app-specific `api` client: code that sends those requests.
Xplat does not supply that server or client. If you're building your first
app, start with [a list that stays in memory](toolchain.md#build-and-check-your-first-flow),
then add server data when you need it.

A **query** loads data and tracks whether the request is waiting, ready, or
failed. Use `query$` from `octane/signals` for this. A **signal** holds a
changing value that the UI can follow, such as which feed someone selected.
The `$` at the end of names matters to the compiler; keep it in your names.

A query declared in a shared file can be used by several screens in the same
running app, including dialogs and sheets. A query declared inside a screen
belongs to that screen. [Query ownership](#module-scope-vs-screen-scope)
explains when to choose each.

## The shape

A query has two functions:

- The **selector** chooses what to request, such as the “global” or “following” feed.
- The **loader** makes that request and returns the data.

This fragment uses `api.posts.list({ mode, signal })` from your app. Replace
it with your own request function. `Feed` and `api.user.get` in later
fragments are also supplied by your app; `Text`, `Pressable`, and `Spinner`
come from `@octane-xplat/ui`. These are building blocks, not a complete screen.

```ts
import { query$, signal$, skip } from 'octane/signals'

export const feedMode$ = signal$<'global' | 'following'>('global')

export const feed$ = query$(
	() => feedMode$.get(), // selection — re-runs reactively
	(mode, { signal }) => api.posts.list({ mode, signal }),
)
```

- **The selector follows changes.** When a signal it reads changes, it
  runs again; a different selection starts a new request. Return `skip` for "no request right
  now" — a missing id, a logged-out session. The selection is compared by
  encoded value, not identity — a fresh object literal with the same
  contents is the same request (keep field order stable; encoding is
  positional).
- **The loader** receives the selection and a `QueryContext`
  (`signal: AbortSignal` for cancellation, `previous` for the last
  delivered value). It may return a value, a promise, or an
  `AsyncIterable` — pass `{ kind: 'stream' }` in the options for streams.
- **Previous data stays visible during refresh.** This is called
  stale-while-revalidate: the app shows the last result while requesting
  an updated one.

## Reading in a screen

A read that **suspends** asks the screen to wait for data before showing that
part of the UI. `@try` contains the data-dependent content, `@pending` shows
while it waits, and `@catch` shows if the request fails. These are TSRX
blocks; use them inside a `.tsrx` component. See the table for other ways
to read a query without waiting.

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
@try {
	const posts = feed$.get()
	<Feed posts={posts} />
} @pending {
	<Spinner />
} @catch (e) {
	<Text>Could not load the feed.</Text>
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

When a failed suspending read reaches `@catch`, retry the request and reset
the boundary together:

```tsrx
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
```

`Pressable`, `Text`, and `Spinner` come from `@octane-xplat/ui`;
`Feed` remains an app-owned component. Resetting the boundary alone does not
restart the failed request.

## Writes

A **mutation** changes data on the server, such as saving a trip. Wait for
that request to succeed, then call `refetch()` on the query that displays
it so the screen shows the updated record.

An **optimistic update** shows a proposed change before the server confirms
it. For this advanced pattern, `optimistic$(source$)` wraps a signal so it
can show tentative values, and `action$` confirms writes on success or
rolls them back on rejection. `isActionUncertain` handles cases where you
cannot tell whether a request reached the server. See
[Octane's signals reference](https://raw.githubusercontent.com/octanejs/octane/refs/heads/main/docs/signals.md)
for the full behavior before using this pattern.

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
export function Profile(props: { id: string }) @{
	const profile$ = query$(
		() => props.id,
		(id, { signal }) => api.user.get({ id, signal }),
	)
	@try {
		const user = profile$.get()
		...
	} @pending { <Spinner /> }
}
```

Avoid this mistake: copying route params into a shared selector
signal during render (`openUserId$.set(props.id)` at the top of a screen).
On native, pushing a second profile page rewrites the selection the page
underneath is reading — the covered page silently re-keys to the pushed
page's params. On web it depends on render order. Reads in render, never
writes.

Two limits of screen-owned queries: they don't dedupe across
instances (two screens showing the same user fetch twice — there is no
global keyed cache), and a mutation can't refetch "the" profile query from
outside — refetch from the owning screen or fan out invalidation yourself.

Read the screen-owned query in children or event handlers as needed: it stays
with the component that declared it, rather than starting another child-owned
request. Unmount retires that component's queries and signal subscriptions.
Pass the loader's `signal` to your transport so cancellation also stops its
work. Responses from an aborted selection are ignored even if the transport
does not honor cancellation. Module-level queries remain app-owned after an
individual reader unmounts.

A selector reacts to signals it reads. A plain route prop supplies the initial
selection in the example above; replacing that prop on an already-mounted
component does not itself invalidate the selector in Octane 0.6.3. For an
editable selection within a screen, use `useSignal$` from
`octane/signals/client`, read it in the selector, and update it from an event.
Mount a new route instance for new immutable route params. Do not copy props
into a shared signal during render to work around this limitation.

The maintained [data probe](../packages/app/src/data-probe.tsrx) and
[trace](../packages/app/src/data-trace.ts) exercise independent queries,
pending/error/retry/refetch/reset, cancellation, stale settlement, and
cross-root signals with a controlled transport. Per-target execution evidence
belongs in [testing notes](testing-notes.md#data-lifecycle-regressions).
`query$` does not automatically refetch or pause on app background/resume;
wire an app lifecycle event to the owning query's `refetch()` if needed.

## Rules that bite on native

These rules prevent cases where a value changes but a phone screen does not
update. “Render” means the code that draws the UI, and “subscribe” means
following later changes to a value.

- **Name signals with a `$` suffix** (`feed$`, `user$`). The compiler uses
  the suffix to preserve reactive reads through caches and props.
- **Every module that touches a signal needs a runtime import** of
  `octane/signals` (or `octane/signals/client`). A
  `import 'octane/signals'` side-effect line belongs in a consuming module
  that otherwise only calls `.get()`.
- **Reads outside render never subscribe** — module init, event handlers.
  Write with `.set()`; read imperatively there.
- **Non-signal module state doesn't subscribe on native.** Plain stores
  and mutable objects need `useStore(store)` per reading component —
  the universal renderer retains unchanged-prop children, so bare reads go
  stale while web keeps working (decision #27). Prefer `signal$`.
- **Route `loader` exports run on navigation** and deliver `data` or `error`
  props; they do not provide a reactive query cache or suspense boundary.
  Keep remote state in a screen-owned `query$` when it must react to inputs
  or support refresh; see [route loaders](navigation.md#present-a-route-modally).

## TanStack Query as an opt-in

This is an optional integration for apps that need TanStack's data cache.
You can skip it when `query$` covers your requests. The native setup below
has been checked in source code but has not been verified on a device.

[`@octanejs/tanstack-query`](https://github.com/octanejs/octane/tree/main/packages/tanstack-query)
binds the full `@tanstack/react-query` surface to octane hooks on top of
`@tanstack/query-core`. It is a supported opt-in for apps that want its
cache machinery — infinite queries, the mutation cache, familiar
invalidation patterns — but it is not the default: `query$` needs no
provider and keeps previous data during background reloads.

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
