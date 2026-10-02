# Architecture notes

> **Filename update (2026-09-28):** current suffix and fallback rules are in [module resolution](module-resolution.md). This planning record retains some earlier `.native` examples.

> Detailed architecture record for contributors: renderer mechanics, seam
> enforcement, package layout, and unresolved boundaries.

## The one-sentence model

**One source tree, compiled once per target.** A shared `.tsrx` component is
compiled by the DOM renderer in the web build and by the NativeScript renderer
in the native build — the same relationship React source has to react-dom and
react-native. We never ship one compiled artifact to both.

## Why this works at all

Octane ships `octane/universal/native`: a host-neutral runtime whose compiler
emits a static `universalPlan` + slot table per component, applied at runtime as
`create`/`update`/`insert`/`move`/`remove`/`destroy`/`event`/`visibility`
commands by a host driver. `@nativescript-community/octane` implements that
driver over `@nativescript/core` views. The renderer problem is solved; what
remains is an app-level architecture problem: vocabulary, styling, navigation,
services.

Upstream machinery we rely on:

- **Renderer registry + ordered rules + `boundaries`** — first-match globs own
  files; `boundaries` declare cross-renderer prop regions (renderer islands).
  We stay two-build; the mechanism exists if ever needed.
- **`renderers.*.validation`** — compile-time enforcement of
  `forbiddenGlobals`/`forbiddenImports`/`textHosts`/`textParents`/`hostProps`
  on owned files _and_ on `.ts` helpers matched by a rule (validated, not
  compiled). First enforcement layer — see [testing](testing.md).
- **No SSR on universal targets** (`server: 'unsupported'` by contract) — SSR
  is DOM-build output; shared files get DOM semantics on web and universal on
  native, each correct for its build.

## The layering

```
app screens / features          (shared .tsrx — no platform intrinsics)
        │
┌───────┴────────────────────────────────────────┐
│ primitives   (View Text Pressable List Modal…) │   ← packages/ui
│   leaf files split .web.tsrx / .native.tsrx    │
├────────────────────────────────────────────────┤
│ platform     (Platform, storage, haptics, nav) │   ← packages/platform
│   interfaces + per-target impl via resolver    │
├────────────────────────────────────────────────┤
│ renderer intrinsics                            │
│   web: <div> <span> …   native: <gridlayout>   │
│   <label> <frame> <page> …                     │
└────────────────────────────────────────────────┘
```

The hard boundary is the middle of this stack: **shared code may only reference
components and platform interfaces — never renderer intrinsics, never DOM
globals.** Leaf files (the `.web`/`.native` impls) are where each vocabulary is
spoken natively.

## Normalization classes (how a shared component gets classified)

