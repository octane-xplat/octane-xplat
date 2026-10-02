---
name: xplat
description: Build and review code in an Octane Xplat app — one TypeScript codebase targeting web (DOM) and iOS/Android (NativeScript). Use when writing components, styles, routes, platform leaves, or device-service calls, and when a feature works on one target but not another.
---

# Octane Xplat app

Every `src/*.tsrx` file compiles twice: once to the DOM renderer, once to
NativeScript views. The common failure mode is **silent divergence** — code
that compiles and works on web but no-ops or crashes on native. The rules
below prevent that; `pnpm lint` enforces most of them.

## Non-negotiables

1. **One element vocabulary per file.** Shared code renders only
   `@octane-xplat/ui` components. Platform divergence lives in whole files
   — `.web` for browser code, `.mobile` for shared iOS/Android variants, OS-specific suffixes, and the unsuffixed native default —
   chosen by the bundler when something imports `./Foo`. Never branch on
   platform inside JSX (`Platform.OS`, conditional imports, `typeof
document` checks). Platform-authentic widgets live behind
   `@octane-xplat/ui/ios`, `/android`, and `/web` — importing a subpath
   outside a matching suffix file fails the other platform's build (the
   `xplat/platform-subpath-import` lint enforces it).
2. **No DOM globals in shared code.** `document`, `window`, `localStorage`,
   DOM events — all web-only. Device capabilities (clipboard, storage,
   permissions, connectivity) come from
   `@octane-xplat/platform`; plugin-backed features use their leaf packages.
3. **Styles:** `className` for anything static; `style` objects only for
   values that change while the app runs. Shared CSS must use the portable
   subset — the native build warns on declarations it drops
   (`position: fixed`, `margin: auto`, `box-shadow`, …).
4. **Hooks and JSX live in `.tsrx` (or `.tsx`).** Plain `.ts` is for
   non-component code and may not import `.tsrx`. Import `.tsrx` files with
   the explicit extension: `import { App } from './App.tsrx'`.
5. **Keep signal names suffixed with `$`.** Use `useSignal$` for state owned
   by a component. Runtime signal imports let the compiler track reads.

   ```tsrx
   import { useSignal$ } from 'octane/signals/client'
   import { Pressable, Text } from '@octane-xplat/ui'

   export function Counter() {
     const count$ = useSignal$(0)
     return <Pressable onPress={() => count$.set((value) => value + 1)}>
       <Text>{count$.get()}</Text>
     </Pressable>
   }
   ```

   Use `signal$` for shared module state and `derived$` for a computed value.
   Write from event handlers, not while rendering.

   ```ts
   import { signal$, derived$ } from 'octane/signals'

   export const travelers$ = signal$(1)
   export const seatsRemaining$ = derived$(() => 4 - travelers$.get())
   export function addTraveler() {
     travelers$.set((count) => count + 1)
   }
   ```

   `query$` loads asynchronous data. A screen-owned query keeps its selection
   local to the screen. `.latest()` reads without suspending; use the data
   guide's boundary pattern when reading with `.get()`.

   ```tsrx
   import { query$ } from 'octane/signals'
   import { Text } from '@octane-xplat/ui'

   export function TripTitle(props: { id: string; loadTitle: (id: string) => Promise<string> }) {
     const title$ = query$(() => props.id, (id) => props.loadTitle(id))
     return <Text>{title$.latest() ?? 'Loading trip…'}</Text>
   }
   ```

6. **One `octane` per app.** Don't add a second renderer or duplicate the
   package — two copies break the reconciler without a helpful error.

For component, routing, service, and styling usage, use the references below.
They show the supported names and matching code examples.

## Compiler rules that surprise

- `.tsrx` files can't declare `async` top-level functions — the compiler
  treats them as async components and the native build fails.
- Literal `@{` in JSX text parses as a code block. Render the sign separately:

  ```tsrx
  import { Text } from '@octane-xplat/ui'

  export function Handle() { return <Text>{'@'}{'traveler'}</Text> }
  ```

- Effect dependencies are inferred from closure reads. An effect that only
  writes (refs, DOM) and never reads its driving prop won't re-run —
  declare dependencies explicitly when needed:

  ```tsrx
  import { useLayoutEffect } from 'octane'
  import { Text } from '@octane-xplat/ui'

  export function Progress(props: { percent: number }) {
    useLayoutEffect(() => { console.log('Progress changed') }, [props.percent])
    return <Text>{props.percent}%</Text>
  }
  ```

- Input handlers must be idempotent: store the supplied value rather than
  incrementing a counter for each input event. Web may dispatch more than once.

  ```tsrx
  import { useState } from 'octane'
  import { TextInput } from '@octane-xplat/ui'

  export function NameField() {
    const [name, setName] = useState('')
    return <TextInput value={name} onChange={setName} accessibilityLabel="Name" />
  }
  ```

- `.mobile.tsrx`/`.ios.tsrx`/`.android.tsrx` files and unsuffixed native-default files containing JSX must
  start with `/** @jsxImportSource @nativescript-community/octane */` on
  line 1 — nothing may precede it:

  ```tsrx
  /** @jsxImportSource @nativescript-community/octane */
  import { Text } from '@octane-xplat/ui'

  export function NativeGreeting() { return <Text>Hello</Text> }
  ```

## Verify

| Command                             | Catches                                                                  |
| ----------------------------------- | ------------------------------------------------------------------------ |
| `pnpm lint`                         | vocabulary / DOM-global / style violations — its output is authoritative |
| `pnpm typecheck`                    | both web and native TS configs                                           |
| `pnpm dev`                          | web behavior                                                             |
| `pnpm dev:ios` / `pnpm dev:android` | the platform where behavior actually differs                             |

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
  record explains _why_ a constraint exists — rarely needed for app work.
