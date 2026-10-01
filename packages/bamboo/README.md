# `@octane-xplat/bamboo`

Bamboo CSS integration defaults for Octane xplat apps — the glue between
[`@bamboocss`](https://github.com/aleclarson/bamboo) portable utilities
and the framework stylesheet. It exports a preset scoped to the CSS subset
both NativeScript and browsers support (`xplatPortablePreset`, the `vx-*`
utility classes on framework token vars), plus layer ordering that keeps
utilities under the app's own CSS.

```sh
pnpm add -D @octane-xplat/bamboo
```

Two entry points:

```ts
// bamboo.config.ts — ./ or ./config
import { xplatBambooConfig, xplatPortablePreset } from '@octane-xplat/bamboo'

// vite.config.ts — ./vite
import { xplatBamboo } from '@octane-xplat/bamboo/vite'

plugins: [xplatBamboo()] // { native: true } for the native build
```

Preflight is off by default and tokens land on `:root, .ns-root`. The
xplat NativeScript CSS transform unwraps the emitted `@layer` blocks for
native builds (the NS parser drops unknown at-rules); browsers keep the
layers, which is what lets app CSS stay unlayered on top.

Guide: [Styling screens](../../docs/styling.md).
