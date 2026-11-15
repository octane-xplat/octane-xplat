### Simpler Vite configuration

**Breaking change:** `defineConfig` from `octane-xplat/vite` now adds the framework compiler, platform CSS, boundary checks, tweaks, and development bridge automatically. The command selects the target, so starter configs only contain app settings.

```ts
import { defineConfig } from 'octane-xplat/vite'

export default defineConfig({ server: { port: 5200 } })
```

Remove manually installed framework plugins, the `native()` wrapper, and standard platform resolution settings when using this helper. Custom compiler and experimental desktop configurations keep Vite's own `defineConfig` and explicit presets. Direct Vite defaults to web; direct NativeScript commands use their selected OS. See the [toolchain setup](https://octane-xplat.goddardai.org/package-toolchain#configure-a-web-app).
