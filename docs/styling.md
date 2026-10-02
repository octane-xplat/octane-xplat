# Styling screens

> Change colors, spacing, fonts, and layout with styles that work on the web
> and phones.

**CSS** is how you describe appearance: colors, spacing, borders, and text
sizes. A **class** groups those choices under a name such as `card` so you
can reuse them. The starter's `src/style.css` is a place to put app styles.

If you're using an agent, describe the result: “Keep this screen readable
on a phone, with space between the buttons and a larger title.” The same
shared styles can serve web, iOS, and Android. Use
[platform files](module-resolution.md) when a layout needs to differ.
The experimental macOS AppKit renderer supports a smaller set of named
styles; see its [current limits](../apps/macos/README.md).

## The everyday rule

Use `className` to apply CSS classes to a component. Use `style` for a
value calculated while the app runs, such as dimming a disabled card.
The following component can go in a `.tsrx` file. Its `title` and `disabled`
props are options supplied by the screen using it.

```tsx
import { View, Text } from '@octane-xplat/ui'

export function Card(props: { title: string; disabled?: boolean }) {
	return (
		<View className="card" style={{ opacity: props.disabled ? 0.5 : 1 }}>
			<Text className="card-title">{props.title}</Text>
		</View>
	)
}
```

Add `.card { padding: 16px; }` and `.card-title { font-size: 20px; }` to
`src/style.css`, then use `<Card title="Packing list" />` inside your screen.
The title should be larger than ordinary text, with space around it.
`disabled={true}` dims the whole card.

- `className` is for layout, colors, fonts, borders, and other stable
  choices.
- `style` is for runtime values such as an animated position or a measured
  size.
- Shared styles must use properties supported by both targets.

## Required structure and optional chrome

Xplat has two stylesheets. `tokens.css` provides layout rules the components
need; `chrome.css` adds optional default colors, borders, and fonts. “Chrome”
means that visible decoration. The starter already imports `tokens.css`.

Import `@octane-xplat/ui/theme/tokens.css` in every web and native app. It
provides shared layout classes and browser normalization inside the low-priority
`xplat-structure` layer, so component geometry works without imposing a visual
theme.

`@octane-xplat/ui/theme/chrome.css` is optional. It adds the package's default
colors, borders, typography, and control states in `xplat-chrome`, above the
structure layer. The starter template imports only `tokens.css`; demo and probe
apps import both. On the web, unlayered app CSS overrides both layers, and app
layers declared after these imports override the package layers. NativeScript
does not support cascade layers; the CLI unwraps them and preserves import
order, so keep app styles after these imports on native too.

Import stylesheets as JavaScript modules, in this order:

```ts
import '@octane-xplat/ui/theme/tokens.css'
import '@octane-xplat/ui/theme/chrome.css' // optional
import './app.css'
```

Avoid CSS `@import`: it bypasses the native preset's px-to-DIP rewrite and
web-only stripping.

## Define app tokens

A **token** is a named style value. For example, `--color-surface` can name
the background color you use on cards. Changing it updates every style that
uses that name, so you don't have to find and replace the color in each card.

Add these rules to your app stylesheet. `:root` selects the browser root;
`.ns-root` selects the NativeScript root. Using both lets the variables apply
on web and phones.

```css
:root,
.ns-root {
	--color-surface: #fffdf5;
	--color-ink: #000;
	--space-4: 16px;
}

.card {
	background: var(--color-surface);
	color: var(--color-ink);
	padding: var(--space-4);
}
```

If the app omits `chrome.css`, define any color or type variables its own
stylesheet uses. Use the starter's [web entry](../packages/create/template/src/main.web.tsrx)
and [native entry](../packages/create/template/src/main.ts) as the baseline
setup. Change `--color-surface` and check the card background on both targets;
a native card that stays unchanged suggests a missing entry import or root
selector.

## Use Bamboo CSS utilities

This is optional; you can keep writing ordinary CSS. **Utilities** are small
classes for individual choices such as padding or text color. Bamboo generates
those classes from your code.

[`@octane-xplat/bamboo`](../packages/bamboo/) provides a restricted Bamboo
preset for shared web/iOS/Android styles. It disables browser preflight, puts
generated variables under `:root, .ns-root`, and includes only portable
colors, spacing, radii, flex, sizing, border, and typography utilities by
default. The full Bamboo browser preset can add CSS that NativeScript does not
support; extend the preset only after checking the properties on every target.

Install `@octane-xplat/bamboo` and `@bamboocss/dev`, then create
`bamboo.config.ts`:

```ts
import { defineConfig } from '@bamboocss/dev'
import { xplatBambooConfig } from '@octane-xplat/bamboo'

export default defineConfig({
	...xplatBambooConfig,
	include: ['src/**/*.{ts,tsx,js,jsx}'],
})
```

Add `xplatBamboo()` from `@octane-xplat/bamboo/vite` to the web Vite plugins
and to `xplatNative(mode, { extra: { plugins: [...] } })`. Import
`virtual:bamboo.css` immediately after the UI token stylesheet in both app
entries. The UI stylesheet declares the shared cascade order and places
`vx-*` component rules in `xplat.components`; generated Bamboo utilities use
the later `xplat.utilities` layer, so they can override component defaults.
Unlayered app CSS still takes precedence over both.

