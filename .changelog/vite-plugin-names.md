### Shorter names for Vite plugins

Vite plugins and platform presets now have shorter exports: `bamboo()`, `icons()`, `workshop()`, `css()`, `boundary()`, `tsrx()`, `devBridge()`, `native()`, `macos()` and `linuxGtk()`. Existing `xplat`-prefixed exports remain available as compatibility aliases. Package import paths and plugin behavior are unchanged.

For example, web configurations can use these factories alongside their existing renderer plugins:

```ts
import { css, boundary } from '@octane-xplat/build/vite'

const platformPlugins = [css('web'), boundary('web')]
```

See [build plugin setup](https://octane-xplat.goddardai.org/package-build) for configuration examples.
