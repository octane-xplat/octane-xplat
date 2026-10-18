# `@octane-xplat/bamboo`

Shared [Bamboo](https://github.com/aleclarson/bamboo) CSS defaults for
Octane xplat apps. `xplatBambooConfig` scopes generation to the CSS subset
both NativeScript and browsers support (`xplatPortablePreset` and the
`vx-*` utility classes on framework token variables) and orders layers so
utilities sit under the app's own CSS. A Vite plugin emits the stylesheet.

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

Platform conditions use the same build-time compiler as ordinary CSS. Add
`xplatCss('web')` from `@octane-xplat/cli/vite` to web plugins; native presets
include it. Keep the portable utility subset unless you explicitly extend it.
SSR generation with platform conditions is currently unsupported.

```ts
import { css } from './styled-system/css'

const card = css({
  padding: '4',
  _web: { color: 'primary' },
  _mobile: { color: 'text' },
})
```

Guide: [Styling screens](../../docs/app/styling.md).
