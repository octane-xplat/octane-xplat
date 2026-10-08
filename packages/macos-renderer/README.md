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
[independent fixture](test/fixtures/main.ts) demonstrates a complete host
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

A container can arrange its content through direct props or an inline style
object. Both declarations below make the same row with a 12-point gap and
vertically centered content. The renderer recognizes these inputs on
`flexboxlayout` and `stack`; other elements retain unsupported-style diagnostics.

```tsx
/** @jsxImportSource @octane-xplat/macos-renderer */
export function Rows() {
	return <stack>
		<flexboxlayout flexDirection="row" gap={12} alignItems="center" justifyContent="start">
			<label text="Name" /><label text="Value" />
		</flexboxlayout>
		<flexboxlayout style={{ flexDirection: 'row', gap: 12, alignItems: 'center', justifyContent: 'start' }}>
			<label text="Name" /><label text="Value" />
		</flexboxlayout>
	</stack>
}
```

Inline style wins over recognized classes, which win over direct props,
regardless of prop order. Removing or setting an input to `null` or `undefined`
restores the next source. With no source, defaults are column direction, zero
gap, stretch alignment, and start justification. Here, removing `style.gap`
restores `gap-2` (8 points); removing the class then restores `gap={4}`.

```tsx
/** @jsxImportSource @octane-xplat/macos-renderer */
export function ConflictingRow({ inlineGap }: { inlineGap?: number }) {
	return <flexboxlayout gap={4} className="flex-row gap-2 items-center justify-end"
		style={{ gap: inlineGap }}>
		<label text="Name" /><label text="Value" />
	</flexboxlayout>
}
```

The supported subset is direction `row`/`column`; nonnegative numeric gaps
in points; alignment `start`, `end`, `center`, `stretch`, and horizontal
`baseline`; justification `start`, `end`, `center`, and `space-between`.
`flex-start`/`flex-end` are accepted aliases. `rowGap` applies to columns and
`columnGap` to rows; within each channel, the matching axis gap wins over `gap`.
The class forms are `flex-row`/`flex-col`, `gap-1/2/3/4/6`,
`items-start/end/center/stretch/baseline`, and `justify-start/end/center/between`.

```tsx
/** @jsxImportSource @octane-xplat/macos-renderer */
export function AxisGap() {
	return <flexboxlayout style={{ flexDirection: 'row', gap: 4, columnGap: 12 }}>
		<label text="Name" /><label text="Value" />
	</flexboxlayout>
}
```

This subset does not implement child `flexGrow`, `flexShrink`, `alignSelf`,
`order`, wrapping, reverse directions, or `space-around`/`space-evenly`.
Existing `flex-1`/`shrink-0` class approximations are not full child-flex
semantics. Attached parent-placement metadata remains a direct prop contract:
container channel normalization does not move `row`, `col`, spans, or absolute
placement into styles. Keep those values on the child host.

```tsx
/** @jsxImportSource @octane-xplat/macos-renderer */
export function PositionedRow() {
	return <absolutelayout>
		<flexboxlayout left={20} top={12} style={{ width: 240, height: 40, flexDirection: 'row', gap: 12 }}>
			<label text="Name" /><label text="Value" />
		</flexboxlayout>
	</absolutelayout>
}
```

## Development bundles

Call `xplatMacOS(mode, { packaged: false, hmr: true, entry: 'src/App.macos.tsx' })`
for the component bundle. It retains renderer and Octane imports so the
CLI-managed shell can share their live instances across edits. Build the
shell with `packaged: true`, and populate `__xplatDevModules` with the renderer
and Octane modules. The [independent development shell](test/fixtures/dev-shell.ts)
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
pnpm --filter @octane-xplat/macos-renderer test:overflow
pnpm --filter @octane-xplat/macos-renderer test:packed
pnpm --filter @xplat/macos test:fonts
pnpm --filter @xplat/macos test:layout-channels
```

The overflow check runs an AppKit fixture with long and short strings, assigned
frame resizing, multiline limits, attributed line height, and prop removals. It
asserts native values and measurements; it does not inspect rendered pixels.

The packed check uses the renderer and CLI tarballs in a temporary app outside
the checkout. It checks declarations and production compilation on every
host; on Apple Silicon macOS it also packages and launches the app and verifies
retained-root HMR. Programmatic action dispatch establishes handler behavior,
not OS input or hit-testing. Publication requires the repository's normal
[npm bootstrap and trusted-publisher setup](../../.agents/docs/releases.md).
