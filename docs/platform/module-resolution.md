# Sharing files across platforms

> Give a component different files when it needs to work differently in
> a browser or on a phone, while keeping one name in the rest of your app.

Most screen code can stay shared. When a component needs browser or phone
APIs, put that part in a **platform variant**: another file with a platform
name added before the extension. For example, `Card.web.tsrx` is the browser
version of `Card.tsrx`. The build picks the file for the platform you run.

If you're using an agent, you can ask: “Use the iOS switch for this toggle
in an `.ios` file, but keep the same options and leave the browser and
Android actions working.” This guide explains the file rules behind that
request. Check [target support](../start/spec.md#choose-your-targets) too; selecting
a file does not make an experimental platform ready for release.

## File variants

```text
Card.tsrx          native default
Card.web.tsrx      browser or DOM webview implementation
Card.mobile.tsrx   shared iOS and Android implementation
Card.ios.tsrx      iOS-specific implementation
Card.android.tsrx  Android-specific implementation
Card.macos.tsrx    macOS-specific implementation
Card.windows.tsrx  Windows-specific implementation
Card.linux.tsrx    legacy Linux WebKitGTK override
```

Import `Card` without naming a platform, for example
`import { Card } from './Card.tsrx'`. The **resolver**, the tool that selects files,
tries the most specific version first. “Unsuffixed” means a file without a
platform name, such as `Card.tsrx`.

```tsx
import { Card } from './Card.tsrx'

// Each Card variant exports the same component and props.
export function Screen() {
  return <Card />
}
```

A **DOM frontend** uses browser views, either in a browser or in a WebView
(a web page inside an app). These use `.web` files. Native frontends use
their platform's own views. The selection order is:

| Target                            | Resolution order                    |
| --------------------------------- | ----------------------------------- |
| Web                               | `.web` → unsuffixed                 |
| iOS                               | `.ios` → `.mobile` → unsuffixed     |
| Android                           | `.android` → `.mobile` → unsuffixed |
| macOS AppKit                      | `.macos` → unsuffixed               |
| macOS WKWebView                   | `.web` → unsuffixed                 |
| Windows (when configured)         | `.windows` → unsuffixed             |
| Windows WebView (when configured) | `.web` → unsuffixed                 |
| Linux GTK4/GJS native             | `.gtk` → unsuffixed                 |
| Linux WebKitGTK (legacy)          | `.linux` → `.web` → unsuffixed      |

There is no general `.native` or `.desktop` filename tier. Native code goes in
the ordinary module; the suffixes identify exceptions to that default. A DOM
webview uses `.web`; `.macos` and `.windows` are reserved for native frontends.
Existing Linux `.linux` overrides remain for compatibility and take
precedence over `.web` while the Linux target migrates to the shared contract.

## Dependencies during web development

Keep the starter's platform resolver when customizing Vite. It also makes
Vite's development dependency optimizer use the configured extension order,
so a dependency's `./db` import can select `db.web.ts` before `db.ts`.
Production builds alone do not exercise this step. The
[web configuration example](../packages/package-toolchain.md#configure-a-web-app)
includes the extension order:

```ts
import { xplatBoundary } from 'octane-xplat/vite'

// Keep this plugin in your existing Vite plugins array:
const platformResolver = xplatBoundary('web')
```

## CSS file variants

Stylesheets can use the same replacement rule. Import `./card.css`; on web,
`card.web.css` replaces it when present. On iOS and Android, the OS suffix
wins over `.mobile.css`, followed by the unsuffixed file. The files never
merge automatically. visionOS uses the `.ios.css` → `.mobile.css` →
unsuffixed chain, matching its module fallback.

```ts
import './card.css'
```

Native Vite presets include CSS selection. For a browser or DOM webview,
add `xplatCss('web')` to the app's existing Vite plugins. A browser running
on iOS still uses `web`. DOM webviews, including the legacy Linux
WebKitGTK host, select `.web.css`.

```ts
import { defineConfig } from 'vite'
import { xplatCss } from '@octane-xplat/cli/vite'

export default defineConfig({ plugins: [xplatCss('web')] })
```

Keep common rules in a separately named file when a platform needs additions.
Explicit platform filenames stay exact; this web entry loads both files in
order. CSS `@import` also selects platform siblings, but JavaScript imports
remain the recommended way to load native stylesheets.

```ts
// In the web app entry or a .web.ts module:
import './card.shared.css'
import './card.web.css'
```

## Choosing a variant

- Put the native default in the unsuffixed file. It can use native APIs.
- Add a `.web` sibling when a DOM frontend needs different APIs or markup. Web
  and webview frontends resolve `.web` first, so the native default does not
  enter that build.
- Use `.mobile` when iOS and Android share an implementation that differs from
  the unsuffixed default. Use `.ios` or `.android` when only one OS differs.
- Use `.macos` or `.windows` for native frontend implementations. Keep
  existing `.linux` overrides compatible; do not add new ones for behavior a
  `.web` frontend can provide.
- Keep the exported props and return values compatible. Callers should not
  need to know which file the resolver selected.

For example, a share action can use the browser share API on web, the native
default elsewhere, and a shared mobile sheet on iOS and Android:

```text
ShareButton.tsrx        native default
ShareButton.web.tsrx    browser share API
ShareButton.mobile.tsrx shared mobile share sheet
```

The caller keeps one unqualified import:

```ts
import { ShareButton } from './ShareButton'
```

If a module uses NativeScript APIs and web imports it, provide a `.web` sibling
even when that browser implementation is just a small adapter. Platform
services are another way to keep device APIs out of screens.

## Routes

The route generator follows the same variants. It writes
`routes.gen.web.ts`, `routes.gen.mobile.ts`, and `routes.gen.macos.ts` alongside
the shared `routes.gen.types.ts`. iOS and Android route files can override a
`.mobile` route; macOS routes can override the unsuffixed route.

```sh
bun run xplat routes
```

## TypeScript

TypeScript checks that the selected component accepts the options your screen
gives it. In a created app, run `bun run typecheck` from the app folder to check
all platform files in one program. If you're using an agent, ask it to
fix any errors and run the check again.

The remaining details are for troubleshooting file resolution or maintaining
the build configuration; you can skip them when that check passes.

The build selects the active platform using the resolution order above.
The scaffold's TypeScript program checks every variant together. Its fixed
`moduleSuffixes` order starts with the unsuffixed file, so a passing typecheck
checks the files' contracts, rather than proving runtime platform selection.
For TSRX modules, include `.tsrx` but leave out the platform name. TypeScript
checks the unsuffixed contract; the platform preset selects the runtime leaf.
Every platform family needs an unsuffixed module; lint checks this for source
files. If no default implementation
exists, use a declaration-only contract and provide implementations for the
targets that import it. The build rejects a contract without an implementation.

```tsrx
// Card.tsrx — contract for a module implemented only by platform leaves.
export declare function Card(props: { title: string }): unknown
```

New apps directly depend on `@octane-xplat/jsx` and select its shared native
vocabulary in `tsconfig.json`:

```json
{ "compilerOptions": { "jsx": "preserve", "jsxImportSource": "@octane-xplat/jsx" } }
```

Put this pragma on the first line of each browser JSX file, such as
`Card.web.tsx` or `Card.web.tsrx`, to select DOM elements:

```tsx
/** @jsxImportSource @octane-xplat/jsx/dom */

export function Card() {
  return <div>Ready</div>
}
```

Native JSX files inherit the shared vocabulary, or select it explicitly.
A renderer-specific pragma overrides the app default, so use the facade:

```tsx
/** @jsxImportSource @octane-xplat/jsx */

export function Card() {
  return (
    <masonview style={{ display: 'grid' }}>
      <label text="Ready" />
    </masonview>
  )
}
```

The combined program has no platform export condition, so the shared
`HostElement` is `object`. Name the concrete host type where the ref is
declared — no casts:

```tsx
/** @jsxImportSource @octane-xplat/jsx */
// Spinner.ios.tsx
import type { View } from '@nativescript/core'
import { useRef } from 'octane'

export function Spinner() {
  const view = useRef<View | null>(null)
  return <activityindicator ref={view} busy />
}
```

A separate target-specific consumer program can bind NativeScript `View`
handles with `native`, or AppKit handles with `macos`. Conditions change host
types only. These settings add no runtime renderer:

```json
{ "compilerOptions": { "jsxImportSource": "@octane-xplat/jsx", "customConditions": ["native"] } }
```

An older `tsconfig.envs.json` app can opt into the facade in its top-level
compiler options. `xplat typecheck` preserves that selection when combining
its environments; manifests without an explicit source resolve the facade default (`@octane-xplat/jsx`); browser-only workspaces set `@octane-xplat/jsx/dom`. The legacy
`octane` default:

```json
{
  "compilerOptions": { "jsxImportSource": "@octane-xplat/jsx" },
  "environments": {
    "web": { "include": ["src/**/*.web.tsx"] },
    "native": { "include": ["src/**/*.mobile.tsx"] }
  }
}
```

TypeScript 7.1 checks TSRX through a **content mapper**, a compiler process
that presents each TSRX file as typed source. Starters declare the mapper as a
development dependency. In an existing app, install it and keep this entry in
configurations that contain TSRX. `tsrx-tsc` enables
external compiler code when launching native TypeScript. A direct native
compiler command must opt in with `--runExternalCode`.

```sh
bun add -D @tsrx/content-mapper
```

```json
{
  "contentMappers": [
    { "package": "@tsrx/content-mapper", "extensions": [".tsrx"] }
  ]
}
```

```sh
bun run tsrx-tsc --noEmit
# Equivalent with native TypeScript's launcher:
node node_modules/typescript/bin/tsc --runExternalCode --noEmit
```

Native TypeScript does not resolve extensionless imports to TSRX files, and
its platform-suffix probing does not match `Card.web.tsrx`. Xplat therefore
uses explicit source extensions and resolves platforms in the build preset.
See the [upstream support tracker](https://github.com/tsrx-org/tsrx/issues/136)
for native compiler and editor limitations.

```ts
import { Card } from './Card.tsrx'
// The web build selects Card.web.tsrx; the checker reads Card.tsrx.
```

NativeScript build helpers still use TypeScript's classic compiler API for
configuration parsing and native-class transforms. Native starters supply the
separate `typescript-classic` dependency. When updating an existing native app,
install that alias too; your project checker can keep TypeScript 7.1.

```sh
bun add -D typescript-classic@npm:typescript@5.9.3
```

A custom compiler or test configuration needs the same platform selection.
Add `xplatTsrx` when configuring Octane directly. Standard platform presets and
`xplatBoundary` already include it.

```ts
import { defineConfig } from 'vitest/config'
import { octane } from 'octane/compiler/vite'
import { xplatTsrx } from '@octane-xplat/cli/vite'

export default defineConfig({
  plugins: [xplatTsrx('web'), octane({ ssr: false })],
  test: { environment: 'jsdom' },
})
```

For `ns build`'s type check (`@nativescript/vite` ≥ 8.0.12, NativeScript PR
#11450): the checker generates its own `moduleSuffixes`, overriding the
project's chain. Upstream emits `['.<platform>', '.native', '']` — no
`.mobile`; our `@nativescript/vite` patch adds the `.mobile` tier for
iOS/Android/visionOS, so `.mobile` leaves resolve under the build-time check
too.

In a scaffolded app, run `bun run typecheck` for its combined program.
Framework contributors use `bun run typecheck:web`, `bun run typecheck:mobile`, and
`bun run typecheck:macos` in this repository. The mobile config covers both iOS
and Android.

For the resolver implementation and the historical experiments that led to
it, see the [module-resolution notes](../../.agents/docs/notes/module-resolution-notes.md).
