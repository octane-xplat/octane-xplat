# @octane-xplat/nano-icons

Compile icon sets to a real font — one glyph per color layer — and render them on web,
iOS, Android, and experimental AppKit macOS with stacked font-glyph spans/labels. The
pipeline and runtime model are adapted from
[react-native-nano-icons](https://github.com/software-mansion-labs/react-native-nano-icons)
(MIT, © Software Mansion): a build turns SVG files into a hashed `.ttf` (plus `.woff2` for
web), a typed glyph map, and a bound icon component — at runtime there is no SVG parsing,
just text drawing. See [Licenses and upstream credit](#licenses-and-upstream-credit).

Reach for this package when a screen repeats icons and the artwork is a static, flat
shape set — the font wins on repeated-instance cost and multicolor layering. For
arbitrary SVG fidelity (gradients, filters, `<defs>` paint servers) keep using
[`@octane-xplat/icons`](../icons).

## Quick start

Generate a font set from a directory of SVGs:

```sh
pnpm add @octane-xplat/nano-icons

# writes src/icons-font/MyIcons.ttf/.woff2/.glyphmap.json/MyIcons.ts
pnpm exec nano-icons build --input assets/icons --out src/icons-font --family MyIcons --web
```

Every artifact is content-hashed into the family (`MyIcons-<hash>`), so regenerated sets
never collide with a stale file. The generated `.ts` module registers the set on import —
drop it into your app and use its bound component or the unbound `NanoIcon`:

```tsx
import { MyIcons, NanoIcon as MyIcon } from './icons-font/MyIcons'

export function NextAction() {
	return (
		<>
			<MyIcon name="arrow-right" size={24} color="#2563eb" label="Next" />
			<MyIcons.Icon name="check" size={20} />
		</>
	)
}
```

Or keep using the registry-resolving component — after any `createNanoIconSet` ran,
`NanoIcon` finds names across registered sets:

```tsx
import { NanoIcon } from '@octane-xplat/nano-icons'
import './icons-font/MyIcons' // registers on import

export function Row() {
	return <NanoIcon name="bell" size={24} />
}
```

## Wiring the font file per platform

`createNanoIconSet(glyphMap, { font })` takes a `NanoFontSource`; the generated module
fills in the defaults so the common path needs no extra work:

| Platform | Source used                | What you must do                                                                                                                       |
| -------- | -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Web      | `font.url` (→ `FontFace`)  | Nothing if you import the generated `.ts` — the `.woff2` beside it is loaded lazily.                                                   |
| iOS      | `font.fileName`            | Copy `<family>.ttf` into your app's `app/fonts` (the CLI's `--app-fonts` writes it there). iOS registers it at startup.                |
| Android  | `font.fileName`            | Same `app/fonts` copy — Android resolves `app/fonts/<family>.ttf`. The TTF must ship with the app; there is no runtime injection hook. |
| macOS    | `font.path` or `font.data` | Register bytes or a file path — `registerNanoIconFont` runs `CTFontManagerCreateFontDescriptorsFromURL` + `registerFontFamily`.        |

Web apps that already emit their own `@font-face` can omit `font` entirely —
`registerNanoIconFont` checks `document.fonts` first and resolves `'ready'`.
`set.ready` is a `Promise<'ready' | 'missing' | 'unavailable'>` you can await (tests) or
surface in error reporting; a missing font still renders the container so failures stay
visible without crashing the tree.

## Input sources

`buildNanoIconFont` accepts a directory (`inputDir`), explicit `{ name, svg }` inputs, or
an Iconify collection — names become `<prefix>:<name>`, matching `Icon`/`NanoIcon` naming:

```ts
import { buildNanoIconFont, iconifyCollectionToSvgs } from '@octane-xplat/nano-icons/build'
import heroicons from '@iconify-json/heroicons/icons.json' with { type: 'json' }

await buildNanoIconFont({
	inputs: iconifyCollectionToSvgs(heroicons),
	outputDir: 'src/icons-font',
	fontFamily: 'HeroIcons',
	web: true,
})
```

For several sets or repeatable builds, put `.nanoicons.json` at the package root and run
`nano-icons build` with no flags:

```json
{
	"iconSets": [
		{
			"inputDir": "assets/icons",
			"fontFamily": "MyIcons",
			"outputDir": "src/icons-font",
			"appFontsDir": "app/fonts"
		}
	]
}
```

## Colors and sizing

A glyph's layers stack in one layout cell: each entry in
`name → [advanceWidth, [[codepoint, sourceColor], ...]]` becomes one text element in the
family, drawn top-to-bottom in source order. `color` tints by `tintMode`:

```tsx
<MyIcon name="bell" color="#e11d48" />                       // tintMode 'currentColor' (default):
															// only currentColor layers tint
<MyIcon name="bell" color="#e11d48" tintMode="all" />        // every layer tinted
<MyIcon name="bell" color={['#f59e0b', '#1d4ed8']}           // palette applies per
	tintMode="all" />                                        // tintable-layer position
```

Without `color`, source fills render as authored; `currentColor` layers fall back to the
platform text color. `size` sets height; width is `advanceWidth / unitsPerEm × size` (a
wide icon stays wide). `rotate`, `hFlip`, `vFlip` transform the stacked container, not the
glyphs — the font is never re-generated for orientation variants.

```tsx
<NanoIcon name="check" size={20} rotate={1} hFlip label="Done" />
```

## Unsupported SVG input

Only solid-color painted vector geometry survives font compilation. The build is strict —
rather than silently rasterizing or dropping artwork it fails or skips with a reason:

- **Rejected (build fails, file named):** paint-server fills/strokes (`url(#…)` —
  gradients, patterns), malformed path data.
- **Skipped (warned):** `<mask>`, `<filter>`, `<image>`, empty or fully transparent
  layers, missing viewBox/geometry.
- **Flattened in:** transforms and `rotate()`/`scale()`/`translate()`, `<use>`,
  `<symbol>`, clipping, `stroke` → outline conversion, `fill-rule="evenodd"` holes
  (converted to nonzero winding), opacity folded into the layer color.

If your set needs gradients or filters, keep those icons in `@octane-xplat/icons` and use
`Icon` for them — the packages coexist.

## Migration from the SVG adapter

The previous `@octane-xplat/nano-icons` was a caching wrapper over SVG rendering. If you
used `NanoIcon` with `addCollection` names:

- Names and props survive. `NanoIcon` still takes `name`, `size`, `color`, `rotate`,
  `hFlip`/`vFlip`, `id`, `className`, `label`, and the per-platform bags — but `name` is
  now resolved against generated font sets, not Iconify collections. Run the build over
  the same SVGs and update names if you change the namespace (Iconify sources keep their
  `prefix:name` shape).
- `color` now accepts `string | string[]` and there's a new `tintMode`; single-color
  strings tint exactly as before.
- `prepareNanoIcon`/`materializeNanoIcon`/`PreparedNanoIcon`/`IconSvg` are gone —
  geometry is baked into the font, so there is nothing to cache per-instance. The
  `@octane-xplat/icons` `addCollection`/`resolveIcon` registry is no longer consulted.
- The TTF/WOFF2 and glyph map are generated assets — commit them like other generated
  sources, and copy the TTF into `app/fonts` for iOS/Android.

## Programmatic API

```ts
import {
	buildNanoIconFont, // Node: run the pipeline
	iconifyCollectionToSvgs, // Node: Iconify collection → svg inputs
	type NanoIconFontOptions, // inputDir/inputs, outputDir, fontFamily, web, appFontsDir…
} from '@octane-xplat/nano-icons/build'
import {
	NanoIcon, // registry-resolving component
	createNanoIconSet, // bind a glyph map (+ font source) to a set
	registerNanoIconFont, // platform registration primitive
	resolveNanoIcon, // name → { set, entry } lookup
	type NanoIconProps,
	NanoIconSet,
	NanoGlyphMap,
	NanoFontSource,
} from '@octane-xplat/nano-icons'
```

The `./build` subpath is Node-only and kept out of runtime bundles; the platform entries
contain no Node code. `NanoIcon`'s props contract is unchanged on the shared surface; the
platform bags (`ios`, `android`, `macos`, `web`) still reach the underlying host view.

## Verification

Package checks:

```sh
pnpm --filter @octane-xplat/nano-icons build
pnpm --filter @octane-xplat/nano-icons typecheck
pnpm --filter @octane-xplat/nano-icons test
pnpm --filter @octane-xplat/nano-icons pack:check
```

Maintained probes (nonvisual: font registration, layer structure, sizing, tint):

```sh
pnpm probe doctor
pnpm probe run examples/probes/nano-icons.tsrx --target web --deps @octane-xplat/nano-icons
pnpm probe run examples/probes/nano-icons.tsrx --target ios --device SIMULATOR_UDID --deps @octane-xplat/nano-icons
pnpm probe run examples/probes/nano-icons.macos.tsrx --target macos --deps @octane-xplat/nano-icons
```

Host/source assertions are not pixel parity or OS accessibility traversal evidence — run
the probe on every target you ship.

## Licenses and upstream credit

This package is MIT, like the rest of Octane Xplat. The geometry pipeline in
`src/build/core` and the glyph-map/runtime model are ported or adapted from
[react-native-nano-icons](https://github.com/software-mansion-labs/react-native-nano-icons)
@ `3ffd367` — MIT, © Software Mansion. Third-party engine dependencies carry their own
licenses; see [LICENSES.md](./LICENSES.md) for the full attribution text.

Icon sets retain their own licenses exactly as with `@octane-xplat/icons`; check each
set's `info.json` and license files before bundling.
