### Let the build command choose the Vite setup

**Breaking change**

In a standard app, use `defineConfig` from `octane-xplat/vite` and keep your app settings in it. The helper adds the framework plugins for the target selected by your command.

```ts
import { defineConfig } from 'octane-xplat/vite'

export default defineConfig({ server: { port: 5200 } })
```

Remove manual framework plugin entries, the `native()` wrapper, and standard platform resolution settings from configs using the helper. Keep Vite's own `defineConfig` and explicit presets for custom compiler and experimental desktop setups.

[Vite setup](https://octane-xplat.goddardai.org/package-toolchain#configure-a-web-app).
