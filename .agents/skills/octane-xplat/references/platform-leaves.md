# Platform files — the file-boundary system

A **platform leaf** is one implementation of a module, selected for a target
through the same import as its sibling implementations.

## Resolution order

The unsuffixed module is the native default. Platform-specific files override
it:

- **Web:** `.web.*` → unsuffixed.
- **iOS:** `.ios.*` → `.mobile.*` → unsuffixed.
- **Android:** `.android.*` → `.mobile.*` → unsuffixed.
- **macOS / Windows native:** `.macos.*` / `.windows.*` → unsuffixed.
- **Linux GTK:** `.gtk.*` → unsuffixed (GTK4/GJS host).
- **Linux workshop (GTK):** `.gtk.*` → unsuffixed; the GTK renderer hosts chrome and stories natively. `.stories.linux.*` is dropped from the linux catalog (rename to `.gtk`; keep `.web` for `--target web`). App-level `.linux.*` leaves remain the DOM/webview chain in `@xplat/linux`.

Use `.web` for browser-specific APIs or markup, `.mobile` when iOS and Android
share an implementation that differs from the native default, and an OS suffix
when only that OS differs. There is no generic `.native` or `.desktop`
filename tier. If an unsuffixed module uses NativeScript APIs and web imports
it, add a `.web` sibling so the browser build selects that implementation.

Vite selects the active platform at build time. A scaffold's TypeScript program
checks all variants together with a fixed, extensionless-first suffix order;
that order does not change the runtime resolver.

Choose the actual renderer before adding a desktop variant. Desktop hosts are
experimental; native GTK and DOM webviews are different targets. Read
[GTK setup](../../../../docs/platform/linux-gtk.md),
[macOS native](../../../../docs/platform/macos-native.md), or
[Windows setup](../../../../docs/platform/windows-setup.md) for host boundaries.
The [module-resolution guide](../../../../docs/platform/module-resolution.md)
explains the common suffix and JSX contract.

## Rules

1. A file speaks ONE element vocabulary. Browser implementations use DOM
   intrinsics in `.web` files; NativeScript implementations use NS intrinsics
   in `.mobile`, `.ios`, `.android`, or the unsuffixed native default.
   - **Import the unsuffixed basename** (`import { Card } from './Card'`) and
     let the resolver pick — never name a platform suffix in a shared import.
     Runtime branching (`isNative`, `Platform.OS`) swaps values inside one
     file; it cannot change which renderer owns the file or mix `<div>` with
     `<masonview>`. Divergent element vocabulary must be a file split.
2. **No DOM globals in native implementations** — lint's `xplat/no-dom-globals`
   rule enforces this. The browser-specific module owns `document`,
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
Android. The package's `/nativescript` subpath is NativeScript integration plumbing,
not a filename suffix; `/web` has a `web` export condition; Linux host presets choose their
conditions separately. Check the export map rather than guessing subpaths.
`@octane-xplat/ui` itself resolves a curated `gtk` condition. The current
primitive/layout subset and runnable example are listed in
[GTK setup](../../../../docs/platform/linux-gtk.md); check `index.gtk.ts`
before choosing another root export. Full UI parity is still in progress.
GTK refs remain Gtk.Widget instances. Measurement uses the renderer's
`getBounds()` app-content coordinates; do not infer global screen coordinates
or call NativeScript's `getLocationOnScreen()`. The GTK `useMeasure` leaf
subscribes through `on/off('layoutChanged')`, which also observes movement
from ancestor scrolling. The current imperative subscription vocabulary is
`loaded`, `unloaded`, and `layoutChanged`; other names throw until qualified.
For GTK adapters, retain the shared file's source extension: a shared
`pan.tsrx` needs `pan.gtk.tsrx`. The current GTK preset checks unsuffixed
`.tsrx` before `.gtk.ts`, so changing the extension can silently select the
shared host implementation.
`/macos` and `/linux` carry AppKit- and GTK-only contracts (for example
`useOutlineFromView` on `/macos`, `LinuxWindowHandle` on `/linux`) that are
deliberately kept off the shared root so `@octane-xplat/ui` exports the same
names on every target.

```tsx
/** @jsxImportSource @octane-xplat/jsx */
// PackedToggle.ios.tsx
import { UISwitch } from '@octane-xplat/ui/ios'

export function PackedToggle() {
	return <UISwitch value={false} onChange={console.log} />
}
```

## The barrel rule

Import from a package's declared entrypoint; a source-tree path is not a
public API. Conditional exports select the platform implementation. For example,
router operations live on `/routing` and stores on `/data`; `@xplat/app` is
repository harness code, not a consumer dependency.

```ts
import { router } from '@octane-xplat/ui/routing'
import { createStore } from '@octane-xplat/ui/data'

const packed = createStore(0)
router.push({ to: '/help' })
```

## tsconfigs

New apps use one `tsconfig.json` with `jsxImportSource: "@octane-xplat/jsx"`.
Browser JSX files explicitly select `@octane-xplat/jsx/dom` with a first-line
pragma. `bun run typecheck` checks `.tsrx` and every platform variant together.
A combined program resolves host handles as the shared `object` type — annotate the concrete view type at each ref declaration; a target-specific consumer
can bind concrete handles through `customConditions: ["native"]` or `["macos"]`.
Conditions bind host types only, never the intrinsic vocabulary.
For the JSX facade's type-only boundary and configuration examples, see
[JSX and host types](../../../../docs/platform/module-resolution.md#typescript).

## Platform constants

Do not invent `import.meta.env.PLATFORM`. Use file variants for OS APIs and
intrinsics. A leaf-resolved flag can select shared values: `@octane-xplat/ui` exports
`isNative` (`true` on iOS/Android, `false` on web) for render-time conditional
shared component props; OS-level divergence belongs in `.ios`/`.android` files, not
`isAndroid` branches in shared code.

```tsx
import { isNative, Text } from '@octane-xplat/ui'

export function HostLabel() {
	return <Text>{isNative ? 'Native host' : 'Browser host'}</Text>
}
```
