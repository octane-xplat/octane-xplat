# Use Bamboo CSS utilities across web and native

ID: bamboo-css
Targets: web, ios, android
Related APIs: `@octane-xplat/bamboo`, `xplatBamboo`, `xplatBambooConfig`, `xplatPortablePreset`, `virtual:bamboo.css`, `className`

## Starting point

The app uses the xplat Vite presets and shares component code across web and
NativeScript. macOS does not load CSS stylesheets. Bamboo `css()` calls stay in
`.ts` modules until the Vite plugin release includes [TSRX](https://tsrx.dev/)
support ([upstream PR](https://github.com/gajus/bamboocss/pull/125)).

## Requirements

- Generate classes from Bamboo calls and apply them through `className` on web,
  iOS, and Android.
- Keep default generated declarations within the portable preset, with no
  browser reset and token variables rooted for NativeScript.
- Allow Bamboo utility rules to override layered `vx-*` component defaults.
- Preserve an app CSS escape hatch and run native CSS diagnostics on generated
  output.

## Acceptance criteria

- AC1: A generated class is available in both web and native builds and can be
  applied with `className`.
- AC2: The default config disables preflight and exposes only the restricted
  xplat utility/token surface; token variables resolve under `:root` and
  `.ns-root`.
- AC3: `vx-*` component rules are in `xplat.components`, Bamboo utilities are
  in the later `xplat.utilities` layer, and unlayered app CSS remains highest.
- AC4: Setup docs explain Vite wiring, CSS import order, `.ts` style calls, and
  the boundary for extending the portable preset.

## Documentation

- AC1: [Styling screens — Use Bamboo CSS utilities](../docs/styling.md#use-bamboo-css-utilities) and the maintained [harness probe](../packages/app/src/bamboo-styles.ts).
- AC2: [Styling screens — Use Bamboo CSS utilities](../docs/styling.md#use-bamboo-css-utilities).
- AC3: [Styling screens — Use Bamboo CSS utilities](../docs/styling.md#use-bamboo-css-utilities).
- AC4: [Styling screens — Use Bamboo CSS utilities](../docs/styling.md#use-bamboo-css-utilities).
