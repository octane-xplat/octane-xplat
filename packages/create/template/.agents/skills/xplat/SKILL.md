---
name: xplat
description: Build and review code in an Octane Xplat app — one TypeScript codebase targeting web (DOM) and iOS/Android (NativeScript). Use when writing components, styles, routes, platform leaves, or device-service calls, and when a feature works on one target but not another.
---

# Octane Xplat app

Shared TSRX can run on web and NativeScript. Run `bun run lint` and
`bun run typecheck` before handing back changes. Check behavior on the
platforms the change affects.

## Non-negotiables

**One element vocabulary per file.** Shared code renders only
`@octane-xplat/ui` components. Put browser elements in a `.web` file and
native elements in the native default or a matching platform leaf. Keep
platform-authentic imports such as `@octane-xplat/ui/ios` in the matching
platform files.

**One public contract for platform leaves.** Keep exported names and public
types identical. Define props once and import that type in each implementation.
Import `./Card.tsrx` using the basename and explicit extension. The platform
checker and build select the matching leaf. See
[platform files](references/platform.md#write-a-platform-file-when-behavior-differs).

**Keep host-specific globals in host-specific code.** An unsuffixed file can
be a native default. Code that runs on several platforms should use shared
APIs such as `@octane-xplat/platform` for device capabilities.

**Styles:** `className` for anything static; `style` objects only for
values that change while the app runs. Shared CSS must use the portable
subset — the native build warns on declarations it drops
(`position: fixed`, `margin: auto`, `box-shadow`, …).
**Hooks and JSX live in `.tsrx` (or `.tsx`).** Keep plain `.ts` modules
for non-component code. Keep component imports in component files.
**Keep signal names suffixed with `$`.** Use `useSignal$` for state owned
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

**One `octane` per app.** Don't add a second renderer or duplicate the
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

The installed compiler and mapper use the program's JSX setting. Lint
requires a first-line pragma for raw native host tags in TSRX. A leaf that
renders only shared components can inherit the setting.

```tsrx
/** @jsxImportSource @octane-xplat/jsx */
export function NativeGreeting() { return <label text="Hello" /> }
```

When the program uses the shared Xplat JSX setting, a browser leaf selects
DOM types with its first-line pragma. Vite selects the renderer.

```tsx
/** @jsxImportSource @octane-xplat/jsx/dom */
export function BrowserGreeting() { return <p>Hello</p> }
```

## Verify

| Command                             | Catches                                                                  |
| ----------------------------------- | ------------------------------------------------------------------------ |
| `bun run lint`                         | vocabulary / DOM-global / style violations — its output is authoritative |
| `bun run typecheck`                    | `tsconfig.json` + every environment declared in `tsconfig.envs.json`     |
| `bun run dev`                          | web behavior                                                             |
| `bun run dev:ios` / `bun run dev:android` | the platform where behavior actually differs                             |

## Read next (only when needed)

- `references/components.md` — the component vocabulary plus per-platform
  divergences and name traps.
- `references/styling.md` — tokens, the portable CSS subset, dark mode.
- `references/navigation.md` — file routes, links, params, stacks, modals.
- `references/platform.md` — device services and writing your own leaf.
- Live tweaks: wrap an editable literal in `useTweak` from
  `octane-xplat/tweaks`, run `bun run dev`, then edit values and styles from
  the Tweaks tab in `bun run xplat devtools` (macOS host). Save writes the
  new literal back to source. Details:
  https://octane-xplat.goddardai.org/package-tweaks
- Current limits and platform boundaries:
  https://octane-xplat.goddardai.org/known-limits
- Full framework docs, one file:
  https://octane-xplat.goddardai.org/llms-full.txt (index:
  https://octane-xplat.goddardai.org/llms.txt). The `/notes/*` design
  record explains _why_ a constraint exists — rarely needed for app work.
