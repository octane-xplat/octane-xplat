# Styling

Two channels, chosen by *when the value is known*:

- `className` → CSS classes and design tokens. Use for anything static.
- `style={{ ... }}` → inline object for runtime values: animated offsets,
  measured sizes, state-driven opacity. Don't put static styles here.

## The portable subset

Shared CSS compiles for both targets. The native build rewrites `px` →
`dip` and warns on declarations it can't honor — `position: fixed`/`sticky`,
`margin-*: auto`, `float`, `box-shadow`, `white-space: pre-wrap`. A warning
means the property does nothing on native: restructure (flex alignment,
`Absolute`, transforms) instead of suppressing it.

NativeScript limits worth knowing before you design around them:

- A scroll container can't clip children to a parent's rounded corners —
  inset separators/padding instead.
- CSS transforms reach native views only through the `transform:`
  shorthand — `transform: translateX(16) scaleX(0.95)`. For motion, prefer
  `useAnimation`, which composes this per platform.

## Tokens and dark mode

`import '@octane-xplat/ui/theme/tokens.css'` (already in `main.web.tsrx`)
provides color/spacing tokens and `--font-sans`/`--font-mono` fallbacks.
The shipped utility classes (`flex-1`, `items-center`, `gap-*`, `rounded`,
`text-*`, …) mirror Tailwind v4 names and scales — write them as you would
Tailwind utilities.

Dark mode: `useColorScheme()` reads the system; the app's override pattern
is in `src/App.tsrx` — hold `boolean | null` state, apply a `dark`/`light`
class on the root, and let tokens switch underneath.

## Fonts

Family names differ per target (web face name, iOS PostScript name,
Android filename). Ship the font file in the app, register per platform,
and set the `--font-*` tokens in `style.css`. See the styling guide at
https://octane-xplat.goddardai.org/styling for the per-target table.
