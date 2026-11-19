# Render Octane components in AppKit

> Build a macOS app with NativeScript Core and native AppKit windows.

`@octane-xplat/macos-appkit` mounts Octane components into an existing
`NSView`. NativeScript Core runs those components on AppKit through
`@nativescript/macos-node-api` and the CLI's JavaScriptCore host.
The packaged app supports Apple Silicon and Intel Macs running macOS 13.5
or later. If your app compiles native libraries, install the
[macOS native tools](../platform/macos-native.md) for your build Mac.

The package's `host` entry runs the AppKit application for you: it creates
`NSApplication`, the main window, its universal root, the platform services
`@octane-xplat/platform` reads, and the window service behind `openWindow`.
Your application still owns menus, custom font assets, and the components each
window renders. The renderer owns views, layout, events, accessibility, and its
hosted popups and sheets. It applies your stylesheets with the same selector
engine iOS and Android use, but does not implement every NativeScript widget or
CSS property. See the [macOS harness](../../tools/macos-verification/README.md) for the
current component and service limits.

See [macOS support limits](../testing/known-limits.md#experimental-appkit-renderer)
when choosing components and planning what to check in your app.

[Generated API reference](https://octane-xplat.goddardai.org/api-macos-appkit).

## Configure an app

In your app's `package.json`, declare `@octane-xplat/macos-appkit`, `octane`,
and `@nativescript/macos-node-api` as dependencies. Use one copy of Octane.
Add `@octane-xplat/cli`, `@octane-xplat/macos-build`, `@octane-xplat/jsx`,
Vite, TypeScript, and Octane's compiler peers `@octanejs/vite-plugin` and
`@tsrx/oxc` as development dependencies. The provider brings NativeScript
Core and NativeScript Vite. Use the compatible versions in the
[toolchain setup](package-toolchain.md).

From your app's install root, apply the framework patches and reinstall
so the macOS provider can load its platform definitions. If this is the
first install, run `bun install` first to make the CLI available. See
[framework patches](package-cli.md#framework-patches).

```sh
bun run xplat patches apply
bun install
```

Use this production Vite config:

```js
import { defineConfig } from 'vite'
import { macos } from '@octane-xplat/cli/macos/vite'

export default defineConfig(({ mode }) => macos(mode))
```

The preset compiles `src/main.ts` to `dist/package-build/main.cjs` by
default. It selects macOS platform files and bundles Core, the AppKit
provider, and Octane together. The AppKit host supplies the native runtime
and supported `node:` imports.

```js
import { macos } from '@octane-xplat/cli/macos/vite'

export default await macos('production', { entry: 'src/main.ts' })
```

Set these TypeScript options:

```json
{
  "compilerOptions": {
    "target": "ESNext",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "jsx": "react-jsx",
    "jsxImportSource": "@octane-xplat/jsx",
    "customConditions": ["macos"],
    "moduleSuffixes": [".macos", ""],
    "lib": ["ESNext"],
    "strict": true,
    "skipLibCheck": true,
    "noEmit": true
  },
  "include": ["src/**/*"]
}
```

Run `bun run tsc --runExternalCode --noEmit` to check the app. The JSX
package supplies compiler typing declarations. Use the Octane Vite
compiler to produce runnable code. The preset compiles reachable TSX/TSRX
source by default. `rules` can override that selection.

```js
import { macos } from '@octane-xplat/cli/macos/vite'

export default await macos('production', {
  rules: [{ include: '**/*.tsx', renderer: 'macos' }],
})
```

## Register a custom macOS element

If your app defines its own native element, declare `@nativescript/core`,
`@octane-xplat/nativescript-octane`, and `@octane-xplat/platform` as direct
dependencies for the imports below. Use the provider's compatible Core
version. Extend Core's `View` and register the class through NativeScript
Octane before rendering it.

```ts
// src/appkit-badge.macos.ts — import this module from the app entry.
import { View } from '@nativescript/core'
import { registerElement } from '@octane-xplat/nativescript-octane'
import { NSView } from '@octane-xplat/platform/macos'

class AppKitBadge extends View {
  createNativeView() {
    return NSView.alloc().init()
  }
}

registerElement('appkitbadge', AppKitBadge)
```

## Start an app

`runMacOSApp` from `@octane-xplat/macos-appkit/host` is your packaged entry
point. It creates the main window, mounts a universal root in its content
view, calls your `mount` callback, presents the window, and runs the AppKit
event loop. Your `mount` receives `{ app, window, contentView, root }`; render
your component there and optionally return a cleanup function the host calls
exactly once when the app closes.

```ts
// src/main.ts — the packaged entry named by your Vite config
import { runMacOSApp } from '@octane-xplat/macos-appkit/host'
import App from './App.macos'

runMacOSApp({ title: 'Notes' }, ({ root, window }) => {
  root.render(App, { parentWindow: window })
  return () => console.log('app is closing')
})
```

Options are `title` (default `'Octane App'`), `size` in points (default
`640×420`), `terminateAfterLastWindowClosed` (default `true`), and
`rootOptions` — root options such as `{ fontFamily: 'Acme Sans' }` applied to
the main root and to every `openWindow` root.

Importing `host` also installs the `__xplatAppKit` platform services
(clipboard, storage, `openUrl`, app state, window size, `announce`, and deep
links) that `@octane-xplat/platform` reads on macOS, plus the window service
`openWindow` from `@octane-xplat/ui` calls.

To open a secondary window, first teach the host which component a request
maps to with `setWindowContentResolver`, then call `openWindow` with `data`,
`title`, `size`, `kind`, and `parent`:

```ts
import { setWindowContentResolver } from '@octane-xplat/macos-appkit/host'
import { openWindow } from '@octane-xplat/ui'

setWindowContentResolver((data) =>
  data && typeof data === 'object' && 'kind' in data && data.kind === 'preview'
    ? PreviewWindow
    : null,
)

const win = openWindow({ data: { kind: 'preview' }, title: 'Preview', size: { width: 480, height: 640 } })
await win?.closed
```

Each window mounts its own Octane root using your `rootOptions`. `kind` is a
behavior contract: `'regular'` opens an independent window, `'dialog'`
presents as a sheet on its parent, and `'popup'` is a non-activating child
panel. The returned handle exposes `close()`, `setTitle()`, `setSize()`,
`closed`, `isClosed`, and `onCloseRequested`. `createHostedWindow` opens the
same window without a universal root for non-Octane native views such as a
`WKWebView`.

```ts
import { createHostedWindow } from '@octane-xplat/macos-appkit/host'

const hosted = createHostedWindow({ title: 'Browser', size: { width: 800, height: 600 } })
// hosted.contentView is the NSView to install your native view into.
await hosted.closed
```

## Mount and dispose a root

When you embed Octane into an `NSView` you already own — for example inside
a `createHostedWindow` content view or an existing AppKit app — pass that
view to the renderer instead of using `runMacOSApp`:

```js
import { createMacOSRoot } from '@octane-xplat/macos-appkit'
import App from './App.macos.tsx'

const root = createMacOSRoot(contentView)
root.render(App, {})

// Call when the owning window or application closes.
root.unmount()
```

`contentView` is the `NSView` supplied by your window host. Keep one root for
that view and call `unmount()` before disposing the host. Root creation does
not create a window or start the application run loop. The package also
re-exports Octane's universal native runtime for compiler and hook imports.

## Apply stylesheets

Import CSS files from your entry module, the same way the iOS and Android
apps do. The macOS preset selects the applicable `@platform` blocks,
treats `px` as points, and bundles the CSS into `main.cjs`. NativeScript
Core matches `className`, `id`, and element selectors against your views.
Use `min-width` or `max-width` media queries to style each window at its
own width.

```ts
// src/styles.ts, imported by your entry before the first render
import '@octane-xplat/ui/theme/tokens.css'
import '@octane-xplat/ui/theme/chrome.css'
import './app.css'
```

```css
/* app.css */
.card {
  padding: 16px;
  background-color: var(--color-surface);
  border-radius: 12px;
}

@media (max-width: 600px) {
  .card { padding: 8px; }
}
```

NativeScript Core resolves the cascade by layer order, then specificity,
then source order. Unlayered rules win over layered rules. Custom properties and `color`/`font-*`/`line-height` inherit, and
`var()` and `calc()` resolve per view. A `style` prop overrides CSS, and so
does an element prop with the same name, such as a label's `fontSize`. The
root of every renderer tree gets `ns-root`, `ns-macos`, and `ns-light` or
`ns-dark` from the app's effective appearance.

To add CSS at runtime, call `registerStylesheet`. Registering the same id
again replaces that sheet, and mounted views restyle:

```ts
import { registerStylesheet } from '@octane-xplat/macos-appkit'

registerStylesheet('promo', '.promo { background-color: #fde68a; }')
```

Current limits:

- A text field or text view drops its native bezel and background as soon
  as CSS gives it a background, border, or corner radius.
- Core applies the CSS properties supported by the target view. Check
  platform-specific styling in the running Mac app.

## Preserve context through portals

`createPortal` can place content into an AppKit `NSView` while keeping it in
the declaring Octane tree. The host application still owns the target view;
the renderer inserts and removes only the portal's child views. Use a
caller-owned view or a view from the same Octane root; targets owned by another
Octane root are rejected. The shared JSX type is opaque, so the native portal
boundary names its compiled `UniversalRenderable` type explicitly.

```tsx
/** @jsxImportSource @octane-xplat/jsx */
import { createContext, useContext, useEffect, useRef, useState } from 'octane'
import { createPortal, type UniversalRenderable } from '@octane-xplat/macos-appkit'
import type { HostElement } from '@octane-xplat/jsx/jsx-runtime'

const AccountName = createContext('Guest')
const AccountNameProvider = AccountName

function AccountLabel() {
  return <label text={'Account: ' + useContext(AccountName)} />
}

export function AccountPage() {
  const targetRef = useRef<HostElement | null>(null)
  const [target, setTarget] = useState<HostElement | null>(null)

  useEffect(() => {
    setTarget(targetRef.current)
  }, [])

  return (
    <AccountNameProvider value="Avery">
      <rootlayout ref={targetRef} style={{ width: 280, height: 120 }} />
      {target ? createPortal(<AccountLabel /> as UniversalRenderable, target) : null}
    </AccountNameProvider>
  )
}
```

The label renders `Account: Avery` inside the `rootlayout` and reads the same
provider value as its declaring tree.

Use [the packaging guide](../start/toolchain.md#experimental-appkit-target)
for `xplat.targets.macos` metadata, signing, and CLI commands. The
[independent fixture](../../packages/macos-appkit/test/fixtures/main.ts) demonstrates a complete host
entry, including startup and shutdown, without importing the harness.

## Render local images and overlays

Image sources can be base64 data URIs, local file paths, or `file://` URLs.
An empty or unsupported source clears the old image. Remote URLs require a
separate download; image loading does not perform synchronous network work.
Uncached decodes resolve on a later run-loop turn, so a source change keeps
the previous image until its replacement is ready.
For centered contain-fit, pass `style={{ objectFit: 'contain' }}` to `Image`.
This scales smaller images up while preserving their aspect ratio.

`style={{ pointerEvents: 'none' }}` makes `Image` and `View` (the neutral container host)
pass hit-testing through to siblings below them. Use it for decorative crop
source/guide layers; keep gesture controls interactive. The AppKit crop test
checks those native hit-test boundaries separately from pan handler dispatch.

## Choose fonts

Roots default to Apple's system font. Sizes and CSS numeric or named weights
map to weighted AppKit fonts. `system-ui`, `-apple-system`, and `sans-serif`
select the system font; unavailable families fall through the family stack,
then fall back to the system font.

```tsx
// Text.macos.tsx — the AppKit renderer is configured above.
export function Title() {
  return <label text="Trip notes" style={{ fontFamily: 'system-ui', fontWeight: 'bold' }} />
}
```

For an installed family, set `style.fontFamily` on text or choose a root
default with `createMacOSRoot(contentView, { fontFamily: 'Helvetica Neue' })`.
Renderer-hosted popups and sheets inherit that root default.

```js
// contentView is your existing window's NSView, as in the host example above.
import { createMacOSRoot } from '@octane-xplat/macos-appkit'

const root = createMacOSRoot(contentView, { fontFamily: 'Helvetica Neue' })
```

For bundled fonts, the application loads its assets and license and creates
native descriptors. Register those descriptors before mounting:

```js
import { createMacOSRoot, registerFontFamily } from '@octane-xplat/macos-appkit'

// regularFace and boldFace are NSFontDescriptors created from your font asset.
registerFontFamily('Acme Sans', [
  { weight: 400, descriptor: regularFace },
  { weight: 700, descriptor: boldFace },
])
const root = createMacOSRoot(contentView, { fontFamily: 'Acme Sans' })
```

Registration does not change the renderer default. Registered weights resolve
to the first face at or above the requested weight, or the heaviest face.
Invalid names, empty face lists, and missing descriptors or invalid weights are
rejected. The renderer does not read assets, register Geist automatically, or
write a font cache. The [harness font setup](../../apps/mobile/macos/src/fonts.ts)
demonstrates app-owned descriptors and packaged font bytes.

```js
// regularFace is an NSFontDescriptor created by the app from its loaded font.
registerFontFamily('Acme Sans', [{ weight: 400, descriptor: regularFace }])
```

## Keep labels inside their rows

Use a single-line label with tail ellipsis for a long tab title or suggestion.
The application assigns the frame; AppKit redraws truncation as its width changes.
The full string remains in the native value for copying through application code
and accessibility; the renderer never replaces it with shortened text.

```tsx
export function TabTitle(props: { title: string; width: number }) {
  return (
    <label
      text={props.title}
      maxLines={1}
      whiteSpace="nowrap"
      textOverflow="ellipsis"
      style={{ width: props.width, height: 28 }}
    />
  )
}
```

The supported subset is `whiteSpace="normal"` (word wrapping) or `"nowrap"`,
`textOverflow="clip"` or `"ellipsis"`, and non-negative integer `maxLines`.
`nowrap` takes precedence over a multiline limit; `maxLines={1}` also forces
one line. For wrapping labels, ellipsis appears on the last visible line when
the line limit or frame height is reached. `maxLines={0}` means unlimited
lines. Other values fail with an explicit renderer error; CSS whitespace
collapse/preservation modes are not implemented.

```tsx
export function Suggestion(props: { title: string }) {
  return (
    <label
      text={props.title}
      whiteSpace="normal"
      maxLines={2}
      textOverflow="ellipsis"
      style={{ width: 240 }}
    />
  )
}
```

Updating or removing these props reapplies the native settings. Removed props
restore normal wrapping, unlimited lines, and clipping. An explicit multiline
limit (including zero) releases the renderer's implicit one-line height so
AppKit can measure the text; an assigned `style.height` still controls the
frame. With no line-limit prop, the existing default label height remains one
font-based line unless the application supplies its own height or line height.

```tsx
export function UpdatingTitle(props: { title: string; compact: boolean }) {
  return (
    <label
      text={props.title}
      maxLines={props.compact ? 1 : 2}
      textOverflow={props.compact ? 'ellipsis' : undefined}
      style={{ width: 240 }}
    />
  )
}
```

## Container layout channels

Use `masonview` for authored layout and put layout properties in `style`.
This row places two labels 12 points apart and centers them vertically:

```tsx
/** @jsxImportSource @octane-xplat/jsx */
export function Row() {
  return (
    <masonview style={{ display: 'flex', flexDirection: 'row', gap: 12, alignItems: 'center' }}>
      <label text="Name" />
      <label text="Value" />
    </masonview>
  )
}
```

Application screens can use the shared [layout components](../app/primitives.md)
instead of authoring native host elements directly.

## Mason layout engine

`masonview` layout runs on the Mason engine, shipped inside this package as a
prebuilt `libxplatmason.dylib` under `platforms/macos/prebuilt/`. `xplat dev`
and `xplat build` load it through the native bootstrap — no build step or
environment variable is required — and `xplat build` copies it into
`Contents/Frameworks` and signs it with the app.

## Development bundles

Call `macos(mode, { packaged: false, hmr: true, entry: 'src/App.macos.tsx' })`
for the component bundle. It retains renderer and Octane imports so the
CLI-managed shell can share their live instances across edits. Build the
shell with `packaged: true`. Install the module table before loading the
component bundle so it uses the shell's Core, renderer, and Octane instances.
The [independent development shell](../../packages/macos-appkit/test/fixtures/dev-shell.macos.ts)
shows how to update the mounted root after an edit.

```ts
import * as renderer from '@octane-xplat/macos-appkit'

renderer.__installDevelopmentModules({ '@octane-xplat/macos-appkit': renderer })
```

```js
// vite.component.config.mjs
import { macos } from '@octane-xplat/cli/macos/vite'

export default await macos('development', {
  packaged: false,
  hmr: true,
  entry: 'src/App.macos.tsx',
})
```

Other preset options are `root` (defaults to cwd), `entry`, `outDir`, and
`rules`. Packaged output defaults to CommonJS; component output defaults to
ES modules. Component builds preserve the output directory so they do not
delete a shell sharing it. Preserve that directory in the shell configuration
as well. For the CLI's JavaScriptCore watcher, write the component bundle as
CommonJS and point the dev configuration at both bundles.

```js
import { macos } from '@octane-xplat/cli/macos/vite'

const config = await macos('development', {
  root: process.cwd(),
  entry: 'src/App.macos.tsx',
  outDir: 'dist/dev',
  packaged: false,
  hmr: true,
})
config.build = {
  ...config.build,
  lib: { entry: 'src/App.macos.tsx', formats: ['cjs'], fileName: 'app' },
}
export default config
```

```js
// vite.shell.config.mjs — src/dev-shell.macos.ts owns the window and mounts the root.
import { defineConfig } from 'vite'
import { macos } from '@octane-xplat/cli/macos/vite'

export default defineConfig(async ({ mode }) => {
  const config = await macos(mode, { entry: 'src/dev-shell.macos.ts', outDir: 'dist/dev' })
  return { ...config, build: { ...config.build, emptyOutDir: false } }
})
```

```json
{
  "xplat": {
    "targets": {
      "macos": {
        "runtime": "appkit-node-api",
        "dev": {
          "viteConfig": "vite.component.config.mjs",
          "bundleFile": "dist/dev/app.cjs",
          "shellViteConfig": "vite.shell.config.mjs",
          "shellBundleFile": "dist/dev/main.cjs"
        }
      }
    }
  }
}
```

## Press and swipe callbacks

See [macOS gesture callbacks](../../packages/ui/changes/macos-gestures.md) for shared
Pressable and View examples, swipe directions, and verification limits.
