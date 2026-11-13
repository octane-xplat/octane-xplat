# NativeScript Octane build integration

> The owned compiler and hot-update integration for NativeScript apps.

`@octane-xplat/vite-octane` owns the NativeScript Octane compiler configuration and hot-update integration. It is maintained beside the renderer in this monorepo and released with the framework. Apps using the [app creator](package-create.md) already select it through the Octane Xplat native preset.

Keep the framework preset in your app's Vite configuration. It selects the owned flavor and applies the shared JSX, platform-file, CSS, and Mason-engine configuration:

```ts
// vite.config.mts
import { defineConfig } from 'vite'
import { native } from '@octane-xplat/build/vite'

export default defineConfig(async ({ mode }) => native(mode))
```

Existing custom integrations must replace `@nativescript-community/vite-octane` with `@octane-xplat/vite-octane` and remove the old flavor patch registration. Both package names and their subpaths change together with the [renderer](package-nativescript-octane.md). Keep their versions aligned with the framework.

See the [build-plugin guide](package-build.md) for installation and supported setup, and the [generated API reference](https://octane-xplat.goddardai.org/api-vite-octane) for low-level configuration. Device hot reload still depends on the supported NativeScript host and app configuration.
