# @octane-xplat/nano-icons

Render bundled Iconify icons on web, iOS, Android, and experimental AppKit macOS with shared
preparation: equal icon instances reuse one normalized SVG body instead of converting per
instance. Same artwork, same SVG engines, and same props as
[`@octane-xplat/icons`](../icons) — reach for this package when a screen repeats icons, such
as list rows or toolbars.

The approach is adapted from the official
[react-native-nano-icons](https://github.com/software-mansion-labs/react-native-nano-icons)
strategy: prepare immutable geometry once, apply tint at materialization time, and keep
retained data bounded. Octane keeps its existing SVG renderers — this package is a caching
adapter, not a font renderer; see [Upstream credit](#upstream-credit).

## Install and use

In an Octane-xplat app with `@octane-xplat/ui` already configured:

```sh
pnpm add @octane-xplat/nano-icons @octane-xplat/icons @iconify-json/heroicons
```

Collections register through `@octane-xplat/icons` — `NanoIcon` reads the same registry, so
both components can share one registered set:

```tsx
import { icons as heroicons } from '@iconify-json/heroicons'
import { addCollection } from '@octane-xplat/icons'
import { NanoIcon } from '@octane-xplat/nano-icons'

addCollection(heroicons)

export function NextAction() {
	return <NanoIcon name="heroicons:arrow-right" size={24} color="#2563eb" label="Next" />
}
```

`NanoIcon` takes the same props as `Icon` (`name`, `size`, `color`, `rotate`, `hFlip`,
`vFlip`, `id`, `className`, `label`), renders nothing for missing names, and updates in
place when a collection is re-registered:

```tsx
import { NanoIcon } from '@octane-xplat/nano-icons'

export function Direction() {
	return <NanoIcon name="heroicons:arrow-right" color="#2563eb" rotate={1} hFlip label="Continue" />
}
```

Registration updates flow through the `iconRegistry` store exported by
`@octane-xplat/icons`; mounted `NanoIcon`s subscribe to it exactly like `Icon` does.

## How it differs from `Icon`

`Icon` runs the full Iconify-to-SVG conversion for every component instance. `NanoIcon`
splits that work in two:

- `prepareNanoIcon(icon, options)` normalizes the icon body once per
  `(icon data, size, rotate, hFlip, vFlip)` and caches it. The result is a frozen
  `PreparedNanoIcon` — body, `viewBox`, and logical `width`/`height` — shared by every
  instance with equal inputs.
- `materializeNanoIcon(prepared, { color })` applies the tint. It is cheap: a string pass
  over the shared body, so color-only changes never re-run geometry normalization.

```ts
import { resolveIcon } from '@octane-xplat/icons'
import { prepareNanoIcon, materializeNanoIcon } from '@octane-xplat/nano-icons'

const icon = resolveIcon('heroicons:arrow-right')
if (icon) {
	const prepared = prepareNanoIcon(icon, { size: 24 })
	const svg = materializeNanoIcon(prepared, { color: '#2563eb' })
	console.log(svg.viewBox, svg.width, svg.height, svg.markup)
}
```

Cache identity is the resolved icon object plus the geometry options; when
`addCollection` replaces a set, `@octane-xplat/icons` drops its resolved objects and the
prepared entries release with them. Retention is bounded per icon, so many sizes or
rotations of one icon cannot grow memory without limit.

Web and native disagree on one detail deliberately. Inline web SVG shares the page's id
space, so each live `NanoIcon` instance still rewrites definition IDs to unique values —
the same contract as `iconToSvg`. Native icons render as standalone documents, where ids
cannot collide, so markup keeps the artwork's ids and equal instances emit byte-identical
markup — letting source-keyed host caches (for example the AppKit decoded-image cache in
`@octane-xplat/macos-renderer`) dedupe work across repeats.

```tsx
import { NanoIcon } from '@octane-xplat/nano-icons'

// Both rows render the same prepared body. On native they also share markup.
export function Row() {
	return (
		<>
			<NanoIcon name="heroicons:check" size={20} color="#16a34a" />
			<NanoIcon name="heroicons:check" size={20} color="#16a34a" />
		</>
	)
}
```

## Boundaries

Rendering still goes through Octane's existing SVG engines — inline `<svg>` on web, the
vendored ui-svg SVGView on iOS/Android, `NSImage` on AppKit — so feature support, artwork,
and known limits are identical to `@octane-xplat/icons`, including the SVG subset those
engines degrade on. Labels and decorative handling follow the same contract. This package
adds caching; it is not a speed guarantee and makes no measured-performance claim. For
single-use icons, `Icon` remains a fine default — `NanoIcon`'s benefit appears with
repetition.

`prepareNanoIcon` throws `RangeError` for non-positive or non-finite `size`, matching
`iconToSvg`. Both helpers are DOM-free and safe to import during SSR; the `NanoIcon`
component modules resolve their renderer only through the platform condition lanes.

## Licenses and upstream credit

This package is MIT, like the rest of Octane Xplat, and is an independent implementation:
no upstream code is vendored. The design borrows from
[react-native-nano-icons](https://github.com/software-mansion-labs/react-native-nano-icons)
by Software Mansion — specifically its prepare-once/share-geometry, separate-tint, and
bounded-cache strategy — while deliberately skipping its TTF font pipeline and React
Native host views, which do not fit Octane's renderer model.

- Upstream license: [MIT, © 2026 Software Mansion](https://github.com/software-mansion-labs/react-native-nano-icons/blob/main/LICENSE)
- Upstream third-party notices (picosvg Apache-2.0 © Google, PathKit BSD-3-Clause): [LICENSES.md](https://github.com/software-mansion-labs/react-native-nano-icons/blob/main/packages/react-native-nano-icons/LICENSES.md)

Icon sets retain their own licenses, exactly as with `@octane-xplat/icons`; check each
set's `info.json` and license files before bundling.

## Verification and example

The maintained [probe](../../examples/probes/nano-icons.tsrx) exercises repeated
instances, tint variants, missing names, registration updates, and prop updates; the
[AppKit probe](../../examples/probes/nano-icons.macos.tsrx) covers the macOS host:

```sh
pnpm probe doctor
pnpm probe run examples/probes/nano-icons.tsrx --target web --deps @octane-xplat/icons,@octane-xplat/nano-icons
pnpm probe run examples/probes/nano-icons.tsrx --target ios --device SIMULATOR_UDID --deps @octane-xplat/icons,@octane-xplat/nano-icons
pnpm probe run examples/probes/nano-icons.macos.tsrx --target macos --deps @octane-xplat/icons,@octane-xplat/nano-icons
```

For package checks, run `pnpm --filter @octane-xplat/nano-icons build`, `typecheck`,
`test`, and `pack:check`. Host/source assertions are not pixel parity or OS accessibility
traversal evidence; run the probe on each target you ship.
