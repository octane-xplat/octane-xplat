# Design tokens

`packages/ui/src/theme/tokens.css` — CSS custom properties, imported once
by each app entry (`import '@octane-xplat/ui/theme/tokens.css'`). Published
consumers import the same path (export is exact-file, survives packaging).

## Inventory

Core set (extend as needed, keep both themes):

| Token | Used by |
| --- | --- |
| `--color-primary`, `--color-onprimary`, `--color-danger` | `bg-primary`, `text-primary`, `text-onprimary`, `bg-danger` |
| `--color-surface`, `--color-surface-secondary` | panels and sheet surfaces |
| `--color-text`, `--color-text-secondary` | foreground and secondary text (`.text-muted`) |
| `--color-border`, `--color-border-strong` | shared border styles |
| `--space-4`, `--radius-sm` through `--radius-xl` | spacing and rounded-corner utilities |

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

- Define the value in `tokens.css` under `:root` and `.ns-dark`/`.dark` if
  it should theme.
- Add a shared consuming utility beside the other utilities in
  `tokens.css`; keep app-only selectors in `packages/app/src/app.css`.
- No JS/TS changes needed — vars are runtime-resolved on both targets.
