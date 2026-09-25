---
name: xplat
description: Build and review code in an Octane xplat app — one TypeScript codebase targeting web (DOM) and iOS/Android (NativeScript). Use when writing components, styles, routes, platform leaves, or device-service calls, and when a feature works on one target but not another.
---

# Octane xplat app

Every `src/*.tsrx` file compiles twice: once to the DOM renderer, once to
NativeScript views. The common failure mode is **silent divergence** — code
that compiles and works on web but no-ops or crashes on native. The rules
below prevent that; `pnpm lint` enforces most of them.

## Non-negotiables

1. **One element vocabulary per file.** Shared code renders only
   `@octane-xplat/ui` components. Platform divergence lives in whole files
   — `Foo.web.tsrx`, `Foo.native.tsrx`, `Foo.ios.tsrx`, `Foo.android.tsrx` —
   chosen by the bundler when something imports `./Foo`. Never branch on
   platform inside JSX (`Platform.OS`, conditional imports, `typeof
   document` checks).
2. **No DOM globals in shared code.** `document`, `window`, `localStorage`,
   DOM events — all web-only. Device capabilities (clipboard, storage,
   permissions, connectivity, geolocation, …) come from
   `@octane-xplat/platform`.
3. **Styles:** `className` for anything static; `style` objects only for
   values that change while the app runs. Shared CSS must use the portable
   subset — the native build warns on declarations it drops
   (`position: fixed`, `margin: auto`, `box-shadow`, …).
4. **Hooks and JSX live in `.tsrx` (or `.tsx`).** Plain `.ts` is for
   non-component code and may not import `.tsrx`. Import `.tsrx` files with
   the explicit extension: `import { App } from './App.tsrx'`.
5. **State = `octane/signals`.** `signal$()` for module-level shared state,
   `useSignal$()` for component-local, `derived$()` for computed, `query$()`
   for async data. Name signal variables with a `$` suffix (`count$`,
   `user$`) — the compiler uses the suffix to preserve reactive reads on
   native. Every module that reads or writes signals needs a runtime
   `import 'octane/signals'` (or `octane/signals/client`).
6. **One `octane` per app.** Don't add a second renderer or duplicate the
   package — two copies break the reconciler without a helpful error.

## Compiler rules that surprise

- `.tsrx` files can't declare `async` top-level functions — the compiler
  treats them as async components and the native build fails.
- Literal `@{` in JSX text parses as a code block. Write `{'@'}{expr}` to
  render a literal `@`.
- Effect dependencies are inferred from closure reads. An effect that only
  writes (refs, DOM) and never reads its driving prop won't re-run —
  declare deps explicitly: `useLayoutEffect(fn, [props.x])`.
- Input handlers must be idempotent — `onInput`/`onChange` can dispatch
  more than once per user action on web.
- `.native.tsrx`/`.ios.tsrx`/`.android.tsrx` files containing JSX must
  start with `/** @jsxImportSource @nativescript-community/octane */` on
  line 1 — nothing may precede it.

## Verify

| Command | Catches |
| --- | --- |
| `pnpm lint` | vocabulary / DOM-global / style violations — its output is authoritative |
| `pnpm typecheck` | both web and native TS configs |
| `pnpm dev` | web behavior |
| `pnpm dev:ios` / `pnpm dev:android` | the platform where behavior actually differs |

## Read next (only when needed)

- `references/components.md` — the component vocabulary plus per-platform
  divergences and name traps.
- `references/styling.md` — tokens, the portable CSS subset, dark mode.
- `references/navigation.md` — route table, links, params, stacks.
- `references/platform.md` — device services and writing your own leaf.
- Current limits and platform boundaries:
  https://octane-xplat.goddardai.org/known-limits
- Full framework docs, one file:
  https://octane-xplat.goddardai.org/llms-full.txt (index:
  https://octane-xplat.goddardai.org/llms.txt). The `/notes/*` design
  record explains *why* a constraint exists — rarely needed for app work.
