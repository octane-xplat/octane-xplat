# Sharing files across platforms

> Use the unsuffixed module as the native default. Add `.web` for browser
> behavior, `.mobile` for behavior shared by iOS and Android, and an OS suffix
> when one platform needs its own implementation.

## File variants

```text
Card.tsrx          native default
Card.web.tsrx      browser implementation
Card.mobile.tsrx   shared iOS and Android implementation
Card.ios.tsrx      iOS-specific implementation
Card.android.tsrx  Android-specific implementation
Card.macos.tsrx    macOS-specific implementation
Card.windows.tsrx  Windows-specific implementation
Card.linux.tsrx    Linux WebKitGTK-specific implementation
```

Import `Card` without naming a platform. The resolver selects the most specific
file for the target, then falls back to the unsuffixed module:

| Target | Resolution order |
| --- | --- |
| Web | `.web` → unsuffixed |
| iOS | `.ios` → `.mobile` → unsuffixed |
| Android | `.android` → `.mobile` → unsuffixed |
| macOS | `.macos` → unsuffixed |
| Windows (when configured) | `.windows` → unsuffixed |
| Linux (when configured) | `.linux` → `.web` → unsuffixed |

There is no general `.native` or `.desktop` filename tier. Native code goes in
the ordinary module; the suffixes identify exceptions to that default. Linux's
WebKitGTK target is a webview, so `.linux` overrides `.web`, which remains its
browser-code fallback.

## Choosing a variant

- Put the native default in the unsuffixed file. It can use native APIs.
- Add a `.web` sibling when browser code needs different APIs or markup. Web
  resolves `.web` first, so the native default does not enter that build.
- Use `.mobile` when iOS and Android share an implementation that differs from
  the unsuffixed default. Use `.ios` or `.android` when only one OS differs.
- Use `.macos`, `.windows`, or `.linux` for an implementation specific to
  that OS.
- Keep the exported props and return values compatible. Callers should not
  need to know which file the resolver selected.

For example, a share action can use the browser share API on web, the native
default elsewhere, and a shared mobile sheet on iOS and Android:

```text
ShareButton.tsrx        native default
ShareButton.web.tsrx    browser share API
ShareButton.mobile.tsrx shared mobile share sheet
```

If a module uses NativeScript APIs and web imports it, provide a `.web` sibling
even when that browser implementation is just a small adapter. Platform
services are another way to keep device APIs out of screens.

## Routes

The route generator follows the same variants. It writes
`routes.gen.web.ts`, `routes.gen.mobile.ts`, and `routes.gen.macos.ts` alongside
the shared `routes.gen.types.ts`. iOS and Android route files can override a
`.mobile` route; macOS routes can override the unsuffixed route.

## TypeScript

The web config uses `moduleSuffixes: [".web", ""]`. The mobile config includes
`.ios`, `.android`, `.mobile`, and the unsuffixed fallback; the NativeScript
Vite resolver orders the active OS first at build time. The macOS config uses
`.macos` before the unsuffixed fallback. Keep imports extensionless so the
resolver can select the right file.

`moduleSuffixes` doesn't probe `.tsrx` directly. If TypeScript needs an
extensionless import of a `.tsrx` leaf, add a same-name `.ts` shim that
re-exports the component. For example, `Card.mobile.ts` can re-export
`Card.mobile.tsrx`; the Vite resolver still selects the `.tsrx` component
directly at runtime. The template skill shows the explicit `.tsrx` import
form when a shim is unnecessary.

Run the app typechecks with `pnpm typecheck:web`, `pnpm typecheck:mobile`, and
`pnpm typecheck:macos`. The mobile config covers both iOS and Android.

For the resolver implementation and the historical experiments that led to
it, see the [module-resolution notes](module-resolution-notes.md).
