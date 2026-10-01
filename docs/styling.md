# Styling screens

> Put reusable appearance in CSS classes and tokens; use inline style values
> only when the value changes while the app runs.

Give your agent the outcome, not the CSS: “Keep this screen readable at phone
widths and use the app's colors and spacing.” Start with shared classes and
tokens, then use [platform variants](module-resolution.md) for a layout that
needs to differ. The CSS guidance here covers web and NativeScript mobile;
the [experimental AppKit renderer](../apps/macos/README.md) supports a curated
set of tokens rather than loading CSS stylesheets.

## The everyday rule

The component fragment below uses `View` and `Text` from `@octane-xplat/ui`.
Its `card` and `card-title` classes belong to the app stylesheet.

```tsx
function Card(props: { title: string; disabled?: boolean }) {
	return (
		<View className="card">
			<Text className="card-title">{props.title}</Text>
			<View style={{ opacity: props.disabled ? 0.5 : 1 }} />
		</View>
	)
}
```

- `className` is for layout, colors, typography, borders, and other stable
  choices.
- `style` is for runtime values such as an animated position or a measured
  size.
- Shared styles must use properties supported by both targets.

## Build a small token layer

Keep colors, spacing, and type sizes in tokens instead of repeating raw values
through every component. A theme can then change the whole app without
rewriting screens.

```css
:root, .ns-root {
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

Import each shared stylesheet from the app's web and native entries as a
JavaScript module, after `@octane-xplat/ui/theme/tokens.css`. Use the starter's
[web entry](../packages/create/template/src/main.web.tsrx) and
[native entry](../packages/create/template/src/index.ts) as the setup example.
Avoid CSS `@import`: it bypasses the native preset's px-to-DIP rewrite and
web-only stripping. Change `--color-surface` and check the card background
on both targets; a native card that stays unchanged suggests a missing entry
import or root selector.

## Use Bamboo CSS utilities

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

`packages/ui/src/theme/tokens.css` provides `--font-sans` and `--font-mono`
as portable fallback lists. The framework cannot derive one family name from a
font file: the web face name, the iOS name, and the Android name are different
identifiers. Apps own the registration and override the token at the stylesheet
boundary:

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

## Keep layouts honest

Flex layouts are the safest common starting point. Prefer `Row`, `View`, and
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
