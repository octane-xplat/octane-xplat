### NativeScript Octane source now lives in the framework

The NativeScript renderer and hot-update integration are maintained directly in this monorepo as `@octane-xplat/nativescript-octane` and `@octane-xplat/vite-octane`. They use our existing build and release toolchain and include the fixes previously shipped as dependency patches.

Apps with direct renderer imports must use the new package name, including subpaths:

```ts
import { registerElement } from '@octane-xplat/nativescript-octane'
```

Replace the two upstream dependencies with the matching framework packages and remove their old patch registrations. New starters already use the owned packages. See the [renderer guide](https://octane-xplat.goddardai.org/package-nativescript-octane) and [native build integration](https://octane-xplat.goddardai.org/package-vite-octane).
