# `@octane-xplat/bamboo`

> Bamboo CSS integration defaults for Octane xplat apps

Shared [Bamboo](https://github.com/aleclarson/bamboo) CSS defaults for
Octane xplat apps. `xplatBambooConfig` scopes generation to the CSS subset
both NativeScript and browsers support (`xplatPortablePreset` and the
`vx-*` utility classes on framework token variables) and orders layers so
utilities sit under the app's own CSS. A Vite plugin emits the stylesheet.

```sh
bun add -D @octane-xplat/bamboo @bamboocss/dev
```

Two entry points:

```ts
// bamboo.config.ts
import { defineConfig } from '@bamboocss/dev'
import { xplatBambooConfig } from '@octane-xplat/bamboo'

export default defineConfig({
  ...xplatBambooConfig,
  include: ['src/**/*.{ts,tsx}'],
  outdir: 'src/styled-system',
})
```

Token names mirror the UI theme variables: every `--color-*`, `--radius-*`,
and `--space-*` the default theme in `@octane-xplat/ui/theme/chrome.css`
declares is a valid token, compiled to its variable (`warning` →
`var(--color-warning)`). A token only resolves when that stylesheet is
imported or the app defines the variable itself.

For TSRX templates, keep `css()` calls in a `.ts` style module and import its
class strings. Bamboo's standalone source scanner does not parse TSRX `@{}`
templates; this configuration scans `.ts` and `.tsx` files.

```ts
// src/styles.ts
import { css } from './styled-system/css'

export const warningText = css({ color: 'warning' }) // Uses --color-warning
```

Preflight is off by default and tokens land on `:root, .ns-root`. The
xplat NativeScript CSS transform unwraps the emitted `@layer` blocks for
native builds (the NS parser drops unknown at-rules); browsers keep the
layers, which is what lets app CSS stay unlayered on top.

```ts
// Add this plugin alongside your app's existing renderer plugins.
import { bamboo } from '@octane-xplat/bamboo/vite'

const webPlugins = bamboo()
const nativePlugins = bamboo({ native: true })
```

`native: true` covers NativeScript (iOS/Android), the AppKit renderer, and
the GTK renderer — both desktop presets consume the same finalized
`virtual:bamboo.css` asset through `inlineStylesheets`.

Platform conditions use the same build-time compiler as ordinary CSS. Add
`css('web')` from `@octane-xplat/cli/vite` to web plugins; native presets
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

Guide: [Styling screens](https://octane-xplat.goddardai.org/styling).


[Generated API reference](https://octane-xplat.goddardai.org/api-bamboo).

## Custom builders with unused environments

A Vite environment is a named build target. Some Cloudflare setups configure
`ssr` but only build a Worker and a browser client. With Bamboo 1.56.2, pass
`buildEnvironments` containing every target your builder actually runs to avoid
an incorrect incomplete-run warning. Use your Worker's environment name:

```ts
import { bamboo } from '@octane-xplat/bamboo/vite'

const plugins = bamboo({
  buildEnvironments: ['api', 'client'],
})
```

Keep real server-rendering targets in the list, even when they emit no CSS
asset: their reachable styles must remain in the browser stylesheet. An
excluded target that starts building causes an error; a listed target that
never completes still triggers Bamboo's warning. Omit the option for builders
that build all configured environments. Pruning stays enabled.

```ts
const plugins = bamboo({ buildEnvironments: ['client', 'ssr'] })
```

This option declares participation; it does not schedule builds. It adapts
Bamboo 1.56.2's environment accounting and requires Vite's environment builder.
Platform conditions with real SSR remain unsupported, as described above.
