# Ship a custom font across web and native

ID: custom-fonts
Targets: web, ios, android
Related APIs: `xplat fonts add`, `font-family`, `--font-sans`, `--font-mono`, `font-variation-settings`, `src/fonts`, `fonts.css`

## Starting point

A scaffolded app with `@octane-xplat/cli` installed, a `src/` app path, a
`main.web.tsrx` web entry, and a shared `style.css`. System fonts are the
default; custom faces are opt-in.

## Requirements

- Register one or more `.ttf`/`.otf` files — a variable file or several static
  weights of one family — or an installed Fontsource package, so a single
  family name resolves on web, iOS, and Android without the author inspecting
  font metadata. `.woff`/`.woff2` inputs are decompressed to `.ttf` for the
  native bundles.
- Wire the family onto a `--font-*` token so shared components and app chrome
  pick it up, or opt out and reference the family directly.
- Preserve a variable font's weight axis on each target.
- Keep registration repeatable — re-adding a face updates instead of
  duplicating, and additional faces of a family accumulate.

## Acceptance criteria

- AC1: `xplat fonts add <file>` copies the file into `src/fonts`, writes a
  web-only `@font-face` into `src/fonts.css` imported by the web entry, and
  reports the per-target family names it detected from the file.
- AC2: The generated `style.css` block exposes the family through a
  `--font-*` token rooted at `:root`/`.ns-root`; `--font-sans` additionally
  sets `font-family` on `.ns-root` and `body` so the whole app switches.
- AC3: A variable font keeps its weight range — web `font-weight: min max` in
  `@font-face`, iOS `font-variation-settings` from `font-weight` on `Text`,
  Android `wght` axis mapping on API 26+.
- AC4: Re-running for the same file reports it as already registered rather
  than duplicating the face; adding another file merges into the existing
  token block.
- AC5: `.woff`/`.woff2` files and `@fontsource`/`@fontsource-variable` package
  specs are accepted; web keeps the package's own CSS via `@import` (local
  files get a local `@font-face`) while native receives a converted `.ttf`
  whose embedded family/PostScript names and `wght` range survive intact.

## Documentation

- AC1: [Styling screens — Font-family tokens](../docs/styling.md#font-family-tokens).
- AC2: [Styling screens — Font-family tokens](../docs/styling.md#font-family-tokens).
- AC3: [Styling screens — Font-family tokens](../docs/styling.md#font-family-tokens).
- AC4: [Styling screens — Font-family tokens](../docs/styling.md#font-family-tokens);
  merge and idempotency behavior is covered by `packages/cli/test/fonts.test.mjs`.
- AC5: [Styling screens — Font-family tokens](../docs/styling.md#font-family-tokens);
  conversion preserves name metadata per `packages/cli/test/fonts.test.mjs`
  (`woff2ToSfnt`, real `@fontsource-variable/inter` fixture).
