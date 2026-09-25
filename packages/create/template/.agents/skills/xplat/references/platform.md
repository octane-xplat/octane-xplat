# Platform services + writing leaves

Two seams cover everything shared code can't reach:

## `@octane-xplat/platform` — device services

One import per capability; each service resolves internally to a `.web` or
`.native` implementation. Surface: `device`, `appInfo`, `locale`,
`connectivity`, `useWindowSize`, `useAppState`, `useSafeAreaInsets`, deep
links, clipboard, `secureStorage`, haptics, notifications, `announce`,
`systemBars`, geolocation, permissions, media, files, share, `openUrl`,
`openSettings`, biometrics.

Services report honestly — `biometrics` returns `unsupported` on web
rather than faking a result. Handle the tier your app can fall back to
instead of assuming success.

## Leaf files — your own divergence

When a service doesn't exist yet or a visual behavior truly differs,
split the file, not the JSX:

```text
src/parts/Scanner.tsrx          shared part — imports './Scanner.impl'
src/parts/Scanner.impl.web.ts   DOM implementation (camera via getUserMedia)
src/parts/Scanner.impl.native.ts NativeScript implementation
```

Import the bare specifier (`./Scanner.impl`); the bundler picks the leaf
via the suffix chain `.ios` → `.android` → `.native` → shared / `.web` →
shared.

Leaf rules:

- Inside a leaf, platform APIs are *expected*: DOM globals in `.web.*`,
  `@nativescript/*` imports in `.native.*`. The lint rules key off the
  suffix — don't fight them with suppressions.
- Never read app-level NativeScript globals (`Application.android.*`)
  at module top — read them inside the call. Top-level reads crash cold
  start before the app exists.
- `.native.tsrx` files with JSX start with
  `/** @jsxImportSource @nativescript-community/octane */` on line 1.
- Deep imports under `@nativescript/core/ui/*` bundle as a second module
  instance — import from `@nativescript/core` only.
- `console.debug` doesn't exist on device — use `console.log`.
