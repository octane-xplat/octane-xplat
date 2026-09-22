# Tamagui

> Universal UI kit for RN + web from the One team. The interesting parts for us
> are its *API shapes*, not its implementation (which exists because RN has no
> CSS — a constraint we don't have on the NS side).

## What it does

- `styled(Base, { variants: {…}, defaultVariants: {…} })` — variant-driven
  component factories, type-safe, composable.
- Style props directly on primitives: `<Stack p="$4" bg="$background">`.
- Design tokens (`$sm`, `$background`, `$space.4`) compiled from a shared theme
  object; themes nest and can be driven by context (`<Theme name="dark">`).
- An optimizing compiler that hoists static styles to CSS/RN StyleSheet and
  extracts constant parts — keeps runtime cost near zero.
- Media queries + pseudo states (`hoverStyle`, `pressStyle`, `focusStyle`) as
  props.

## What transfers to Octane+NS

| Tamagui idea | Our adaptation |
|---|---|
| `styled()` + variants | Worth stealing as the component-authoring API over our primitives — `variant` props map to className composition (clsx already built into Octane) or style objects |
| Token-driven theme | Keep tokens in **CSS custom properties** — NS supports `var()`/`--x` scoped per subtree (`.ns-root`, `.ns-dark`), so tokens can be one shared source feeding both pipelines |
| Style props | Only as sugar that lowers to `className`/`style`; do NOT build a runtime style engine — we have real CSS on both targets |
| `pressStyle`-style state props | Map to CSS states where they exist (`:active` web; `:highlighted`/TouchManager native) — verify NS pseudo coverage |
| Media-query props | `matchMedia` exists on both — shared `useMedia()` hook is feasible |

## What doesn't transfer

- The optimizing compiler's raison d'être. Tamagui extracts static styles
  because RN style objects are runtime values. For us, static styles should be
  authored in shared CSS/Tailwind utilities; Octane's compiler already treats
  static props as plan constants.
- Full CSS-in-JS expressiveness as the primary styling mode. NS CSS is a
  subset — any shared style-object system still has to lower to NS-compatible
  properties. Keep objects for *dynamic* values only (Flutter-style), CSS for
  everything static.

## Takeaway

Steal the **authoring API** (`styled`, variants, token references, state
props); keep the **implementation** boring: CSS classes + `view.style` objects.
See `docs/styling.md`.
