# Architecture

> The keystone doc. Everything else in `docs/` is a detail of what's stated here.
> Facts about the substrate are sourced in `prior-art/octane.md` and
> `prior-art/nativescript-octane.md` — this doc is about *our* shape.

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

Upstream machinery we now know exists (substrate pass, prior-art/octane.md):

- **Renderer registry + ordered rules + `boundaries`** — first-match globs own
  files; `boundaries` declare cross-renderer prop regions (renderer islands).
  We stay two-build; the mechanism exists if ever needed.
- **`renderers.*.validation`** — compile-time enforcement of
  `forbiddenGlobals`/`forbiddenImports`/`textHosts`/`textParents`/`hostProps`
  on owned files *and* on `.ts` helpers matched by a rule (validated, not
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

## Invariants (the rules that keep the seams from tearing)

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
   `matchMedia` — see `prior-art/nativescript-core.md`.)
5. **No web-only Octane features in shared code.** SSR/streaming/`<Hydrate>`/
   `<Suspense>`/`<ErrorBoundary>` components/`<style>` blocks/portals are
   DOM-build features. Shared components restrict themselves to the universal
   subset — the verified allowlist is in prior-art/octane.md ("universal
   export surface"); portable async boundaries are `@try`/`@pending`/`@catch`
   (decision #19).
6. **Static styles are CSS; dynamic values are style objects.** Shared styling
   is `className` + tokens → shared stylesheet compiled per-target
   ([styling](styling.md)). Object `style` lowers to `view.style` / DOM style.

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
  secondary windows — `main.native.ts`. See
  [prior-art/nativescript-octane.md](../prior-art/nativescript-octane.md).

## Where the seams are (index)

| Seam | Doc |
|---|---|
| File vocabulary split, resolver, tsconfig | [module-resolution](module-resolution.md) |
| Element/component abstraction | [primitives](primitives.md) |
| Shared styling language | [styling](styling.md) |
| Animation + gesture normalization | [animation-gestures](animation-gestures.md) |
| URL routing vs Frame/Page, modals-as-roots | [navigation](navigation.md) |
| Storage, lifecycle, a11y, icons, safe area | [platform-services](platform-services.md) |
| Build/HMR/CI/version pinning | [toolchain](toolchain.md) |
| How we verify each target | [testing](testing.md) |
| Unresolved seams | [open-questions](open-questions.md) |
