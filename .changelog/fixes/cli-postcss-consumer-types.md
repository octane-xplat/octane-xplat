---
release: lockstep
---

### Typecheck Vite configs with separate PostCSS patches

Importing the CLI's Vite helpers no longer pulls their PostCSS implementation
into your app's typecheck. This fixes excessive comparison stack errors when
Vite and the CLI resolve different compatible PostCSS 8 patches. Your existing
PostCSS options and plugins continue to work.

```ts
import { defineConfig } from 'vite'
import { xplatCss } from '@octane-xplat/cli/vite'

export default defineConfig({
  plugins: [xplatCss('web')],
  css: { postcss: { map: { inline: false }, plugins: [] } },
})
```

[Platform CSS documentation](https://octane-xplat.goddardai.org/styling#style-one-platform)