The class table lives in [architecture](architecture.md#normalization-classes)
— it is part of the reader-facing parity contract. This section holds the
authoring side: how a candidate component earns a class.

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
mode prop. The shared `refreshing`/`onRefresh` on `ScrollableArea` (self-drawn
indicator) and a future `UIRefreshControl`/`SwipeRefreshLayout` in the
subpaths coexist; the shared `BottomSheet` snap points are self-drawn precisely
because the OS sheets are modal presentations, so an OS detent sheet would
be a separate subpath widget, not a flag on `BottomSheet`.

## Shared wrappers and component contracts

These rules are for framework contributors adding a shared component.
The [app architecture guide](architecture.md) introduces the same boundaries
for people building apps.

A shared wrapper may omit a platform-specific enhancement when passing its
children through is still useful and the omission is predictable. Check:

- **Frequency:** a common pattern used throughout an app is a stronger reason
  to share than a rare, one-off wrapper. Frequency is a factor, not a cutoff.
- **Children:** wrapping caller-provided JSX can remove platform branches from
  shared screens. Having children alone is not enough.
- **Residual value:** after the enhancement is absent, the wrapper must still
  provide useful structure or layout. If its main purpose disappears, keep it
  platform-specific.
- **Predictability:** developers should expect the omitted enhancement on that
  target, and the pass-through should preserve the wrapper's shared contract,
  including children and applicable layout or styling props.

For example, a keyboard-avoidance wrapper can remain useful as a shared layout
boundary on a target without a software keyboard. A `WebView` cannot pass
through meaningfully when its web content surface is unavailable. Document a
pass-through as intentional behavior; do not silently drop shared props.

Use these checks when shaping a new primitive:

1. Define the common task and its smallest useful props, events, and state
   before choosing a host widget. Commonness is a reason to look for an
   intersection, not permission to promise behavior some targets lack.
2. Separate that baseline from richer platform capabilities. A shared API
   must not silently ignore a prop or substitute a different gesture or
   presentation on one target. Keep platform extensions available under
   explicit subpaths.
3. Put unavoidable translation in platform leaves. Keep platform conditionals
   and native names out of shared component logic; make the import path or
   file suffix show where a developer crosses the boundary.
4. Size the escape hatch to the divergence: a small platform detail can use
   an explicit prop bag, implementation differences belong in separate
   leaves, and a genuinely different widget belongs in a platform subpath.
   Avoid inert shared props and whole-file forks for a one-prop difference.
5. Give silent-failure cases a mechanical guard, such as a lint rule, named
   error, or structural check.
6. Verify the claim on each target. For visuals, compare bounds and selected
   resolved styles in a controlled stage; for behavior, assert the same
   events and state transitions. Record whether evidence is source-read or
   device-verified.

Lists show why the shared contract and host widget must be considered
separately. A small, unvirtualized list is a common shared job: `ScrollableArea`
plus `items.map(...)` gives it ordered rows and ordinary scrolling. The shared
`VirtualList` adds bounded vertical windowing and measured-height anchoring;
off-window rows unmount rather than recycle. Native cell recycling remains in
`UITableView` and `RecyclerView` under the platform subpaths. A shared API
must name the behavior it actually provides and must not imply native cell
reuse.

## Invariants (the rules that keep the seams from tearing)

> [!IMPORTANT]
> Violations fail _silently_ — a second runtime binds, a DOM API reaches
> native, a text node vanishes. Treat every rule as load-bearing.

1. **A file speaks one element vocabulary.** Renderer ownership is per-file via
   the compiler's include glob. `<div>` and `<gridlayout>` can never appear in
   the same file — the split must happen at file boundaries (`.web.tsrx` /
   `.native.tsrx`), resolved by [module resolution](module-resolution.md).
2. **Hook-calling code must live in renderer-owned files.** A hook imported
   from a plain `.ts` binds a second runtime whose dispatcher is never active.
   Rule: files containing hook calls use `.tsx`/`.tsrx` and match the include
   glob; `.ts` is for hook-free logic only.
3. **One copy of `octane` per app.** Hooks bind to the runtime that owns the
   root. Enforce via package-manager dedupe/resolutions.
4. **No DOM globals in shared code** — no `document`, `window`, `localStorage`,
   `getComputedStyle`, DOM events. Anything platform reaches for goes through
   `packages/platform`. (NS does have `fetch`, `WebSocket`, `crypto`, `btoa`,
   `matchMedia`.)
   **Enforced**: the native app extends `nativeScriptRenderer` with a
   `validation.forbiddenGlobals`/`forbiddenImports` list — a `document`
   reference in a `.tsrx` fails the transform with file+line
   (`renderer "nativescript" forbids unbound global`). **Gap**: validation
   runs only in the compile pipeline, so plain `.ts` helpers under a rule
   are unchecked — the typecheck layer (no DOM lib in the native tsconfig)
   is the backstop for those. Upstream asks filed:
   [nativescript-community/octane#2](https://github.com/nativescript-community/octane/issues/2)
   (ship default validation) and
   [octanejs/octane#1254](https://github.com/octanejs/octane/issues/1254)
   (stale `useRef` reads in pre-commit event closures).
5. **No web-only Octane features in shared code.** SSR/streaming/`<Hydrate>`/
   `<Suspense>`/`<ErrorBoundary>` components/`<style>` blocks/portals are
   DOM-build features. Shared components restrict themselves to the universal
   subset — the universal export surface is the verified allowlist; portable
   async boundaries are `@try`/`@pending`/`@catch`.
6. **Static styles are CSS; dynamic values are style objects.** Shared styling
   is `className` + tokens → shared stylesheet compiled per-target
   ([styling](styling.md)). Object `style` lowers to `view.style` / DOM style.
7. **Non-signal shared-state reads subscribe via `useStore`.** The universal
   renderer retains unchanged-prop children when a parent re-renders — a bare
   module-scope read in a child stays stale on native while web re-invokes
   it. Octane `signal$`/`query$` `.get()` reads are exempt — the universal
   signal-read machinery subscribes the reading owner directly (validated on
   iOS). Everything else calls `useStore(store)` (or `useStore(store,
select)`); changed context still propagates.

## Repo layout (provisional)

```
apps/
  web/            vite config + entry (createRoot), index.html, web assets
  native/         nativescript.config.ts, App_Resources, vite config + entry
packages/
  ui/             primitives (leaf-split files), styled(), theme tokens
  platform/       Platform, capabilities (storage, haptics, share, …)
  navigation/     route-table types, Link, shared screen contracts
  hooks/          hook-containing shared modules (.tsrx — owned by renderers)
  core/           hook-free logic, types, utils (.ts is fine here)
```

Single-package `src/` + two vite configs is also viable for a small app; the
monorepo shape earns its cost once >1 app or a clean publish boundary exists.

Two tsconfigs (`tsconfig.web.json` / `tsconfig.native.json`) extend a base;
they differ in `jsxImportSource` and which leaf files are in scope. Details in
[module-resolution](module-resolution.md).

## Entry points

- Web: `createRoot(document.getElementById('root')!)` — `main.web.ts`.
- Native: `Application.run({ create: () => page })` +
  `renderNativeScriptApp(page, App)`, plus `setWindowContentResolver` for
  secondary windows — `main.native.ts`. See the
  [upstream repo](https://github.com/nativescript-community/octane).

## Where the seams are (index)

| Seam                                       | Doc                                         |
| ------------------------------------------ | ------------------------------------------- |
| File vocabulary split, resolver, tsconfig  | [module-resolution](module-resolution.md)   |
| Element/component abstraction              | [primitives](primitives.md)                 |
| Shared styling language                    | [styling](styling.md)                       |
| Animation + gesture normalization          | [animation-gestures](animation-gestures.md) |
| URL routing vs Frame/Page, modals-as-roots | [navigation](navigation.md)                 |
| Storage, lifecycle, a11y, icons, safe area | [platform-services](platform-services.md)   |
| Build/HMR/CI/version pinning               | [toolchain](toolchain.md)                   |
| How we verify each target                  | [testing](testing.md)                       |
| Unresolved seams                           | [open-questions](open-questions.md)         |
