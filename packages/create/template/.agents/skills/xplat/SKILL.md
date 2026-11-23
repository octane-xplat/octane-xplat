---
name: xplat
description: Build, check, and troubleshoot Octane Xplat apps for web and NativeScript iOS/Android. Use for the first screen in a scaffolded app, shared components and styles, routing, platform-specific files, or device services.
---

# Octane Xplat app

Shared TSRX can run on web and NativeScript. Work from the app directory
containing `package.json`. Check its scripts and `tsconfig.envs.json` for the
enabled targets.

## Build the first screen

Edit `src/App.tsrx` for a first feature. The starter already loads it on every
enabled target. Put shared styles in `src/style.css`. If you replace the
starter counter, adapt its sample tests to the new interaction. If the app has
web enabled, run `bun run dev` and use the local address printed in the
terminal to check the main interaction. Follow the
[iOS or Android setup](https://octane-xplat.goddardai.org/toolchain#run-on-ios-and-android)
before running on a phone.

## Non-negotiables

**One element vocabulary per file.** Use portable components such as
`@octane-xplat/ui` in shared code. Put browser elements in a `.web` file and
native elements in a native-only implementation. Keep platform-authentic
imports such as `@octane-xplat/ui/ios` in the matching platform files.

**One public contract for platform leaves.** Keep an unsuffixed implementation
or declaration for the family. Keep exported names and public types identical.
Define props once and import that type in each implementation.
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
by a component. Each module that reads signals on native needs a runtime
signals import, even when it receives the signal from another module. Use
`import 'octane/signals'` if the file has no named signals API to import.

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
local to the screen. `.latest()` reads without suspending. Use the
[data guide's boundary pattern](https://octane-xplat.goddardai.org/data#module-scope-vs-screen-scope)
when reading with `.get()`.

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

Run lint and typecheck before handing back changes. Run the available test
and build scripts for the targets affected. Report the targets and interactions
you actually checked.

| Command | What it checks |
| --- | --- |
| `bun run lint` | The app's lint rules, including platform boundaries |
| `bun run typecheck` | Types in the environments declared in `tsconfig.envs.json` |
| `bun run test:web` | The app's web tests in jsdom |
| `bun run build` | The production web bundle |
| `bun run dev` | Starts the local web server |
| `bun run dev:ios` / `bun run dev:android` | Starts development on the selected phone target when its tooling is set up |

## Read next (only when needed)

- [Components](references/components.md) covers shared and platform widgets.
- [Styling](references/styling.md) covers CSS, tokens, dark mode, and fonts.
- [Navigation](references/navigation.md) covers file routes, links, parameters,
  stacks, and modals.
- [Platform services and files](references/platform.md) covers device APIs and
  platform-specific implementations.
- [Live tweaks](https://octane-xplat.goddardai.org/package-tweaks) shows how to
  edit `useTweak` literals from the Tweaks tab in `bun run xplat devtools`
  while `bun run dev` is running. The macOS app can save changes to source.
- Check [known limits](https://octane-xplat.goddardai.org/known-limits) before
  using a feature on a new target. Find other guides in the
  [docs index](https://octane-xplat.goddardai.org/llms.txt) or the
  [complete text](https://octane-xplat.goddardai.org/llms-full.txt).
