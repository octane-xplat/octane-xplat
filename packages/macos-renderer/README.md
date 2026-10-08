# Render Octane components in AppKit

`@octane-xplat/macos-renderer` mounts Octane components into an existing
`NSView`. It is the experimental macOS AppKit renderer, using the
`@nativescript/macos-node-api` runtime and the CLI's JavaScriptCore host.
The supported packaging target is Apple Silicon with macOS 13.5 or later.

Your application owns startup, windows, menus, host services, and custom font
assets. The renderer owns views, layout, events, accessibility, and its hosted
popups and sheets. It does not load web stylesheets or implement every
NativeScript widget. See the [macOS harness](../../apps/macos/README.md) for
the current component and service limits. The image-crop integration test compiles and mounts the public UI barrel.
The full application harness has not been reverified by that test. Registered
action selectors match the assigned target/action strings, and the maintained
consumer checks direct handler dispatch — but OS-level input delivery (a live
AppKit `performClick`, control edits, gestures) has not been verified end to
end.

## Configure an app

Declare the renderer, `octane`, and `@nativescript/macos-node-api` as application
dependencies. The CLI also requires the runtime to be directly declared, even
though the renderer depends on it. Use one copy of Octane per application.
Declare `@octane-xplat/cli`, `@octanejs/vite-plugin`, and `vite` as development
dependencies; the preset resolves these from your app, not from the CLI.
The maintained consumer uses Octane 0.6.3, the Vite plugin 0.1.61, Vite 8.3.0,
and the runtime `0.4.4-next.2026-08-09-31292056208`.

Apply the framework's [patch setup](../cli/README.md)
before building. For TSX checking, install TypeScript; for TSRX source, also
install `@tsrx/typescript-plugin` and use `tsrx-tsc`.

Use this production Vite config:

```js
import { defineConfig } from 'vite'
import { xplatMacOS } from '@octane-xplat/cli/macos/vite'

export default defineConfig(({ mode }) => xplatMacOS(mode))
```

The async preset bundles `src/main.mjs` into `dist/package-build/main.cjs`,
selects macOS platform files, registers the universal renderer, aliases
NativeScript compatibility imports, and externalizes only the native runtime
and `node:` host imports. Unsupported host imports still fail CLI packaging.
No repository paths or harness fonts are needed.

```js
import { xplatMacOS } from '@octane-xplat/cli/macos/vite'

export default await xplatMacOS('production', { entry: 'src/main.mjs' })
```

Set these TypeScript options:

```json
{
	"compilerOptions": {
		"target": "ESNext",
		"module": "ESNext",
		"moduleResolution": "Bundler",
		"jsx": "react-jsx",
		"jsxImportSource": "@octane-xplat/macos-renderer",
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

JSX runtime subpaths contain compiler typing declarations; use the Octane Vite
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
import { createMacOSRoot } from '@octane-xplat/macos-renderer'
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

Use [the packaging guide](../../docs/start/toolchain.md#experimental-appkit-target)
for `xplat.targets.macos` metadata, signing, and CLI commands. The
[independent fixture](test/fixtures/main.mjs) demonstrates a complete host
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
import { createMacOSRoot } from '@octane-xplat/macos-renderer'

const root = createMacOSRoot(contentView, { fontFamily: 'Helvetica Neue' })
```

For bundled fonts, the application loads its assets and license and creates
native descriptors. Register those descriptors before mounting:

```js
import { createMacOSRoot, registerFontFamily } from '@octane-xplat/macos-renderer'

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

## Development bundles

Call `xplatMacOS(mode, { packaged: false, hmr: true, entry: 'src/App.macos.tsx' })`
for the component bundle. It retains renderer and Octane imports so the
CLI-managed shell can share their live instances across edits. Build the
shell with `packaged: true`, and populate `__xplatDevModules` with the renderer
and Octane modules. The [independent development shell](test/fixtures/dev-shell.mjs)
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
pnpm --filter @octane-xplat/macos-renderer test
pnpm --filter @octane-xplat/macos-renderer test:packed
pnpm --filter @xplat/macos test:fonts
```

The packed check uses the renderer and CLI tarballs in a temporary app outside
the checkout. It checks declarations and production compilation on every
host; on Apple Silicon macOS it also packages and launches the app and verifies
retained-root HMR. Programmatic action dispatch establishes handler behavior,
not OS input or hit-testing. Publication requires the repository's normal
[npm bootstrap and trusted-publisher setup](../../.agents/docs/releases.md).
