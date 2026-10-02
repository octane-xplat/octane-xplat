# Platform files — the file-boundary system

## Resolution order

The unsuffixed module is the native default. Platform-specific files override
it:

- **Web:** `.web.*` → unsuffixed.
- **iOS:** `.ios.*` → `.mobile.*` → unsuffixed.
- **Android:** `.android.*` → `.mobile.*` → unsuffixed.
- **macOS / Windows:** `.macos.*` / `.windows.*` → unsuffixed.

Use `.web` for browser-specific APIs or markup, `.mobile` when iOS and Android
share an implementation that differs from the native default, and an OS suffix
when only that OS differs. There is no generic `.native` or `.desktop`
filename tier. If an unsuffixed module uses NativeScript APIs and web imports
it, add a `.web` sibling so the browser build selects that implementation.

Vite's `resolve.extensions` and TypeScript's `moduleSuffixes` implement the same
order for each target. The `web` and `native` conditions also select package
`exports` entries; those condition names describe the runtime, not filename
suffixes.

## Rules

1. A file speaks ONE element vocabulary. Browser implementations use DOM
   intrinsics in `.web` files; NativeScript implementations use NS intrinsics
   in `.mobile`, `.ios`, `.android`, or the unsuffixed native default.
2. **No DOM globals in native implementations** — `scripts/check-no-dom.mjs`
   and lint enforce this. The browser-specific module owns `document`,
   `window`, `localStorage`, `HTMLElement`, and other DOM APIs.
3. **Hooks only in `.tsx`/`.tsrx`.** Plain `.ts` files: no hook calls
   (universal hooks get slotted by the compiler only in component files).
   `.ts` platform files are for stores/services — they just can't call hooks.
4. Keep exported props and return values compatible across variants. A caller
   should not need to know which file the resolver selected.
5. `.ios` and `.android` override `.mobile`; `.mobile` overrides the
   unsuffixed native default on both mobile OSes.

## Platform-authentic package subpaths

`@octane-xplat/ui/ios` and `/android` expose OS-widget-backed components;
`/web` is a web-conditioned compat surface (`HoverCard`/`Tooltip` moved to
the root barrel — decision #69). Keep an OS-only import
in its matching `.ios` or `.android` file. A `.mobile` file may import a
cross-platform native API only when that import loads safely on both iOS and
Android. The package's `/native` subpath is NativeScript integration plumbing,
not a filename suffix; `/web` resolves only under web/Linux conditions.

```tsx
// PackedToggle.ios.tsx
import { UISwitch } from '@octane-xplat/ui/ios'

export function PackedToggle() {
	return <UISwitch value={false} onValueChange={console.log} />
}
```

## The barrel rule

`exports` wildcards (`"./*": "./src/*"`) do NOT extension-resolve — a deep
import like `@octane-xplat/ui/theme/tokens.css` works (exact file), but
`@xplat/app/platform/nav` may fail at the bundler. **Import platform services
through the package barrel** (`import { navigate } from '@xplat/app'`), which
re-exports the target implementation.

```ts
import { navigate } from '@xplat/app'

navigate('demo/:id', { id: 'counter' })
```

## tsconfigs

`tsconfig.base.json` plus per-app variants provide renderer JSX sources,
include globs, and ambient types (`@nativescript/types` scoped to mobile).
`tsrx-tsc --noEmit` per target checks `.tsrx` as real TypeScript.

## Platform constants

No `import.meta.env.PLATFORM`. On NativeScript, `__ANDROID__`/`__IOS__`/
`__DEV__` are compile-time literals (ns-vite `define`); declare them in
`apps/mobile/types/globals.d.ts` before use. `Application.android != null`
is the equivalent runtime check (what we currently use). Web has only stock
`import.meta.env`. Inline platform branches in shared files violate the
boundary rule — but a leaf-resolved flag is fine: `@octane-xplat/ui` exports
`isNative` (`true` on iOS/Android, `false` on web) for render-time conditional
JSX/props; OS-level divergence belongs in `.ios`/`.android` files, not
`isAndroid` branches in shared code.

```tsx
import { isNative, Text } from '@octane-xplat/ui'

export function HostLabel() {
	return <Text>{isNative ? 'Native host' : 'Browser host'}</Text>
}
```
