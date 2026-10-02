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
request. Check [target support](spec.md#choose-your-targets) too; selecting
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
`import { Card } from './Card'`. The **resolver**, the tool that selects files,
tries the most specific version first. “Unsuffixed” means a file without a
platform name, such as `Card.tsrx`.

```tsx
import { Card } from './Card'

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
| Linux WebKitGTK (legacy)          | `.linux` → `.web` → unsuffixed      |

There is no general `.native` or `.desktop` filename tier. Native code goes in
the ordinary module; the suffixes identify exceptions to that default. A DOM
webview uses `.web`; `.macos` and `.windows` are reserved for native frontends.
Existing Linux `.linux` overrides remain for compatibility and take
precedence over `.web` while the Linux target migrates to the shared contract.

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
pnpm xplat routes
```

## TypeScript

TypeScript checks that the selected component accepts the options your screen
gives it. In a created app, run `pnpm typecheck` from the app folder to check
both the web and phone configurations. If you're using an agent, ask it to
fix any errors and run the check again.

The remaining details are for troubleshooting file resolution or maintaining
the build configuration; you can skip them when that check passes.

The browser and WebView configs resolve `.web` before the unsuffixed fallback.
The mobile config includes
`.ios`, `.android`, `.mobile`, and the unsuffixed fallback; the NativeScript
Vite resolver orders the active OS first at build time. The macOS config uses
`.macos` before the unsuffixed fallback for AppKit. Keep imports extensionless
so the resolver can select the right file.

```json
{ "compilerOptions": { "moduleSuffixes": [".web", ""] } }
```

Plain `tsc` doesn't probe `.tsrx` for extensionless specifiers — the suffix
probe uses a hardcoded extension table (`.ts`/`.tsx`/`.d.ts`/`.js`/`.jsx`).
This repo's `@tsrx/typescript-plugin` patch enables Volar's
`resolveHiddenExtensions`, which maps each `.d.ts` probe — including
`moduleSuffixes`-rewritten ones — back to the `.tsrx` source, so `tsrx-tsc`
resolves `import './Leaf'` to `Leaf.web.tsrx` / `Leaf.ios.tsrx` /
`Leaf.mobile.tsrx` (measured by `pnpm check:suffix-resolution`). Lanes that
run unpatched TypeScript — plain `tsc`, or a consumer that didn't materialize
the patch set — still need a same-name `.ts` shim re-exporting the component
(`Card.mobile.ts` → `Card.mobile.tsrx`) or an explicit `.tsrx` specifier; the
Vite resolver selects the `.tsrx` component directly at runtime either way.
The upstream form of the fix is [tsrx-org/tsrx#971](https://github.com/tsrx-org/tsrx/pull/971),
still open — the shims stay supported until that or an equivalent lands in a
released plugin.

```ts
// Card.mobile.ts — a shim for an unpatched TypeScript lane.
export { Card } from './Card.mobile.tsrx'
```

For `ns build`'s type check (`@nativescript/vite` ≥ 8.0.12, NativeScript PR
#11450): the checker generates its own `moduleSuffixes`, overriding the
project's chain. Upstream emits `['.<platform>', '.native', '']` — no
`.mobile`; our `@nativescript/vite` patch adds the `.mobile` tier for
iOS/Android/visionOS, so `.mobile` leaves resolve under the build-time check
too.

In a scaffolded app, run `pnpm typecheck` for its web and native configs.
Framework contributors use `pnpm typecheck:web`, `pnpm typecheck:mobile`, and
`pnpm typecheck:macos` in this repository. The mobile config covers both iOS
and Android.

For the resolver implementation and the historical experiments that led to
it, see the [module-resolution notes](module-resolution-notes.md).
