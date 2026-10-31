# @octane-xplat/icons

Render bundled Iconify icons on web, iOS, Android, and experimental AppKit macOS. Apps choose their sets;
this package ships no icon data, default collection, or Iconify API client.

## Install

In an Octane-xplat app with `@octane-xplat/ui` already configured:

```sh
bun add @octane-xplat/icons @iconify-json/heroicons
```

Heroicons is an example, not a default. Register any number of
`@iconify-json/*` collections the same way. A collection's `prefix`
determines its namespace; there is no automatic package discovery,
fetching, or fallback set.

## Typed per-icon imports

The preferred form imports icon **data** through `icons:<prefix>/<name>`
virtual modules — no registry lookup and no collection in the bundle.
Each import is a tree-shaking edge; a misspelled name fails the build.

```tsx
import xMark from 'icons:heroicons/x-mark'
import { Icon } from '@octane-xplat/icons'

export function Close() {
	return <Icon icon={xMark} size={24} color="#2563eb" label="Close" />
}
```

`icon` takes normalized `IconifyIcon` data — collection dimensions and
aliases are baked in at resolve time. `name` (below) stays for dynamic
lookups; passing `icon` skips the registry entirely.

The `icons:` specifier is resolved by the `xplatIcons` Vite plugin.
Register it in the app's Vite config, before the Octane plugins:

```ts
import { xplatIcons } from '@octane-xplat/icons/vite'

// vite.config.ts — plugins: [xplatIcons(), ...octane(), ...]
```

For typing, include the package's `icons.d.ts` ambient stub in the app —
reference it from an existing ambient declaration file:

```ts
// src/icons.d.ts (any app file swept into your tsconfig)
/// <reference path="../node_modules/@octane-xplat/icons/icons.d.ts" />
```

