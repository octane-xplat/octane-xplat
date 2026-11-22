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
Card.web.tsrx      browser implementation
Card.mobile.tsrx   shared iOS and Android implementation
Card.ios.tsrx      iOS-specific implementation
Card.android.tsrx  Android-specific implementation
Card.macos.tsrx    macOS-specific implementation
Card.windows.tsrx  Windows-specific implementation
Card.gtk.tsrx      native GTK implementation
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
| Windows (when configured)         | `.windows` → unsuffixed             |
| Linux GTK4/GJS native             | `.gtk` → unsuffixed                 |

There is no general `.native` or `.desktop` filename tier. Native code goes in
the ordinary module; the suffixes identify exceptions to that default. A DOM
webview uses `.web`; `.macos` and `.windows` are reserved for native frontends.
Desktop WebView app hosting has been removed. Native Linux UI uses `.gtk` files.

## Dependencies during web development

Keep the starter's platform resolver when customizing Vite. It also makes
Vite's development dependency optimizer use the configured extension order,
so a dependency's `./db` import can select `db.web.ts` before `db.ts`.
Production builds alone do not exercise this step. The
[web configuration example](../packages/package-toolchain.md#configure-a-web-app)
supplies the extension order automatically:

```ts
import { defineConfig } from 'octane-xplat/vite'

export default defineConfig({})
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

The toolchain config helper and native Vite presets include CSS selection. Custom
browser or DOM webview configs add `css('web')` to their existing renderer plugins.
A browser running on iOS still uses `web`.

```ts
import { defineConfig } from 'vite'
import { css } from '@octane-xplat/cli/vite'

export default defineConfig({ plugins: [css('web')] })
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
- Every implementation exposes identical exported names and public types.
  Define the props once in a shared file such as `props.ts` and import the
  same type in the default implementation and every leaf. Keep host-specific
  globals out of code that runs on several platforms.

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
all applicable platform programs. If you're using an agent, ask it to
fix any errors and run the check again.

The remaining details are for troubleshooting file resolution or maintaining
the build configuration; you can skip them when that check passes.

The build selects the active platform using the resolution order above.
The scaffold checks each platform in a separate TypeScript program. Each program
uses that platform's standard TypeScript resolution and SDK declarations.
Shared files are checked in every applicable program. A passing check does not
prove that the app runs on a device.
For TSRX modules, include `.tsrx` but leave out the platform name. TypeScript
and the platform build select the matching leaf when one exists.
The starter includes matching leaves as starting files in each platform program,
so the web checker also checks `Card.web.tsrx` directly. If you customize
`tsconfig.envs.json`, make sure the web entry's `include` or `files` covers it.
Every platform family needs an unsuffixed module; lint checks this for source
files. If no default implementation
exists, use a declaration-only contract and provide implementations for the
targets that import it. The build rejects a contract without an implementation.

```ts
// props.ts — import this type from every Card implementation.
export type CardProps = { title: string }
```

```tsrx
// Card.tsrx — contract for a module implemented only by platform leaves.
import type { CardProps } from './props'

export declare function Card(props: CardProps): unknown
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

Native `.tsx` files inherit the shared vocabulary from the app config. In a
`.tsrx` file that uses native host elements such as `masonview` and `label`,
put the shared JSX comment on the first line. The TSRX mapper honors the
program's JSX source, and Xplat lint requires the explicit comment for raw
native elements.

```tsrx
/** @jsxImportSource @octane-xplat/jsx */
export function Card() {
  return (
    <masonview style={{ display: 'grid' }}>
      <label text="Ready" />
    </masonview>
  )
}
```

Target programs bind the shared `HostElement` through platform conditions.
Name the concrete host type where a native ref is declared:

```tsx
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

The app's `tsconfig.envs.json` lists each environment's source files. A
`native` entry is shorthand for separate iOS and Android checks. Keep DOM
libraries in the web environment; each native program receives only its matching
SDK. Existing `@nativescript/types` requests are narrowed to the matching phone
SDK and common runtime globals. Include shared files in every applicable entry,
or import them from its roots:

```json
{
  "extends": "./tsconfig.json",
  "environments": {
    "web": { "files": ["src/Card.web.tsrx", "src/model.ts"] },
    "native": {
      "files": ["src/Card.mobile.tsrx", "src/model.ts"],
      "compilerOptions": { "types": ["@nativescript/types"] }
    }
  }
}
```

Use separate `ios` and `android` entries when their root lists differ. macOS
and Windows use `macos` and `windows` entries. Native Linux uses `gtk` with
its existing GJS declarations and no DOM library. Move any old `linux` manifest
roots into `gtk`. These checks match the native desktop targets:

```json
{
  "environments": {
    "ios": { "files": ["src/Card.ios.tsrx", "src/model.ts"] },
    "android": { "files": ["src/Card.android.tsrx", "src/model.ts"] },
    "macos": { "files": ["src/Card.macos.tsrx", "src/model.ts"] },
    "windows": { "files": ["src/Card.windows.tsrx", "src/model.ts"] },
    "gtk": { "files": ["src/Card.gtk.tsrx", "src/model.ts"] }
  }
}
```

TypeScript 7.1 checks TSRX through a **content mapper**, a compiler process
that presents each TSRX file as typed source. The `octane-xplat` umbrella
package already declares the mapper, so apps keep this entry in
configurations that contain TSRX and install nothing extra:

```json
{
  "contentMappers": [
    { "package": "octane-xplat", "extensions": [".tsrx"] }
  ]
}
```

Libraries that depend on `@octane-xplat/cli` directly name it instead:

```json
{
  "contentMappers": [
    { "package": "@octane-xplat/cli", "extensions": [".tsrx"] }
  ]
}
```

The package name must resolve as a bare `node_modules` entry from the
tsconfig's directory — the compiler does not accept paths here — so the
mapper lives on the packages every project depends on directly. Checking
uses the project's TypeScript 7.1 compiler:

```sh
bun run xplat typecheck
```

### Editor project context

The typecheck writes each platform configuration into the tracked
`xplat-typecheck/` directory beside the manifest. Commit that directory: the
programs are generated but project-relative, so the language server discovers
them right after dependency installation without a first typecheck run.
Run the typecheck again to regenerate them when you change the manifest, its
roots, or the dependency layout it resolves through. New starters include a
root `tsconfig.json` with solution references, which lets the language server
discover those configurations from source files. These references exist for
editor discovery. While an app's generated program is absent, the framework's
Vite preset uses its committed `tsconfig.envs.json`. When Vite discovers
TypeScript configs for individual files, the preset also uses a linked
package's own manifest if its generated program is missing. Run the typecheck
when you want to check types and refresh the editor's platform projects:

```sh
bun run typecheck
```

For an existing manifest-based app, keep common compiler options and the mapper
entry in the root config, replace its broad `include`/`files` with an empty root
list, and reference each generated program. This example matches the web/native
manifest above. The solution references let the editor discover the generated
projects.

```json
{
  "contentMappers": [{ "package": "octane-xplat", "extensions": [".tsrx"] }],
  "compilerOptions": {
    "strict": true,
    "target": "ESNext",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "preserve",
    "jsxImportSource": "@octane-xplat/jsx",
    "allowImportingTsExtensions": true,
    "skipLibCheck": true,
    "noEmit": true
  },
  "files": [],
  "references": [
    { "path": "./xplat-typecheck/web.json" },
    { "path": "./xplat-typecheck/ios.json" },
    { "path": "./xplat-typecheck/android.json" }
  ]
}
```

For native Linux, reference the `gtk` program declared in your manifest. Replace
any old `all.json` or `linux.json` reference:

```json
{
  "files": [],
  "references": [
    { "path": "./xplat-typecheck/gtk.json" }
  ]
}
```

The embedded `WebView` component remains available in native apps. If you build
a browser document for it, check that document in a separate `web` program and
keep its browser globals out of the native host code:

```json
{
  "environments": {
    "gtk": { "include": ["src/native/**/*.ts", "src/native/**/*.tsrx"] },
    "web": { "include": ["src/web-content/**/*.ts", "src/web-content/**/*.tsrx"] }
  }
}
```

Use the project's TypeScript 7.1 compiler for semantic editor support. In VS Code,
install the TSRX and TypeScript 7 extensions (version 1.0.2 or newer), trust the
workspace, and follow the
[TSRX native backend setup](https://github.com/tsrx-org/tsrx/blob/main/packages/vscode-plugin/README.md#native-backend-setup).
New starters declare TypeScript directly so the editor can find it with Bun's
isolated linker. For an older app, add the same supported compiler version, then
select it in the editor settings:

```sh
bun add --dev typescript@7.1.0-dev.20261121.1
```

```json
{
  "js/ts.experimental.useTsgo": true,
  "js/ts.tsdk.path": "node_modules/typescript"
}
```

Platform leaves belong to their matching programs. Shared files can belong to
several programs, but editor completion, hover, and diagnostics usually use one
default project. They do not combine every SDK or check every target at once.
For a deliberate shared-file context, change only the `references` array in your
existing root config to keep that program's reference. Retain the other settings,
reload the TypeScript language server, then restore the full list
before editing other platform leaves. The CLI still checks every environment in
the manifest. This fragment replaces only that field:

```json
{
  "references": [{ "path": "./xplat-typecheck/ios.json" }]
}
```

Native TypeScript does not resolve extensionless imports to TSRX files, and
its platform-suffix probing does not match `Card.web.tsrx`. Xplat therefore
uses explicit source extensions and resolves platforms in the build preset.
See the [upstream support tracker](https://github.com/tsrx-org/tsrx/issues/136)
for native compiler and editor limitations.

```ts
import { Card } from './Card.tsrx'
// TypeScript resolves this import to Card.tsrx.
// The web program can also check Card.web.tsrx as a starting file.
// The web build selects Card.web.tsrx.
```

NativeScript build helpers still use TypeScript's classic compiler API for
configuration parsing and native-class transforms. Native starters supply the
separate `typescript-classic` dependency. When updating an existing native app,
install that alias too; your project checker can keep TypeScript 7.1.

```sh
bun add -D typescript-classic@npm:typescript@5.9.3
```

A custom compiler or test configuration needs the same platform selection.
Add `tsrx` when configuring Octane directly. Standard platform presets and
`boundary` already include it.

```ts
import { defineConfig } from 'vitest/config'
import { octane } from 'octane/compiler/vite'
import { tsrx } from '@octane-xplat/cli/vite'

export default defineConfig({
  plugins: [tsrx('web'), octane({ ssr: false })],
  test: { environment: 'jsdom' },
})
```

For `ns build`'s type check (`@nativescript/vite` ≥ 8.0.12, NativeScript PR
#11450): the checker generates its own `moduleSuffixes`, overriding the
project's chain. Upstream emits `['.<platform>', '.native', '']` — no
`.mobile`; our `@nativescript/vite` patch adds the `.mobile` tier for
iOS/Android/visionOS, so `.mobile` leaves resolve under the build-time check
too.

In a scaffolded app, run `bun run typecheck` for its applicable platform programs.
Check each target you ship; a browser typecheck does not validate native-only
imports or platform globals.

For the resolver implementation and the historical experiments that led to
it, see the [module-resolution notes](../../.agents/docs/notes/module-resolution-notes.md).
