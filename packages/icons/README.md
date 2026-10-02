# @octane-xplat/icons

Render bundled Iconify icons on web, iOS, and Android. Apps choose their sets;
this package ships no icon data, default collection, or Iconify API client.

## Install and register

In an Octane-xplat app with `@octane-xplat/ui` already configured:

```sh
pnpm add @octane-xplat/icons @iconify-json/heroicons
```

Register bundled JSON before mounting the app, then use `prefix:name`:

```tsx
import { icons as heroicons } from '@iconify-json/heroicons'
import { addCollection, Icon } from '@octane-xplat/icons'

addCollection(heroicons)

export function NextAction() {
	return <Icon name="heroicons:arrow-right" size={24} color="#2563eb" label="Next" />
}
```

Heroicons is the Astryx-parity choice: Astryx's Icon is heroicons-based.
It is an example, not a default. Register any number of `@iconify-json/*`
collections the same way. A collection's `prefix` determines its namespace;
there is no automatic package discovery, fetching, or fallback set.

Importing a whole collection bundles that collection. To keep a small bundle,
provide equivalent Iconify JSON containing only the icons you use:

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

Keep collection dimensions and any parent icons needed by aliases when pruning
an existing set. Use only trusted bundled SVG data; conversion does not sanitize
SVG bodies. Treat registered JSON as immutable.

## Rendering and updates

Import `Icon` from **this package**. It owns a collection registry separate from
UI's glyph registry: `addCollection` does not populate UI's `registerIcons` seam.
That seam has no change subscription and shares stored definition IDs across
instances. This component subscribes to registration changes and makes SVG IDs
unique for each instance. Re-registering a prefix replaces its whole collection
and updates mounted icons, including a previously missing icon.

`resolveIcon('prefix:name')` returns normalized Iconify data, including collection
dimensions and alias transforms, or `undefined` for a missing/invalid name.
`Icon` renders nothing in that case. Alias cycles and missing parents also resolve
to nothing. No network request is made.

| Prop              | Behavior                                                                                         |
| ----------------- | ------------------------------------------------------------------------------------------------ |
| `name`            | Required `prefix:name`                                                                           |
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
beyond UI's setup. Both leaves have the same props and exports. The package uses
style objects and ships no CSS pipeline. Native compatibility follows those SVG
engines; browser-only SVG features such as filters/animation are not guaranteed.

`iconToSvg(icon, options?)` exposes the shared DOM-free conversion. It returns
`body`, `viewBox`, numeric `width`/`height`, and complete `markup`. It resolves
transforms and rewrites definition references. For native markup, supply a
concrete `color`; the helper otherwise retains `currentColor`.

## Licenses

This package and Iconify's utilities are MIT. Icon sets retain their own licenses;
Iconify JSON does not grant a common license across sets. Heroicons is MIT.
Check each set's `info.json`, license files, and upstream license, and retain
required attribution/notices when bundling or pruning its data. Apps own that
license handling; this leaf distributes no set data.

## Verification and example

The maintained [icon probe](../../examples/probes/icons.tsrx) exercises multiple
sets, sizing, aliases, missing names, and mounted registration/prop updates:

```sh
pnpm probe doctor
pnpm probe run examples/probes/icons.tsrx --target web --deps @octane-xplat/icons
pnpm probe run examples/probes/icons.tsrx --target ios --device SIMULATOR_UDID --deps @octane-xplat/icons
```

For package checks, run `pnpm --filter @octane-xplat/icons build`, `typecheck`,
`test`, and `pack:check`. Runtime evidence is recorded separately from builds;
The probe proves host/source updates, not pixel parity or OS accessibility
traversal. Run it on each target you ship. This package owns the maintained probe.
