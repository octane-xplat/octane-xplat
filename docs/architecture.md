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

The rule for the shared surface is stricter than "feels similar": a shared
component must deliver the same pixels for the same props on every target,
with no platform-specific props. `@octane-xplat/ui` therefore owns its
rendering (`Switch`, `Slider`, `ActivityIndicator`, `Tabs`, `Drawer` are
self-drawn) or wraps an unavoidable platform control behind a native chrome
reset (`TextInput`, `TextArea`). Real OS widgets — UISwitch, RecyclerView,
modals, Liquid Glass — live in `@octane-xplat/ui/ios`,
`@octane-xplat/ui/android`, and `@octane-xplat/ui/web` under their official
names; those subpaths resolve only on their platform, so reaching for them
is always a conscious platform choice.

### Normalization classes

Every shared component carries one of four classes. The class says what the
parity claim covers — divergence inside a claim is a bug, divergence outside
it is the design:

| Class                | Interior                | Chrome          | Parity claim                          | Examples                                                  |
| -------------------- | ----------------------- | --------------- | ------------------------------------- | --------------------------------------------------------- |
| `self-drawn`         | us                      | all ours        | every pixel                           | `Switch`, `Tabs`, `SegmentedControl`                      |
| `chrome-reset`       | the OS widget's behavior | stripped        | every pixel                           | `TextInput`, `TextArea`, `SearchInput`                    |
| `hosted`             | an OS/engine surface    | ours, or none   | the frame + whatever chrome we draw   | `Video`, `CameraView` (chrome ours); `WebView` (none)     |
| `platform-authentic` | the OS                  | the OS          | none — OS chrome is the point         | `UISwitch`, `MaterialDialog`, the subpath catalogs        |

Classify a new component with an ordered test — first match wins:

1. Can we draw it identically ourselves? → `self-drawn` (preferred — no OS
   surface to fight).
2. Is the value a behavior the OS owns, with chrome we can strip? →
   `chrome-reset`. Text editing, scrolling, and image decode qualify; a
   picker wheel does not — stripping its chrome destroys the widget.
3. Is it an OS-rendered surface we can host in a normalized frame? →
   `hosted`. If we draw controls over it (`Video`'s transport), parity
   covers them; if the interior is someone else's content (`WebView`), the
   claim stops at frame + props + events — engine pixels are `different`
   by design.
4. Is the OS chrome itself the value — date-picker wheel, map tiles,
   system menus? → `platform-authentic`: subpath or don't ship.

An idiom may ship in two classes at once — as two components, never as a
mode prop. The shared `refreshing`/`onRefresh` on `ScrollView` (self-drawn
indicator) and a future `UIRefreshControl`/`SwipeRefreshLayout` in the
subpaths coexist; the shared `Sheet` detents are self-drawn precisely
because the OS sheets are modal presentations, so an OS detent sheet would
be a separate subpath widget, not a flag on `Sheet`.

Split a component when the platform needs a different implementation:

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
import { signal$, query$, skip } from 'octane/signals'

export const feedMode$ = signal$<'global' | 'following'>('global')
export const feed$ = query$(
	() => feedMode$.get(), // cache key — return `skip` for "no request"
	() => api.posts.list({ mode: feedMode$.get() }),
)
```

A component that reads `feedMode$.get()` in render subscribes automatically —
on web _and_ on native. There is no platform leaf, no subscription hook, and
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
