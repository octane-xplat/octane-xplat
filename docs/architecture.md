# How an xplat app fits together

> Keep product code shared, and put platform-specific work at the edges.

## The three layers

An app normally has these layers:

```text
screens and features
        ↓
shared UI components and services
        ↓
web or native platform leaves
```

Your screens should talk to `@octane-xplat/ui` and
`@octane-xplat/platform`. They should not talk directly to a DOM element or a
NativeScript view.

## Shared code and platform code

Keep a component shared when the user experience is the same on every target.
Split it when the platform needs a different implementation:

```text
ShareButton.tsrx          shared behavior and props
ShareButton.web.tsrx      browser implementation
ShareButton.native.tsrx   iOS and Android implementation
```

The filename tells the build which implementation to use. The screen that
imports `ShareButton` does not need an `if (ios)` branch.

## What belongs in a screen

Screens own product decisions: what to show, what to save, and where to go
next. They can use shared state, UI components, and platform service
interfaces.

They should not contain:

- DOM globals such as `window` or `document`.
- Native view names such as `gridlayout` or `page`.
- Two copies of the same platform decision.

If a screen needs one of those things, put the platform detail behind a shared
component or service instead.

## Shared state

Keep shared state in a `.ts` module using Octane signals
(`octane/signals`):

```ts
import { signal$, query$, skip } from 'octane/signals';

export const feedMode$ = signal$<'global' | 'following'>('global');
export const feed$ = query$(
	() => feedMode$.get(),          // cache key — return `skip` for "no request"
	() => api.posts.list({ mode: feedMode$.get() }),
);
```

A component that reads `feedMode$.get()` in render subscribes automatically —
on web *and* on native. There is no platform leaf, no subscription hook, and
no compiler flag. Name shared signals with a `$` suffix so the compiler
preserves the reads through caches and props, and make sure the module imports
`octane/signals` at runtime (a `import 'octane/signals'` side-effect import in
the entry is enough to cover files that only call `.get()`).

Reads of async queries suspend: render them under `@try`/`@pending`/`@catch`.
On native, a committed `@try` boundary must not suspend again — queries are
stale-while-revalidate, so only suspend before first data.

Two exceptions:

- **Non-signal module state** (plain stores, mutable objects) does not
  subscribe on native. Wrap those reads in `useStore(store)` per reading
  component — the universal renderer retains unchanged-prop children, so a
  bare read in a child goes stale. (Decision #27.)
- **Reads outside render** (module init, event handlers) never subscribe —
  same as web. Write with `.set()` and read imperatively there.

For the compiler boundaries, file rules, and the full layer map, see the
[architecture notes](architecture-notes.md).
