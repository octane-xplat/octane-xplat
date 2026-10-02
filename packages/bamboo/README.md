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
// bamboo.config.ts
import { defineConfig } from '@bamboocss/dev'
import { xplatBambooConfig } from '@octane-xplat/bamboo'

export default defineConfig({
	...xplatBambooConfig,
	include: ['src/**/*.ts'],
	outdir: 'src/styled',
})
```

Preflight is off by default and tokens land on `:root, .ns-root`. The
xplat NativeScript CSS transform unwraps the emitted `@layer` blocks for
native builds (the NS parser drops unknown at-rules); browsers keep the
layers, which is what lets app CSS stay unlayered on top.

```ts
// Add this plugin alongside your app's existing renderer plugins.
import { xplatBamboo } from '@octane-xplat/bamboo/vite'

const webPlugins = xplatBamboo()
const nativePlugins = xplatBamboo({ native: true })
```

Guide: [Styling screens](../../docs/styling.md).
