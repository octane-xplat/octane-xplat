# Render Octane components in AppKit

> Experimental AppKit renderer for Octane on macOS

`@octane-xplat/macos-appkit` mounts Octane components into an existing
`NSView`. It is the experimental macOS AppKit renderer, using the
`@nativescript/macos-node-api` runtime and the CLI's JavaScriptCore host.
The supported packaging target is Apple Silicon with macOS 13.5 or later.

Your application owns startup, windows, menus, host services, and custom font
assets. The renderer owns views, layout, events, accessibility, and its hosted
popups and sheets. It applies your stylesheets with the same selector engine
iOS and Android use, but does not implement every NativeScript widget or CSS
property. See the [macOS harness](../../apps/macos/README.md) for the current
component and service limits.

The independent packed consumer checks native selector dispatch, geometry,
element and nested-root cleanup, and retained-root HMR. These are programmatic
checks on Apple Silicon macOS. Physical input, VoiceOver, visual parity and
whole-process leak freedom require separate qualification; the full application
harness is not qualified by this consumer.


[Generated API reference](https://octane-xplat.goddardai.org/api-macos-appkit).

## Configure an app

Declare the renderer, `octane`, and `@nativescript/macos-node-api` as application
dependencies. The CLI also requires the runtime to be directly declared, even
though the renderer depends on it. Use one copy of Octane per application.
Declare `@octane-xplat/cli`, `@octanejs/vite-plugin`, and `vite` as development
dependencies; the preset resolves these from your app, not from the CLI.
Use the compatible versions supplied by the [toolchain setup](package-toolchain.md);
the maintained consumer reads the repository's compatibility manifest rather
than maintaining a second set of version pins.

Apply the framework's [patch setup](package-cli.md)
before building. For TSX and TSRX checking, install TypeScript and run `tsc --runExternalCode`.

Use this production Vite config:

```js
import { defineConfig } from 'vite'
import { xplatMacOS } from '@octane-xplat/cli/macos/vite'

export default defineConfig(({ mode }) => xplatMacOS(mode))
```

The async preset bundles the packaged entry (`src/main.mjs` by default) into `dist/package-build/main.cjs`,
selects macOS platform files, registers the universal renderer, aliases
NativeScript compatibility imports, and externalizes only the native runtime
and `node:` host imports. Unsupported host imports still fail CLI packaging.
No repository paths or harness fonts are needed.

```js
import { xplatMacOS } from '@octane-xplat/cli/macos/vite'

export default await xplatMacOS('production', { entry: 'src/main.ts' })
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

Declare `@octane-xplat/jsx` for the JSX types shown above. Its runtime subpaths
contain compiler typing declarations; use the Octane Vite
compiler to produce runnable code. The preset compiles reachable TSX/TSRX
source by default. `rules` can override that selection.

```js
import { xplatMacOS } from '@octane-xplat/cli/macos/vite'

export default await xplatMacOS('production', {
  rules: [{ include: '**/*.tsx', renderer: 'macos' }],
})
```

## Mount and dispose a root

In your existing host bootstrap, pass its content view to the renderer:

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
apps do. `xplatMacOS` compiles them like the native preset (it drops
`@platform` blocks for other targets, unwraps `@layer`, and treats `px` as
points) and bundles them into `main.cjs`. The renderer then matches
`className`, `id`, and element-type selectors against your views. (The
engine lives in the internal `@octane-xplat/css-engine` package shared
with the GTK renderer — it is not a stable public API.)

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
```

The cascade follows NativeScript: specificity, then `@layer`, then source
order. Custom properties and `color`/`font-*`/`line-height` inherit, and
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
- An unsupported property logs `[macos-css] ignored unsupported property`
  once per property name.

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
provider value as its declaring tree. Run the maintained portal fixture with
`bun run turbo run test:portals --filter=@octane-xplat/macos-appkit` to check context,
provider updates, and native child cleanup.

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

`style={{ pointerEvents: 'none' }}` makes `Image` and `View` (the flexbox host)
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
write a font cache. The [harness font setup](../../apps/macos/src/fonts.ts)
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
    <masonview style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
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

Maintainers rebuild the engine with `native/xplatmason/build.sh`. The script
consumes the pinned mason-c desktop archive and generated `mason_native.h`
(`dist/native/mason-core/desktop/aarch64-apple-darwin/`, produced by
`nx run nativescript-mason-core:build.native.desktop` in the pinned
nativescript-mason checkout) for the arm64 slice, verifies the archive bytes
against `native/xplatmason/mason-core.pin.json`, and combines it with an
x86_64 slice built from the same pinned revision into a universal dylib with
a macOS 13.5 deployment target. Upstream ships no x86_64-apple-darwin desktop
archive yet — see `.agents/docs/notes/macos-mason-engine.md`.

## Development bundles

Call `xplatMacOS(mode, { packaged: false, hmr: true, entry: 'src/App.macos.tsx' })`
for the component bundle. It retains renderer and Octane imports so the
CLI-managed shell can share their live instances across edits. Build the
shell with `packaged: true`, and populate `__xplatDevModules` with the renderer
and Octane modules. The [independent development shell](../../packages/macos-appkit/test/fixtures/dev-shell.ts)
shows the module mapping and retained-root HMR lifecycle.

```js
// vite.component.config.mjs
import { xplatMacOS } from '@octane-xplat/cli/macos/vite'

export default await xplatMacOS('development', {
  packaged: false,
  hmr: true,
  entry: 'src/App.macos.tsx',
})
```

Other preset options are `root` (defaults to cwd), `entry`, `outDir`, and
`rules`. Packaged output defaults to CommonJS; component output defaults to
ES modules. Component builds preserve the output directory so they do not
delete a shell sharing it; shell configurations should also preserve that
directory when used for development. Applications may override the component format to CommonJS for
the CLI watcher, as the maintained fixture does.

```js
import { xplatMacOS } from '@octane-xplat/cli/macos/vite'

const config = await xplatMacOS('development', {
  root: process.cwd(),
  entry: 'src/App.macos.tsx',
  outDir: 'dist/dev',
  packaged: false,
})
config.build = {
  ...config.build,
  lib: { entry: 'src/App.macos.tsx', formats: ['cjs'], fileName: 'app' },
}
export default config
```

## Verify the package

From this repository:

```sh
bun run turbo run test --filter=@octane-xplat/macos-appkit
goddard-agent resource run --json '{"resources":{"native_builds":1},"purpose":"AppKit packed verification"}' -- bun run turbo run test:packed --filter=@octane-xplat/macos-appkit
```

The packed check uses the renderer and CLI tarballs in a temporary app outside
the checkout. It checks declarations and production compilation on every
host; on Apple Silicon macOS it also packages and launches the app and verifies
retained-root HMR. Programmatic action dispatch establishes handler behavior,
not OS input or hit-testing.

## Press and swipe callbacks

See [macOS gesture callbacks](../../packages/ui/changes/macos-gestures.md) for shared
Pressable and View examples, swipe directions, and verification limits.
The maintained nonvisual fixture checks Objective-C gesture target dispatch;
physical OS input remains a separate manual check.

```sh
goddard-agent resource run --json '{"resources":{"native_builds":1},"purpose":"AppKit gesture verification"}' -- bun run turbo run test:gestures --filter=@octane-xplat/macos-appkit
```