Or copy its `declare module 'icons:*'` block into an app `.d.ts`, or add the
file to your tsconfig `include`. Every `icons:*` specifier then types its
default export as `IconifyIcon`; the build still fails on an icon that does
not exist in the collection. A stricter per-collection name union and
specifier-level declarations are future work — see issue
[octane-xplat#93](https://github.com/octane-xplat/octane-xplat/issues/93).

## Runtime registry

The registry resolves `name="prefix:name"` at runtime — use it for names
decided dynamically, or for sets shared with components outside the Vite
build (iOS/Android bundlers have no `icons:` plugin yet). Register bundled
JSON before mounting the app, then use `prefix:name`:

```tsx
import { icons as heroicons } from '@iconify-json/heroicons'
import { addCollection, Icon } from '@octane-xplat/icons'

addCollection(heroicons)

export function NextAction() {
	return <Icon name="heroicons:arrow-right" size={24} color="#2563eb" label="Next" />
}
```

Importing a whole collection bundles that collection. To keep the `name=`
path small, register single icons instead — `addIcon(name, icon)` and
`addIcons(record)` take `IconifyIcon` values keyed by `prefix:name`; a
registered name shadows collection data for that name. The values can be
`icons:` module imports where the plugin is active:

```ts
import xMark from 'icons:heroicons/x-mark'
import plus from 'icons:heroicons/plus'
import { addIcons } from '@octane-xplat/icons'

addIcons({ 'heroicons:x-mark': xMark, 'heroicons:plus': plus })
```

Or data you inline yourself — keep each icon's own `width`/`height` when it
differs from the square default:

```ts
import { addIcon } from '@octane-xplat/icons'

addIcon('app:next', {
	width: 24,
	height: 24,
	body: '<path fill="none" d="M4 12h16m-6-6 6 6-6 6" stroke="currentColor" stroke-width="2"/>',
})
```

You can also provide equivalent Iconify JSON containing only the icons you
use — keep collection dimensions and any parent icons needed by aliases when
pruning an existing set:

```ts
addCollection({
	prefix: 'app',
	width: 24,
	height: 24,
	icons: {
		next: {
			body: '<path fill="none" d="M4 12h16m-6-6 6 6-6 6" stroke="currentColor" stroke-width="2"/>',
		},
	},
})
```

Use only trusted bundled SVG data; conversion does not sanitize
SVG bodies. Treat registered JSON as immutable.

## Rendering and updates

Import `Icon` from **this package**. It owns a collection registry separate from
UI's glyph registry: `addCollection` does not populate UI's `registerIcons` seam.
That seam has no change subscription and shares stored definition IDs across
instances. This component subscribes to registration changes and makes SVG IDs
unique for each instance. Re-registering a prefix replaces its whole collection
and updates mounted icons, including a previously missing icon.

```tsx
import { addCollection, Icon } from '@octane-xplat/icons'

addCollection({ prefix: 'trip', icons: { next: { body: '<path d="M0 0h16v16H0z" />' } } })
export function TripIcon() {
	return <Icon name="trip:next" />
}
// Replacing this collection notifies already-mounted TripIcon components.
addCollection({ prefix: 'trip', icons: { next: { body: '<circle cx="8" cy="8" r="8" />' } } })
```

`resolveIcon('prefix:name')` returns normalized Iconify data, including collection
dimensions and alias transforms, or `undefined` for a missing/invalid name.
`Icon` renders nothing in that case. Alias cycles and missing parents also resolve
to nothing. No network request is made. The registration store is exported as
`iconRegistry` (`get`/`subscribe`) for leaf packages that build subscribed
renderers. `@octane-xplat/nano-icons` covers the other end of the spectrum:
fixed icon sets compiled ahead of time into glyph fonts, rendered as stacked
text layers — reach for it on screens that repeat icons.

```ts
import { resolveIcon } from '@octane-xplat/icons'

const icon = resolveIcon('heroicons:arrow-right')
if (!icon) console.log('Register this icon collection before rendering')
```

| Prop              | Behavior                                                                                         |
| ----------------- | ------------------------------------------------------------------------------------------------ |
| `icon`            | `IconifyIcon` data rendered as-is; skips the registry. Either `icon` or `name` is required       |
| `name`            | Registered `prefix:name`, resolved through the registry. Ignored when `icon` is set              |
| `size`            | Positive finite height in logical pixels, default 24; width follows the transformed aspect ratio |
| `color`           | Replaces `currentColor` and supplies default fill; explicit multicolor fills remain intact       |
| `rotate`          | Quarter turns; applied after the icon's own transforms                                           |
| `hFlip`, `vFlip`  | Additional horizontal/vertical flips                                                             |
| `id`, `className` | Passed to the rendered host                                                                      |
| `label`           | Accessible description; omit for decorative icons                                                |

Web uses inline `<svg>` and inherits `currentColor` when `color` is omitted.
Native defaults to black; pass a concrete color to match app/theme text. It sends
DOM-free SVG markup through UI's `Image` SVG path to the vendored ui-svg SVGView
(SVGKit on iOS, androidsvg on Android). No extra native plugin setup is needed
beyond UI's setup. All leaves have the same props and exports. The package uses
style objects and ships no CSS pipeline. Native compatibility follows those SVG
engines; browser-only SVG features such as filters/animation are not guaranteed.

```tsx
// Icon is imported from this package above.
export function Direction() {
	return <Icon name="heroicons:arrow-right" color="#2563eb" rotate={1} hFlip label="Continue" />
}
```

AppKit uses UI's macOS `Image` to encode inline SVG with Foundation and load it
into `NSImageView` through public `NSImage` APIs. This path was runtime-tested
on macOS 27.0.1; SVG decoding on the app deployment minimum macOS 13.5 remains
unverified. An OS that cannot decode the SVG produces an empty image; there is
no fallback renderer. macOS forwards `id`/`className`, but the image host does
not apply class-based styling. Labels map to the native accessibility label;
unlabeled images are marked decorative. Pixel fidelity and OS accessibility
traversal remain unverified. See [AppKit SVG notes](https://github.com/octane-xplat/octane-xplat/blob/main/.agents/docs/notes/icon-svg-notes.md).

```tsx
// Direction.macos.tsx
import { Icon } from '@octane-xplat/icons'

export function Direction() {
	return <Icon id="next" name="heroicons:arrow-right" size={24} label="Next" />
}
```

`iconToSvg(icon, options?)` exposes the shared DOM-free conversion. It returns
`body`, `viewBox`, numeric `width`/`height`, and complete `markup`. It resolves
transforms and rewrites definition references. For native markup, supply a
concrete `color`; the helper otherwise retains `currentColor`.

```ts
import { iconToSvg, resolveIcon } from '@octane-xplat/icons'

const icon = resolveIcon('heroicons:arrow-right')
if (icon) {
	const svg = iconToSvg(icon, { color: '#2563eb' })
	console.log(svg.viewBox, svg.width, svg.height, svg.markup)
}
```

## Licenses

This package and Iconify's utilities are MIT. Icon sets retain their own licenses;
Iconify JSON does not grant a common license across sets. Heroicons is MIT.
Check each set's `info.json`, license files, and upstream license, and retain
required attribution/notices when bundling or pruning its data. Apps own that
license handling; this leaf distributes no set data.

## Verification and example

The maintained [icon probe](https://github.com/octane-xplat/octane-xplat/blob/main/examples/probes/icons.tsrx) exercises multiple
sets, sizing, aliases, missing names, and mounted registration/prop updates:

```sh
bun run probe doctor
bun run probe run examples/probes/icons.macos.tsrx --target macos --deps @octane-xplat/icons
bun run probe run examples/probes/icons.tsrx --target web --deps @octane-xplat/icons
bun run probe run examples/probes/icons.tsrx --target ios --device SIMULATOR_UDID --deps @octane-xplat/icons
```

For package checks, run `bun run turbo run typegen --filter=@octane-xplat/icons`, `typecheck`,
`test`, and `pack:check`. Runtime evidence is recorded separately from builds;
the probe proves host/source updates, not pixel parity or OS accessibility
traversal. Run it on each target you ship.
