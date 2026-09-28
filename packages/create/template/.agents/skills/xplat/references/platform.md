# Platform services + writing leaves

## `@octane-xplat/platform` — device services

Import a capability through the package barrel. The unsuffixed module is its
native default, `.web` is the browser implementation, and `.mobile` or an OS
suffix narrows behavior when needed. Surface: `device`, `appInfo`, `locale`,
`connectivity`, `useWindowSize`, `useAppState`, `useSafeAreaInsets`, deep
links, clipboard, `secureStorage`, haptics, notifications, `announce`,
`systemBars`, geolocation, permissions, media, files, share, `openUrl`,
`openSettings`, biometrics.

Services report honestly — `biometrics` returns `unsupported` on web rather
than faking a result. Handle the tier your app can fall back to instead of
assuming success.

## Leaf files — your own divergence

When a service doesn't exist yet or a visual behavior truly differs, split the
file, not the JSX:

```text
src/parts/Scanner.tsrx          native default
src/parts/Scanner.web.tsrx      browser implementation (camera via getUserMedia)
src/parts/Scanner.mobile.tsrx   shared iOS/Android implementation
src/parts/Scanner.ios.tsrx      iOS-only override
```

Import the bare specifier (`./Scanner`); the bundler selects `.web` first on
web and the most specific native variant on each OS. The `.mobile` variant
overrides the unsuffixed native default on iOS and Android.

Leaf rules:

- Inside `.web.*`, DOM APIs are expected; NativeScript imports belong in
  `.mobile.*`, `.ios.*`, `.android.*`, or the unsuffixed native default. If
  browser code imports that default, add a `.web.*` sibling.
- Never read app-level NativeScript globals (`Application.android.*`)
  at module top — read them inside the call. Top-level reads crash cold start
  before the app exists.
- Native-specific `.tsrx` files containing JSX start with
  `/** @jsxImportSource @nativescript-community/octane */` on line 1.
- Deep imports under `@nativescript/core/ui/*` bundle as a second module
  instance — import from `@nativescript/core` only.
- `console.debug` doesn't exist on device — use `console.log`.
