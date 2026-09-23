# Theme across root boundaries

Measured on iOS (lab): **the theme class never crosses a root boundary;
token VALUES always do.**

- `ns-dark` on the app root is absent inside: pushed `Page` roots, the
  sheet host root, the modal root — each is a separate native view tree.
- `getCssVariable('--color-primary')` returns the identical value
  (`#4f46e5`) in every root — vars live at app stylesheet scope, not class
  scope.

## Consequence for ThemeProvider

A theme class on one root can never reach another. The design that works:

1. Theme **state** lives in a module-scope store (`useSyncExternalStore` —
   the same seam as `lastDemo` in the harness) so every root subscribes to
   the same value.
2. **Every root applies `ns-dark` to its own root view** — the app shell,
   each pushed `Page`'s top-level component, sheet host content, modal
   content.
3. System scheme is per-process (`useColorScheme` reads it anywhere) — the
   store only needs to carry the manual override.

On web this is free (pushed routes render in the same DOM tree — the root
class inherits); the rule only bites on native, but write it uniformly:
each screen/root component takes `className` including the theme class
rather than relying on ancestor inheritance.

## What NOT to do

- Don't set the class on `getRootLayout()` expecting it to theme children
  roots — RootLayout hosts views; pushed pages/sheets are separate trees.
- Don't assume `ns-modal`/modal roots inherit — verified absent.
