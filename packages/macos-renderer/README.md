# Render Octane components in AppKit

`@octane-xplat/macos-renderer` mounts Octane components into an existing
`NSView`. It is the experimental macOS AppKit renderer, using the
`@nativescript/macos-node-api` runtime and the CLI's JavaScriptCore host.
The supported packaging target is Apple Silicon with macOS 13.5 or later.

Your application owns startup, windows, menus, host services, and custom font
assets. The renderer owns views, layout, events, accessibility, and its hosted
popups and sheets. It applies your stylesheets with the same selector engine
iOS and Android use, but does not implement every NativeScript widget or CSS
property. See the [macOS harness](https://github.com/octane-xplat/octane-xplat/blob/main/apps/macos/README.md) for the current
component and service limits.

Verification status: the image-crop integration test compiles and mounts the
public UI barrel, and registered action selectors match their target/action
strings through direct handler dispatch. OS-level input delivery (a live
AppKit `performClick`, control edits, gestures) has not been verified end to
end, and the full application harness has not been reverified by that test.

## Configure an app

Declare the renderer, `octane`, and `@nativescript/macos-node-api` as application
dependencies. The CLI also requires the runtime to be directly declared, even
though the renderer depends on it. Use one copy of Octane per application.
Declare `@octane-xplat/cli`, `@octanejs/vite-plugin`, and `vite` as development
dependencies; the preset resolves these from your app, not from the CLI.
Use the release-compatible versions from the
[AppKit setup guide](https://octane-xplat.goddardai.org/toolchain#experimental-appkit-target);
do not copy old probe versions into a new app.

Apply the framework's [patch setup](https://github.com/octane-xplat/octane-xplat/blob/main/packages/cli/README.md)
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
import { registerStylesheet } from '@octane-xplat/macos-renderer'

registerStylesheet('promo', '.promo { background-color: #fde68a; }')
```

Linear-gradient backgrounds support direction keywords, degree angles, colors,
and percentage stops. The gradient resizes with its view. Image URLs, radial
and repeating gradients, and multiple background layers remain unsupported.

```css
.fade { background-image: linear-gradient(to right, #152b36, transparent); }
```

Labels honor `padding` (the text insets and the box grows), `letter-spacing`
on plain and formatted text, and italic `font-style`. `visibility: hidden` keeps the layout
slot while suppressing paint and input; `visibility: collapse` drops it.
`cursor` pushes the matching AppKit cursor while the pointer is inside the
view (`none` hides it); `user-select` toggles `selectable` on labels and
html views. `outline`/`outline-*` draws a solid ring outside the border edge
— focus-ring styles land when a stylesheet declares them, though `:focus`
still never matches.

```css
.caption { padding: 2px 6px; letter-spacing: 0.5px; font-style: italic; }
.ghost { visibility: hidden; }
.link { cursor: pointer; user-select: none; }
```

Formatted runs inherit numeric letter spacing from their host and ancestors.
A span can override it with finite points (including negative values); `0` or
`normal` restores the font's default spacing. New runs omit an explicit kern
attribute for these resets, matching plain labels. Native glyph shaping,
measurement and CSS delivery remain unqualified.

```tsx
/** @jsxImportSource @octane-xplat/jsx */
export function SpacedCaption() {
	return <label>
		<formattedstring style={{ letterSpacing: 1 }}>
			<span text="Spaced " />
			<span text="default" style={{ letterSpacing: 0 }} />
		</formattedstring>
	</label>
}
```

Rich text also receives the host's computed line height, so stylesheet-derived
values reach its paragraph attributes. Inline values are a fallback; removing
a fixed height rebuilds the paragraph with default metrics. This source path
has not been qualified against native multiline measurement.

```css
.multiline-caption { line-height: 24px; }
```

Current limits:

- Only `:disabled` responds to state. `:hover`, `:active`, `:pressed`, and
  `:focus` rules never match yet.
- Media queries are re-checked when the appearance or the stylesheets
  change, but not when a window resizes.
- `@keyframes` and `animation-*` are parsed but not played.
- Per-side borders and per-corner radii draw through a
  masked shape layer; `border-style` values paint solid.
- `box-shadow` paints one outset shadow (first entry; spread grows the
  silhouette) and drops the view's corner clip while it is in effect — the
  same CALayer constraint UIKit has. The first `inset` entry approximates as
  an inner ring and ignores blur.
- `transform` composes onto `CALayer.transform` in NS order (translate,
  rotate, rotateX/Y with a default 300pt perspective, scale); percent
  translates resolve against the element's own size and resync on resize.
- Cursor keywords without an AppKit equivalent (diagonal resizes, `wait`,
  zoom, `cell`, `help`) keep the inherited cursor.
- Outlines always draw solid; `dotted`/`dashed`/`double` and friends
  approximate to a solid ring and warn.
- A text field or text view drops its native bezel and background as soon
  as CSS gives it a background, border, or corner radius.
- An unsupported property logs `[macos-css] ignored unsupported property`
  once per property name.

## Preserve context through portals

`createPortal` can place content into an AppKit `NSView` while keeping it in
the declaring Octane tree. The host application still owns the target view;
the renderer inserts and removes only the portal's child views. Use a
caller-owned view or a view from the same Octane root; targets owned by another
Octane root are rejected.

```tsx
/** @jsxImportSource @octane-xplat/jsx */
import { createContext, createPortal, useContext, useEffect, useRef, useState } from 'octane'

const AccountName = createContext('Guest')
const AccountNameProvider: any = AccountName

function AccountLabel() {
	return <label text={'Account: ' + useContext(AccountName)} />
}

export function AccountPage() {
	const targetRef = useRef<any>(null)
	const [target, setTarget] = useState<any>(null)

	useEffect(() => {
		setTarget(targetRef.current)
	}, [])

	return (
		<AccountNameProvider value="Avery">
			<rootlayout ref={targetRef} style={{ width: 280, height: 120 }} />
			{target ? createPortal(<AccountLabel />, target) : null}
		</AccountNameProvider>
	)
}
```

The label renders `Account: Avery` inside the `rootlayout` and reads the same
provider value as its declaring tree. Run the maintained portal fixture with
`pnpm probe run packages/macos-renderer/test/fixtures/portal-lifecycle.macos.tsrx --target macos` to check context,
provider updates, and native child cleanup.

Use [the packaging guide](https://octane-xplat.goddardai.org/toolchain#experimental-appkit-target)
for `xplat.targets.macos` metadata, signing, and CLI commands. The
[independent fixture](https://github.com/octane-xplat/octane-xplat/blob/main/packages/macos-renderer/test/fixtures/main.ts) demonstrates a complete host
entry, including startup and shutdown, without importing the harness.

## Render local images and overlays

Image sources can be base64 data URIs, bundle resources, local paths,
`file://` URLs, or HTTP(S) URLs. Remote requests use a dedicated credential-free NSURLSession; their
processing and view delivery are queued on AppKit's main operation queue.
Uncached local decoding runs on a later turn. Concurrent views share a load;
the last subscriber's removal cancels it. Stale completions cannot update a
newer source, and rejected HTTP responses are not decoded or cached. A bounded
cache retains up to 64 decoded images by recent use. These are source contracts;
actual queue delivery, cancellation and responsiveness remain unqualified.


The private `imageMemoryCache` bridge probes/evicts decoded memory or clears all
decoded entries. Invalidation retires old in-flight cache writes and sharing for
new requests while keeping already subscribed view deliveries alive. The final
remaining subscriber still owns cancellation; late or duplicate completion cannot
replace a newer cached decode. Probes do not promote recency, and eviction does
not blank mounted images or force them to reload. This is a prerequisite for
cache controls, not the optional image package's memory+disk contract. It does
not inspect or invalidate NSURLSession's HTTP cache, disk bytes, or account data.
The public image-cache backend below combines this memory cache with
image-owned encoded disk bytes; the private memory-only seam remains separate.

```ts
const memory = __xplatAppKit.imageMemoryCache
if (memory) {
	const cached = memory.isCached('https://example.com/photo.png')
	memory.evict('https://example.com/photo.png')
	memory.clear()
	console.log(cached) // Decoded-memory presence only.
}
```

Six request-policy and two fake remote/main-queue invalidation cases plus the
[manual memory fixture](../../examples/probes/image-memory-cache.macos.tsrx) are
authored, unrun. Native decoding, memory lifetime, networking, HTTP/disk cache
behavior, responsiveness and packaging remain unqualified.


The image-owned byte backend configures NSURLCache with zero byte-memory
capacity and a 64 MiB disk allowance in the user Caches directory under
`octane-xplat-images-v1/<bundle identifier>`. Display and prefetch share current
byte work; prefetch never constructs NSImage. Disk read/decode are deferred from
the caller, but a later main-loop disk read/full-size decode can still stall.
Native memory, I/O, persistence and responsiveness remain unqualified. This uses
[Apple's direct cache access](https://developer.apple.com/documentation/foundation/accessing-cached-data)
and a session with [automatic caching disabled](https://developer.apple.com/documentation/foundation/urlsessionconfiguration/urlcache?language=objc).

```ts
const cache = __xplatAppKit.imageCache
if (cache) {
	const src = 'https://example.com/photo.png'
	const warmed = await cache.prefetch(src)
	console.log(warmed, cache.isCached(src))
	cache.evict(src)
	cache.clear()
}
```

The session does not reuse shared cookies/credentials. Only current successful
2xx responses without no-store/no-cache/private, Vary or Set-Cookie markers may
write the owned cache. Write readback must match the bytes before prefetch
reports success. Disk failure still permits display; it cannot claim warming.
Eviction/clear retire old disk writers without stranding subscribed view delivery.
Cached URL identity persists until explicit/OS eviction, rather than HTTP
freshness revalidation. These operations leave unrelated HTTP caches alone.
Public helpers require a matching host; unsupported headers/configuration/
decode transforms and other image-engine extensions stay explicit in the
[package subset](../image/README.md#appkit-subset).

```ts
import { prefetch, isImageCached, evictImage, clearImageCaches } from '@octane-xplat/image'
const src = 'https://example.com/photo.png'
const warmed = await prefetch(src, { concurrency: 2 })
console.log(warmed, (await isImageCached(src))[src])
await evictImage(src)
await clearImageCaches()
```

Byte-cache, adapter, remote-view, CoreImage and policy-wiring cases plus updated
placeholder coverage are authored, all unrun. The [AppKit cache fixture](../../examples/probes/cached-image.macos.tsrx)
only mounts controls in its runner; it does not qualify network, disk storage,
capacity/eviction, bridge timing, cache lifetime, cancellation or packaging.


The private imageCachePolicy intrinsic selects memory-disk (default) or none.
Creation and mutation pass the complete final prop bag to updateImage, so a
source/policy change cannot begin a temporary default-mode request. Each view's
request generation includes policy. Bypass has separate, non-retaining decode
and byte pools; it neither reads nor writes owned caches, nor initializes disk
storage. Transport still disables automatic HTTP caching. It may share pending
work with other bypass views, preserving final-subscriber cancellation, while
normal prefetch/display remains independently owned. Clear does not cancel an
unrelated bypass view, and bypass does not evict older default-mode entries.

```tsx
import { Image } from '@octane-xplat/image'
export function Preview({ src }: { src: string }) {
	return <Image src={src} cachePolicy="none" alt="Preview" style={{ width: 120, height: 80 }} />
}
```

The optional leaf's private handoff keeps CoreImage's public props, layout,
placeholder/SVG and candidate selection intact. Capability markers on the actual
CoreImage function and renderer backend reject missing/older support before a
bypass render. These markers are private, not a new public UI Image option.
Paint and native-cancel reentry retain the current generation: previous handles
are claimed before release, and late handles cannot overwrite a newer source.
This bypass controls framework caching, not platform-internal NSImage/resource
storage or displayed bitmap lifetime. Sixteen added byte/view/adapter/CoreImage/
prop-dispatch cases are authored, unrun; native and packed qualification remains
separate in the [target note](../../.agents/docs/parity/appkit-progress.md#appkit-per-image-cache-bypass).

```tsx
import { Image } from '@octane-xplat/ui'

export function Preview({ src }: { src: string }) {
	return <Image src={src} alt="Selected photo" contentFit="contain"
		style={{ width: 120, height: 80 }} />
}
```

An empty source clears the view unless a placeholder is supplied. A pending
replacement can keep the prior image; a placeholder paints while it loads and
remains after failure. Failed loads are not cached. Cache hits do not paint a
pending placeholder. The optional image package uses the same AppKit leaf;
its cache controls, engine extensions and load/error callbacks remain missing.
Source-set selection and decode scheduling hints remain separate gaps.
Styled images compute cover/contain/fill/none/scale-down rectangles, align them
with keyword/point/percentage object positions and clip to the view bounds.
Raw objectPosition parsing supports keywords, px and percentages; unresolved
expressions/other units warn and center. Native NSImageView still owns the
image, intrinsic measurement and accessibility. Actual crop/orientation/density
and drawing after resize remain unqualified. Full-resolution decodes can still block
the UI queue; this is not the mobile Glide/SDWebImage engine.

```tsx
import { Image } from '@octane-xplat/image'

export function Preview({ src }: { src: string }) {
	return <Image src={src} placeholder="~/thumbnail.png" contentFit="contain"
		alt="Selected photo" style={{ width: 120, height: 80 }} />
}
```

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
write a font cache. The [harness font setup](https://github.com/octane-xplat/octane-xplat/blob/main/apps/macos/src/fonts.ts)
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
restore normal wrapping, unlimited lines, and clipping. Labels without an
assigned `style.height` measure their height at the available layout width.
An assigned height still controls the frame; `whiteSpace="nowrap"` or
`maxLines={1}` keeps the text on one line.

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
/** @jsxImportSource @octane-xplat/jsx */
export function Rows() {
	return (
		<stack>
			<flexboxlayout flexDirection="row" gap={12} alignItems="center" justifyContent="start">
				<label text="Name" />
				<label text="Value" />
			</flexboxlayout>
			<flexboxlayout
				style={{ flexDirection: 'row', gap: 12, alignItems: 'center', justifyContent: 'start' }}
			>
				<label text="Name" />
				<label text="Value" />
			</flexboxlayout>
		</stack>
	)
}
```

Inline style wins over recognized classes, which win over direct props,
regardless of prop order. Removing or setting an input to `null` or `undefined`
restores the next source. With no source, defaults are column direction, zero
gap, stretch alignment, and start justification. Here, removing `style.gap`
restores `gap-2` (8 points); removing the class then restores `gap={4}`.

```tsx
/** @jsxImportSource @octane-xplat/jsx */
export function ConflictingRow({ inlineGap }: { inlineGap?: number }) {
	return (
		<flexboxlayout
			gap={4}
			className="flex-row gap-2 items-center justify-end"
			style={{ gap: inlineGap }}
		>
			<label text="Name" />
			<label text="Value" />
		</flexboxlayout>
	)
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
/** @jsxImportSource @octane-xplat/jsx */
export function AxisGap() {
	return (
		<flexboxlayout style={{ flexDirection: 'row', gap: 4, columnGap: 12 }}>
			<label text="Name" />
			<label text="Value" />
		</flexboxlayout>
	)
}
```

This subset does not implement child `flexGrow`, `flexShrink`, `alignSelf`,
`order`, wrapping, reverse directions, or `space-around`/`space-evenly`.
Existing `flex-1`/`shrink-0` class approximations are not full child-flex
semantics. Attached parent-placement metadata remains a direct prop contract:
container channel normalization does not move `row`, `col`, spans, or absolute
placement into styles. Keep those values on the child host.

```tsx
/** @jsxImportSource @octane-xplat/jsx */
export function PositionedRow() {
	return (
		<absolutelayout>
			<flexboxlayout
				left={20}
				top={12}
				style={{ width: 240, height: 40, flexDirection: 'row', gap: 12 }}
			>
				<label text="Name" />
				<label text="Value" />
			</flexboxlayout>
		</absolutelayout>
	)
}
```

## Mason layout engine

`masonview` layout runs on the Mason engine, shipped inside this package as a
prebuilt `libxplatmason.dylib` under `platforms/macos/prebuilt/`. `xplat dev`
and `xplat build` load it through the native bootstrap — no build step or
environment variable is required — and `xplat build` copies it into
`Contents/Frameworks` and signs it with the app.

Maintainers rebuild the engine with `native/xplatmason/build.sh`, which
compiles the pinned `mason-c` revision recorded in
`platforms/macos/prebuilt/manifest.json` for arm64 with a macOS 13.5
deployment target.

## Development bundles

Call `xplatMacOS(mode, { packaged: false, hmr: true, entry: 'src/App.macos.tsx' })`
for the component bundle. It retains renderer and Octane imports so the
CLI-managed shell can share their live instances across edits. Build the
shell with `packaged: true`, and populate `__xplatDevModules` with the renderer
and Octane modules. The [independent development shell](https://github.com/octane-xplat/octane-xplat/blob/main/packages/macos-renderer/test/fixtures/dev-shell.ts)
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
pnpm exec turbo run test --filter=@octane-xplat/macos-renderer
pnpm probe run packages/macos-renderer/test/fixtures/text-overflow.macos.tsrx --target macos
pnpm probe run packages/macos-renderer/test/fixtures/text-wrap.macos.tsrx --target macos
pnpm probe run packages/macos-renderer/test/fixtures/portal-lifecycle.macos.tsrx --target macos
pnpm exec turbo run test:packed --filter=@octane-xplat/macos-renderer
```

Font and layout-channel integration checks live in the
[macOS harness](https://github.com/octane-xplat/octane-xplat/blob/main/apps/macos/README.md).

The overflow check runs an AppKit fixture with long and short strings, assigned
frame resizing, multiline limits, attributed line height, and prop removals. It
asserts native values and measurements; it does not inspect rendered pixels.

The packed check uses the renderer and CLI tarballs in a temporary app outside
the checkout. It checks declarations and production compilation on every
host; on Apple Silicon macOS it also packages and launches the app and verifies
retained-root HMR. Programmatic action dispatch establishes handler behavior,
not OS input or hit-testing.

## Press and swipe callbacks

See [macOS gesture callbacks](https://github.com/octane-xplat/octane-xplat/blob/main/packages/ui/changes/macos-gestures.md) for shared
Pressable and View examples, swipe directions, and verification limits.
The maintained nonvisual fixture checks Objective-C gesture target dispatch;
physical OS input remains a separate manual check.

```sh
goddard-agent resource run --json '{"resources":{"native_builds":1},"purpose":"AppKit gesture verification"}' -- pnpm probe run packages/macos-renderer/test/fixtures/gestures.macos.tsrx --target macos
```


### Image geometry callbacks on AppKit

Raw `image` views expose `onImageGeometryChanged` for core Image's resolution
selection. Events contain `{ width, height, scale }` for the image's own bounds
and window backing factor, independently of margin-host layout notifications.
Frame-size, window attachment and backing-property changes coalesce onto a
later turn; identical metrics are suppressed. Removing the handler/view cancels
queued delivery. This callback is internal renderer machinery, not a new shared
Image prop. Native callback registration, cross-screen behavior and automatic
intrinsic sizing remain unqualified.

```tsx
<image src="~/photo.png" onImageGeometryChanged={({ width, height, scale }) => {
	console.log({ width, height, scale })
}} />
```


### Native coordinate orientation

Coordinate-sensitive renderer paths read the generated `NSView.flipped`
property, whose Objective-C getter is `isFlipped`. This includes scroll
initialization, pan Y normalization, gradient direction, anchored-layer position
and benchmark snapshots. Flipped views count Y downward from the top;
unflipped views count upward from the bottom. Mock property checks and source
parsing do not qualify live scrolling, pointer input, overlay placement or pixels.

```ts
// Native bridge property; do not call view.isFlipped().
const top = view.flipped ? rect.origin.y : view.bounds.size.height - rect.origin.y - rect.size.height
```


### Bound multiline user edits

Raw `textview.maxLength` bounds committed user edits by UTF-16 length. The
editing delegate records the pre-edit string/range; after native text changes,
only excess inserted text is removed through text storage with the native
should-change/did-change protocol. The correction remaps selection and suppresses
its nested public change notification. A wholly rejected edit emits no duplicate
value, while restoring temporarily reported composition text still reports the
restored value. Marked input is left intact until commit;
an explicit unmark also normalizes when no change notification follows. Values
written programmatically are not truncated. Invalid caps are ignored.

```tsx
<textview value="" maxLength={80} onTextChange={(text) => console.log(text)} />
```

This implementation is unqualified under real IMEs, paste/drag input, undo/redo,
selection, the Objective-C override bridge and packaged apps. A veto from the
native should-change check leaves the text unchanged. It is not a general
text-validation or grapheme-count API.


### Controlled text during composition

The textfield/textview `value` path reads the live native editor and skips equal
writes. A different value waits while the editor has marked text. One pending
latest value and one window-update observer belong to that view; commit/edit-end
notifications or a window update schedule a later flush. A newer matching echo,
unset value or teardown cancels the pending work. The writer reuses the native
view and makes no focus request; changed writes clamp selection when the editor
identity survives the setter, and multiline
writes refresh placeholder/growth/limit snapshots. Programmatic synchronous
change notifications are suppressed while writing.

```tsx
<textfield value={name} onTextChange={(value) => setName(value)} />
```

This path covers core TextInput, TextArea and delegated SearchInput. Raw
NSSearchField's `text` API shares this writer, but preserves its property-change
contract: changed programmatic text (including a clear when `text` is dropped)
emits a deduplicated `onTextChange` event after the write. Native edits read the
live field editor; the handler receives `{ object, value, oldValue, eventName }`.

```tsx
<searchbar text={query} onTextChange={(event) => setQuery(event.value)} />
```

Single-line and multiline
submit paths check marked state before dispatching their submit action. Real field-editor ownership,
IME candidate/confirmation timing, observer delivery/window moves, secure-mode
changes, undo/redo, focus and packaging remain unqualified.

### Self-drawn control accessibility

AppKit container hosts map `switch` to a checkbox role, `tab` to a radio-button
role, `tablist` to a tab-group role, `adjustable` to a slider role and `link` to
a link role. Tab values use selected state; switches use checked state, and
adjustable values are numeric. `accessible={false}` or role `none` ignores the
host itself. This is source support; VoiceOver/native bridge qualification
remains open.

```tsx
/** @jsxImportSource @octane-xplat/jsx */
export function TabStop() {
	return <masonview accessibilityRole="tab" accessibilityLabel="Overview"
		accessibilityState={{ selected: true }} onTap={() => {}} />
}
```

Disabled self-drawn hosts expose AppKit's `isAccessibilityEnabled` getter. The
same native getter is read by choice, grid, scope, layer-return and context-origin
focus policies; explicit disabled-card focus claims still allow focus without
activation. The installed SDK declares this getter for NSAccessibilityEnabledAttribute,
matching [Apple's protocol](https://developer.apple.com/documentation/appkit/nsaccessibilityprotocol/isaccessibilityenabled()).
The former `accessibilityIsEnabled` spelling did not override that getter; direct
calls to a same-named JavaScript method were insufficient evidence.

```tsx
import { Button } from '@octane-xplat/ui'

export function Save() {
	return <Button label="Save" isDisabled clickAction={() => console.log('save')} />
}
```

The new selector/retained-state regression and updated focus/action fixtures remain
unrun. Native selector registration, AX enabled queries, VoiceOver, real focus and
packaging still require platform qualification.

Adjustable hosts dispatch native increment/decrement selectors through the
current callbacks in the renderer's discrete event scope. Missing callbacks,
disabled/read-only/ignored hosts and detached roots reject adjustments. Accepted
actions report that dispatch occurred; they do not prove a value changed.
Subsequent value/checked/selected prop changes post `AXValueChanged`; initial
props and equal values do not. Actual notifications and assistive interaction
still need platform verification.

```tsx
/** @jsxImportSource @octane-xplat/jsx */
import { useState } from 'octane'

export function Rating() {
	const [value, setValue] = useState(5)
	return <masonview accessibilityRole="adjustable" accessibilityLabel="Rating"
		accessibilityValue={value} accessibilityMinValue={0} accessibilityMaxValue={10}
		onAccessibilityIncrement={() => setValue((number) => Math.min(10, number + 1))}
		onAccessibilityDecrement={() => setValue((number) => Math.max(0, number - 1))} />
}
```

Apple documents [native slider adjustment dispatch](https://developer.apple.com/documentation/appkit/nsaccessibilityslider/accessibilityperformincrement%28%29)
and the [AppKit role vocabulary](https://developer.apple.com/documentation/appkit/nsaccessibility-swift.struct/role?language=objc).
The authored source regression is `test/common-control-accessibility.test.ts`;
it does not establish VoiceOver, native selector registration, notification
ordering, tab/panel relationships or packaged support.

### Self-drawn control keyboard activation

Unmodified Enter/Space activate a focused self-drawn action host. Shift alone
retains activation. Control/Option/Command combinations, disabled/read-only
accessibility state and missing actions pass to the native responder's key
handling instead. This preserves shortcut routing in source; actual OS input,
menu/key equivalents, input-source switching and VoiceOver remain unqualified.

```tsx
/** @jsxImportSource @octane-xplat/jsx */
export function Save({ save }: { save(): void }) {
	return <masonview accessibilityRole="button" accessibilityLabel="Save" onTap={save}>
		<label text="Save" />
	</masonview>
}
```

### Update self-drawn click actions

Container accessibility identity and click-recognizer ownership are independent.
A checkbox/radio mounted without a callback can acquire its click recognizer
when enabled later. Updating callbacks reuses one recognizer; removing a
callback disables it, and raw disabled-prop changes update its enabled state.
Queued callbacks retain their disabled check. Teardown disables and removes the
owned recognizer. These paths have authored source cases, with native pointer,
keyboard and parent/child arbitration still unqualified.

```tsx
/** @jsxImportSource @octane-xplat/jsx */
export function Choice({ enabled, choose }: { enabled: boolean; choose(): void }) {
	return <masonview accessibilityRole="checkbox" accessibilityLabel="Choice"
		disabled={!enabled} accessibilityState={{ checked: false, disabled: !enabled }}
		onTap={enabled ? choose : undefined}><label text="Choice" /></masonview>
}
```


### Native test identifiers

A concrete AppKit host maps `testID` to its
[accessibilityIdentifier](https://developer.apple.com/documentation/appkit/nsaccessibility-c.protocol/accessibilityidentifier).
This does not change its CSS id or spoken label. Updates reuse the host;
removal clears the native identifier to an empty string. Viewless logical
nodes do not allocate a native identifier or view.

```tsx
/** @jsxImportSource @octane-xplat/jsx */
export function SaveAction({ save }: { save(): void }) {
	return <masonview id="save-control" testID="draft.save" accessibilityRole="button"
		accessibilityLabel="Save changes" onTap={save}><label text="Save" /></masonview>
}
```

Raw mapping and Pressable/Button forwarding have authored, unrun source cases.
Native bridge setters, accessibility-tree discovery, selector replay, reparenting
and packaged operation remain unqualified. An identifier does not expose an
otherwise ignored view or prove an automation tool can discover it.


### Pressed action accessibility

A button host with boolean accessibilityState.pressed uses AppKit's checked
control role and numeric 0/1 value, matching the shared native pressed-state
contract. Removing pressed restores the ordinary button role. Changed pressed
state posts the existing value-change notification; equal states stay silent.

```tsx
/** @jsxImportSource @octane-xplat/jsx */
export function PinAction({ pressed, toggle }: { pressed: boolean; toggle(): void }) {
	return <masonview accessibilityRole="button" accessibilityLabel="Pin"
		accessibilityState={{ pressed }} onTap={toggle}><label text="Pin" /></masonview>
}
```

The getter/notification cases are authored and unrun. Native registration,
VoiceOver role/value announcements and actual activation remain unqualified.


### Focus on disabled selection cards

SelectableCard uses an internal reference-counted disabled-focus claim. A claimed
self-drawn host can accept focus and join native key-view order while retaining
its disabled accessibility state. The claim does not install an action: pointer,
keyboard and accessibility activation remain blocked. Ordinary disabled controls
keep their existing behavior; hiding, Tab suppression and scope fallback
exclusions take precedence.

```tsx
import { SelectableCard } from '@octane-xplat/ui'

export function Plan({ selected, onChange }: { selected: boolean; onChange(value: boolean): void }) {
	return <SelectableCard label="Team plan" isSelected={selected} isDisabled onChange={onChange}>Unavailable</SelectableCard>
}
```

Each owner releases only its own claim; enablement/ref detach releases the card's
claim and requests a native key-view-loop refresh. FocusScope honors explicit
native key-view eligibility while retaining hidden/disabled-native-field gates.
The matching renderer bridge is required. Authored getter/ownership/object-driver
cases remain unrun; actual Tab traversal, focus restoration, VoiceOver, window
moves and packaged operation remain unqualified.

### Nested primary clicks

Primary action recognizers consult AppKit's actual hit view before accepting a
left-mouse-down stream. A nested renderer control, semantic widget (including a
disabled widget), or host with a live action blocks its ancestor's click. Plain
labels, images and groups remain part of the ancestor's clickable content.

```tsx
import { Button, ClickableCard } from '@octane-xplat/ui'

export function Entry({ open, remove }: { open(): void; remove(): void }) {
	return <ClickableCard onPress={open}><Button clickAction={remove}>Remove</Button></ClickableCard>
}
```

The gate uses the content view's superview coordinates, as required by
[NSView.hitTest](https://developer.apple.com/documentation/appkit/nsview/hittest(_:)),
and the optional
[gesture attempt delegate](https://developer.apple.com/documentation/appkit/nsgesturerecognizerdelegate/gesturerecognizer(_:shouldattempttorecognizewith:)).
It reads current renderer metadata/action ownership. Keyboard/AX activation,
other recognizers and same-view simultaneous recognition retain their existing
policies. Unregistered native subviews retain AppKit's default arbitration.
Authored source cases remain unrun: native delegate registration, physical mouse
activation, clear controls, long presses and embedded engine interaction remain
unqualified. This source gate does not establish full nested-input support.

### Composed control key ownership

AppKit DropdownMenu uses a private view-key lease on its existing Button host to
request first/last-row opening with plain Down/Up. The dispatcher shares its
existing native monitor across reconciled handlers, owned view subscriptions and
modality observers. The matching renderer is required; no wrapper or new public
Button/useKeyboard prop is introduced.

```tsx
import { DropdownMenu, DropdownMenuItem } from '@octane-xplat/ui'

export function Actions() {
	return <DropdownMenu button={{ label: 'Actions' }}><DropdownMenuItem label="Archive" /></DropdownMenu>
}
```

Prop handlers run before owned listeners; same-view listeners share prevention,
while stopPropagation stops ancestor delivery. Released listeners are skipped
mid-dispatch and native events remain deduplicated. Each lease releases only its
entry. The bridge checks current node identity/blocked state, enters discrete
event scope and registers one node teardown hook for outstanding leases. View
ref teardown releases the UI attachment; node teardown is the fallback owner.

The nine authored dispatcher/bridge/fake-window cases remain unrun. Actual native
monitor ordering, ref delivery, physical keys, popup focus, IME, modal interaction,
AX and packaging remain unqualified; this source contract is not runtime proof.


### Alt navigation and composition

Recognized navigation/function keys with empty Alt-modified characters retain
normal key identity instead of being marked as dead text. Printable dead keys and
marked native editors remain composing. DateTimeInput uses this distinction for
its guarded preset opening path:

```tsx
import { DateTimeInput } from '@octane-xplat/ui'

export function Appointment() {
	return <DateTimeInput label="Appointment" timeOptionInterval={15} />
}
```

The appended dispatcher case is unrun. This source distinction does not qualify
physical Alt+Down, IME, native field-editor routing or popup focus. See the
[preset-time guide](../../docs/platform/date-picker.md#choose-appkit-preset-times-with-keys).


### Context pointer ownership

The shared AppKit ContextMenu retains a private context-intent lease on its
existing wrapper. One local NSEvent monitor observes pointer modality before
routing secondary-down or plain Control-primary-down to the nearest registered
ancestor of the actual hit view. It uses the same content-view/superview hit-test
coordinate conversion as the primary-click gate. Ordinary primary events and
Control combinations with Shift, Option or Command retain native defaults.

```tsx
import { Button, ContextMenu, DropdownMenuItem } from '@octane-xplat/ui'

export function Document() {
	return <ContextMenu trigger="Actions" menu={<DropdownMenuItem label="Archive" />}>
		<Button label="report.txt" clickAction={() => console.log('select')} />
	</ContextMenu>
}
```

Each lease releases its own entry, including reused callbacks. A declining scope
allows an ancestor; only an accepted intent consumes the native event. Handler
faults are logged and remain consumed. The bridge checks current node identity,
blocked state and discrete event scope; ref teardown releases ownership and node
teardown releases outstanding leases. Modality readers share pointer observation
so consumed context events do not depend on a later native monitor. Older bridges
keep their prior modality observation path. This is separate from OS-native menus.

Twelve authored source cases remain unrun. Native hit-testing/monitor order,
mouse-up/primary-action suppression, popup/ref/focus timing, embedded engines,
IME, AX and packaged operation require native qualification.


### Dedicated Context Menu key

The keyboard dispatcher maps virtual key 0x6E (HIToolbox kVK_ContextualMenu) to
key/code "ContextMenu", and AppKit's U+F735 NSMenuFunctionKey character to logical
key "ContextMenu" while retaining the reported physical code (empty when unknown).
The values were checked in the installed Apple SDK's Events.h/NSEvent.h. Existing
modifiers, field-editor ownership, marked text, cancellation and key-up delivery
remain in the same dispatcher. The shared ContextMenu consumes only unmodified,
noncomposing, unprevented opening intent from a current owned invoker.

```tsx
import { Button, ContextMenu, DropdownMenuItem } from '@octane-xplat/ui'

export function Document() {
	return <ContextMenu trigger="Actions" menu={<DropdownMenuItem label="Archive" />}>
		<Button label="report.txt" clickAction={() => console.log('select')} />
	</ContextMenu>
}
```

Two renderer cases and two added parameterized menu cases remain unrun. Physical
keyboard availability/delivery, native key equivalents, popup/ref/focus timing,
IME, AX and packaging remain unqualified. No OS key synthesis was performed.


### Menu accessibility metadata

AccessibleHostView maps menu to AXMenu and menuitem/menuitemcheckbox/menuitemradio
to AXMenuItem. Menu rows expose the current text label as accessibilityTitle;
other roles retain their inherited native title. isAccessibilitySelected and
isAccessibilityExpanded expose current accessibilityState.selected/expanded
through the SDK protocol getters. Actions keep existing state/close owners and do
not mutate those query values. Menu links now forward current text labels.

```tsx
import { DropdownMenu, DropdownMenuItem, DropdownMenuSubMenu } from '@octane-xplat/ui'

export function Actions() {
	return <DropdownMenu button={{ label: 'Actions' }}>
		<DropdownMenuItem label="Archive" />
		<DropdownMenuSubMenu label="More"><DropdownMenuItem label="Export" /></DropdownMenuSubMenu>
	</DropdownMenu>
}
```

The role constants and getter names were compared with installed Apple SDK
NSAccessibilityConstants.h/NSAccessibilityProtocols.h and generated declarations.
This is query metadata only: menu mark-character attributes, expanded-state
notifications and complete shown-menu/selected-child relationships remain gaps.
Checked state is not substituted for selection or returned as an invented menu
value. Existing value-change policy is unchanged. Two added renderer cases and
one inline-popup label case remain unrun; native selector/property forwarding,
AX queries/tree, VoiceOver, focus and packaged operation remain unqualified.


### Local file-drop destination leases

The private observeFileDrop bridge attaches a destination lease to an existing
AccessibleHostView. The host exposes NSDraggingDestination entered/updated/prepare/
perform selectors (NSDragOperation uses the supported 64-bit NSUInteger ABI).
The registry adds public.file-url to registered types and preserves other types
on last release. Independent leases, ref cleanup and node teardown own registration.
Admission requires the current destination window, copy in the source mask, readable file URLs
and a current enabled owner; delivery rechecks ownership and enters discrete scope.
Copy admission also accepts NSDragOperationEvery as signed/unsigned Number or
BigInt; it avoids 32-bit coercion of the SDK's NSUIntegerMax mask.

```tsx
import { FileInput } from '@octane-xplat/files'
import type { FileInputFile } from '@octane-xplat/files'

export function Attachments(props: { value: FileInputFile[]; change(value: FileInputFile | FileInputFile[] | null): void }) {
	return <FileInput label="Attachments" mode="dropzone" value={props.value} onChange={props.change} isMultiple />
}
```

Pasteboard reads request NSURL objects with the file-URLs-only option, then
forward deduplicated file URL strings. The files leaf owns regular-file inspection,
metadata and validation; native acceptance is receipt, not persistence. No file
promises, native drag source, custom hover/autoscroll or permanent grants are added.
Four registry/one bridge/two inspection/two controller cases are authored, all
unrun. Native ObjC/ABI registration, actual destination hit routing/drag delivery,
Foundation values/grants, lifecycle, AX/focus and packaging remain unqualified.


### Escape before layer dismissal

The AppKit UI layer monitor explicitly dispatches Escape through the renderer's
existing keyboard dispatcher before asking the layer stack to dismiss. The same
native event is cached by that dispatcher, so renderer-first or layer-first local
monitor order cannot invoke a handler twice in the source model. preventDefault
consumes the native event and skips layer dismissal; stopPropagation alone skips
Xplat layer dismissal while retaining the native event. Older bridges retain the
previous layer path. This enables Calendar's unfinished-range Escape owner.

```tsx
import { Calendar } from '@octane-xplat/ui'

export function StayDates() {
	return <Calendar mode="range" maxRangeSpan={14} />
}
```

Four authored source cases use fake NSEvent monitors, including the actual pure
keyboard dispatcher in both orders. They remain unrun and do not prove native
monitor registration/order, proxy identity/deduplication, popup/IME/focus/AX or
packaged operation.

### Clip AppKit container overflow

AppKit now maps two-axis `overflow: hidden` or `overflow: clip` to the native
view's `clipsToBounds`. Use `visible` to clear that view clip. Removing the
style restores that particular native view's original value; this matters
because NSView's default changed in macOS 14 and specialized views differ.
The setting is separate from the existing rounded CALayer mask.

```tsx
<masonview style={{ width: 160, height: 48, overflow: 'hidden' }}>
	<masonview style={{ width: 240, height: 48, backgroundColor: '#68a' }} />
</masonview>
```

Both explicit axes may also be clipped, or both visible. Mixed axes and
`auto`/`scroll` overflow do not create a native scrolling container: they restore
the native baseline and report the unsupported property. Use the existing
scroll view APIs for scrolling.

```tsx
<masonview style={{ overflowX: 'hidden', overflowY: 'clip' }}>
	<label text="Both axes use the native bounds clip" />
</masonview>
```

Six source-slice style reconciliation cases and a manual fixture are authored,
all unrun. This is source coverage, not proof of native drawing, hit-testing,
accessibility, shadow interaction or packaged behavior. Tokenizer has a separate [native geometry source path](../../docs/app/search-selection.md#collapse-appkit-token-rows-with-native-geometry);
its token truncation remains unqualified.

### Editable combo boxes and suggestion roles

The AppKit adapter now maps `combobox` on native text inputs to `AXComboBox` and
applies explicit `accessibilityState.expanded`. Dropping either override restores
that native view's original metadata, including specialized native roles; native
replacement releases the old override and captures a fresh baseline. Mason hosts
map `listbox` to `AXList` and `option` to `AXRow`; option selection uses the existing
native selected-state getter.

```tsx
<textfield accessibilityRole="combobox" accessibilityLabel="Choose a person"
	accessibilityState={{ expanded: true }} />
<masonview accessibilityRole="listbox" accessibilityLabel="People">
	<masonview accessibilityRole="option" accessibilityLabel="Ada"
		accessibilityState={{ selected: true }} />
</masonview>
```

Roles alone do not link the controls. The shared AppKit typeahead adds native
linked-element and selected-children metadata for its current inline result list,
with restoration and current-owner guards. Use the
[typeahead component](../../docs/app/search-selection.md#expose-appkit-suggestion-roles-and-relationships)
for that source subset. Four new renderer cases and the related UI cases are
all unrun. Native hierarchy, VoiceOver actions/announcements, focus/IME and
packaged behavior remain unqualified; raw role declarations do not prove support.

### Stage a source-owned window layer

The private `__xplatAppKit.showLayer` bridge can now accept a `createContentRoot`
outlet instead of creating a standalone Octane root. A declarative caller can
portal from its source tree into that outlet, preserving its own provider scope.
The outlet owns disposal; this hook alone does not create a portal or inherit
providers. `deferPresentation` keeps the native host hidden until `show()` is
requested and the current content commit is ready.

```ts
import type { NSView } from '@octane-xplat/platform/macos'
import type { WindowLayer, WindowLayerContentRoot, WindowLayerOptions } from './src/layer'
export function stageLayer(
	bridge: { showLayer(options: WindowLayerOptions): WindowLayer | null },
	anchor: NSView,
	createContentRoot: (host: NSView) => WindowLayerContentRoot,
) {
	const layer = bridge.showLayer({
		anchor, createContentRoot, deferPresentation: true,
		lightDismiss: true, excludeAnchorFromDismiss: true,
		position: (bounds) => ({ left: bounds.left, top: bounds.top + bounds.height + 8 }),
	})
	layer?.show() // Requests reveal; a pending content commit still gates it.
	return layer
}
```

A custom outlet can implement `whenCommitted(callback)` to release geometry
only after its current native children commit. Stale update callbacks and closed
owners cannot reveal or resize the layer. The existing standalone path remains
available when no outlet is provided. A malformed supplied outlet fails rather
than silently replacing the source owner.

```ts
let committed = false
const waiting: Array<() => void> = []
export const contentRoot = {
	render() {}, // The declaring component renders its portal content.
	whenCommitted(callback: () => void) {
		if (committed) callback()
		else waiting.push(callback)
	},
	unmount() { committed = false; waiting.length = 0 /* Retire the source portal target here. */ },
}
export function sourcePortalCommitted() {
	committed = true
	for (const callback of waiting.splice(0)) callback()
}
```

The host stays in its original window/content container and retires if either
owner changes. Anchor-click exclusion is opt-in; outside interaction continues
to request controlled dismissal without consuming the native event. Deferred
hosts do not request dismissal before reveal. Close claims ownership first,
attempts every cleanup step, and reports the first failure after source disposal
and native detachment are attempted. Unchanged geometry avoids native frame
writes; invalid geometry cannot reach AppKit.

```ts
import type { WindowLayer } from './src/layer'
export function finishLayer(layer: WindowLayer | null) {
	layer?.update({}, { excludeAnchorFromDismiss: false })
	layer?.close() // Programmatic cleanup; no dismissal callback.
}
```

Eight new source cases and the [manual source-portal fixture](../../examples/probes/window-layer-portal.macos.tsrx)
are authored, all unrun. Typeahead/Tokenizer suggestions now use this contract
through a [source-owned result portal](../../docs/app/search-selection.md#float-appkit-search-suggestions).
Tokenizer's outer unfocusedLayer editor remains inline; generic native
Popover/useLayer paths still own standalone roots. Actual portal/ref/commit
ordering, geometry, focus, dismissal, accessibility and packaging remain
unqualified. This is not proof of floating typeahead support.
