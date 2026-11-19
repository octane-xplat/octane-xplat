### Install the NativeScript renderer from Octane Xplat

**Breaking change**

The NativeScript renderer and its Vite integration now ship as `@octane-xplat/nativescript-octane` and `@octane-xplat/vite-octane`. Both include the fixes previously applied as patches.

Apps with direct renderer imports must use the new package name, including subpaths:

```ts
import { registerElement } from '@octane-xplat/nativescript-octane'
```

Replace `@nativescript-community/octane` and `@nativescript-community/vite-octane` in your dependencies and remove their old patch registrations.

[Renderer setup](https://octane-xplat.goddardai.org/package-nativescript-octane) · [Native build integration](https://octane-xplat.goddardai.org/package-vite-octane)