Bamboo's Vite transform currently supports `.ts`, `.tsx`, `.js`, and `.jsx`;
keep `css()` calls in a `.ts` module and import the resulting class into `.tsrx`
until upstream [TSRX support](https://github.com/gajus/bamboocss/pull/125) is
released. [TSRX](https://tsrx.dev/) is a framework-agnostic TypeScript
language extension, not an Octane-specific module format.

The harness configuration and [generated utility probe](../packages/app/src/bamboo-styles.ts)
show the complete wiring. Native builds still run the xplat CSS checks, but
arbitrary custom CSS declarations are not rewritten into supported ones; use
the portable preset and review any warnings before extending it.

## Font-family tokens

`chrome.css` provides `--font-sans` and `--font-mono` as portable fallback
lists; apps that omit it can define those variables themselves. The framework
cannot derive one family name from a font file: the web face name, the iOS name,
and the Android name are different identifiers. Apps own the registration and
override the token at the stylesheet boundary.

`xplat fonts add` is the turnkey path — run it from the app root with one
variable file, several static weights of a family, or a Fontsource package:

```sh
pnpm xplat fonts add path/to/AcmeSans-Variable.ttf           # --font-sans
pnpm xplat fonts add path/to/JetBrainsMono.ttf --token mono  # --font-mono
pnpm xplat fonts add ./downloads/inter-latin-wght.woff2      # woff/woff2 are converted to ttf
pnpm xplat fonts add @fontsource-variable/inter --install    # Fontsource package
pnpm xplat fonts add @fontsource/roboto --weights 400,700    # static family, chosen weights
```

It reads the font's own metadata (family, PostScript name, `fvar` weight range),
stages a `.ttf` in `src/fonts` — `.woff`/`.woff2` inputs are decompressed since
NativeScript registers only `.ttf`/`.otf` — writes the web `@font-face` into
`src/fonts.css` (imported from `main.web.tsrx`), and upserts a marked token
block in `style.css`: `--font-sans`/`--font-mono`/custom under
`:root, .ns-root`, plus a literal `font-family` on `.ns-root` and `body` for
`--font-sans`. Pass `--token none` to register files without wiring a token.
Options: `--name` (override the detected family), `--dir` (app root).

[Fontsource](https://fontsource.org) publishes free fonts — most of Google
Fonts and more — as npm packages: `@fontsource/<family>` for static families
and `@fontsource-variable/<family>` for variable ones. A Fontsource package
must be installed in the app (`--install` runs `pnpm add` when missing). The
web side imports the package's own CSS in `fonts.css` (Fontsource already ships
per-subset `@font-face` with `unicode-range`); the package's font files are
converted and staged under `src/fonts` for iOS/Android. Variable packages pick
the `wght` face; static packages take every weight in `--subset` (default
`latin`) unless narrowed by `--weights`. Android resolves `font-family` by
filename, so multi-weight static adds also emit weight-scoped `font-*` class
rules pointing at each file.

Variable fonts are supported on every target: web gets the `font-weight: min max`
range, iOS resolves `font-weight` through `font-variation-settings`, and Android
maps `font-weight` to the `wght` axis on API 26+ (older APIs load the file's
default instance).

What the command writes, by hand:

| Target  | Register the font                                                                | Token value                          |
| ------- | -------------------------------------------------------------------------------- | ------------------------------------ |
| Web     | `@font-face { font-family: 'Acme Sans'; src: ... }`, or use an installed family  | `'Acme Sans', system-ui, sans-serif` |
| iOS     | Ship the file in the app fonts directory; use its internal/PostScript font name  | `'AcmeSans-Regular', sans-serif`     |
| Android | Ship the file in the app fonts directory; use the filename without `.ttf`/`.otf` | `'acme-sans-regular', sans-serif`    |

For a bundled face with different file and internal names, put both native
names in the platform-specific family list. NativeScript's `ns fonts` command
can print the CSS names for a font directory. Keep the token name (`--font-sans`)
stable in shared components; only the registered family value changes per
target. See the [NativeScript fonts guide](https://beta.docs.nativescript.org/project-structure/src/fonts).

### AppKit fonts

The experimental macOS renderer uses Apple's system font by default, with the
requested size and weight. `system-ui`, `-apple-system`, and `sans-serif`
explicitly select it. Missing custom families fall back to the system font;
applications do not need to ship Geist.

Applications own custom font files and licenses. For app-owned native font
descriptors, call `registerFontFamily` before rendering and select the family
with a `fontFamily` style or the root's `fontFamily` option. The registry maps
CSS weights to native faces; registering a family does not change the default.
Installed AppKit families can also be selected by name.

The macOS harness's [font setup](../apps/macos/src/fonts.mjs) loads its own
Geist assets and license, registers weighted descriptors, and explicitly sets
`fontFamily: 'Geist'` on its roots. Renderer-hosted popups and sheets inherit
the owning root's default family. Custom assets must also be included in a
packaged app; the harness embeds its font bytes and license in the host bundle.

## Check layouts at different sizes

Flex layouts are the safest common starting point. Prefer `HStack`, `View`, and
spacing classes over target-specific positioning. Check a screen at a narrow
browser width and on a native device before adding a platform split.

## Wrap text on native

NativeScript uses `white-space: wrap` to let `Text`/`Label` content flow onto
multiple lines. It rejects the web value `pre-wrap`. If web also needs
`pre-wrap` to preserve whitespace, set the values in platform-specific styles:
use `pre-wrap` on web and `wrap` on native. Native `wrap` enables line
wrapping, but does not preserve repeated spaces and newlines like web
`pre-wrap`.

## Tailwind and native

Do not add `tailwindcss`/`@nativescript/tailwind` to an app. The native
plugin currently diverges from web Tailwind in ways that fail silently
(blocked upstream:
[NativeScript/tailwind#226](https://github.com/NativeScript/tailwind/issues/226)).
For utility classes across web and NativeScript, use the restricted
[Bamboo integration](#use-bamboo-css-utilities) and keep its declarations in
the shared CSS subset.

For theme propagation, supported CSS differences, and the cases where a
platform leaf is necessary, see the [styling notes](styling-notes.md) and the
[CSS support notes](css-support-notes.md).
