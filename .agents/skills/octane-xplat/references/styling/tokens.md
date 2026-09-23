# Design tokens

`packages/ui/src/theme/tokens.css` — CSS custom properties, imported once
by each app entry (`import '@octane-xplat/ui/theme/tokens.css'`). Published
consumers import the same path (export is exact-file, survives packaging).

## Inventory

Core set (extend as needed, keep both themes):

| Token | Used by |
|---|---|
| `--color-primary` | `bg-primary`, `text-primary` |
| `--color-onprimary` | `text-onprimary` |
| `--color-danger` | `bg-danger` |
| `--color-surface` / `--color-onsurface` | panels, sheet/modal chrome |
| `--color-muted` | secondary text |
| spacing/radius scale | `gap-*`, `p-*`, `rounded-*` utilities |

Dark theme = the same tokens redefined under `.ns-dark`/`.dark` — that's why
the theme class matters per-root on native (see root-boundaries.md).

## The pipeline

1. `tokens.css` declares vars under `:root` (web reads `:root`; NS applies
   them at app stylesheet scope — verified identical values inside pushed
   pages, sheets, modals).
2. Utility classes reference `var(--token)`.
3. NS's CSS engine resolves vars per-view at apply time — `getCssVariable`
   on any view in any root returns the app-level value.
4. Media-query/`.ns-*` hooks re-theme without JS.

## Adding a token

- Define in `tokens.css` under `:root` AND the `.ns-dark`/`.dark` block if
  it should theme.
- Add the consuming utility class in the app's css (not in tokens.css —
  tokens are values, utilities are usage).
- No JS/TS changes needed — vars are runtime-resolved on both targets.
