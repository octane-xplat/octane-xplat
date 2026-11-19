### Shorter names for Vite plugins

Vite plugins and platform presets have shorter names, including `css()`, `boundary()`, and `native()`. Existing `xplat`-prefixed imports still work. Use the shorter names in manually configured Vite setups.

```ts
import { css, boundary } from '@octane-xplat/build/vite'

const platformPlugins = [css('web'), boundary('web')]
```

See [build plugin setup](https://octane-xplat.goddardai.org/package-build) for configuration examples.
