# NativeScript renderer

> The owned NativeScript renderer and how to replace upstream imports.

`@octane-xplat/nativescript-octane` is the source-owned renderer used by Octane Xplat on iOS and Android. It is maintained in this monorepo, with attribution to the original NativeScript Octane project. Most apps get it through the [app creator](package-create.md); keep the creator's native build configuration and shared JSX types.

For a custom native bootstrap with the Octane Xplat native preset already configured, mount your compiled app into a NativeScript host:

```ts
// src/main.ts
import { Application, RootLayout } from '@nativescript/core'
import { renderNativeScriptApp } from '@octane-xplat/nativescript-octane'
import { App } from './App.tsrx'

Application.run({
  create() {
    const host = new RootLayout()
    renderNativeScriptApp(host, App)
    return host
  },
})
```

This package belongs to the framework's lockstep release. Replace direct imports of `@nativescript-community/octane` with `@octane-xplat/nativescript-octane`, including subpaths. The former renderer patch is included in the source; remove its old patch registration. Use the [shared JSX contract](package-jsx.md) for app typing and the [native build preset](package-build.md) to select the app's Mason engine. Mobile apps use Mason core; full MasonKit remains an optional peer for the Windows preview.

See the [generated API reference](https://octane-xplat.goddardai.org/api-nativescript-octane) for the low-level driver contract. Source and unit checks do not establish device behavior or expand the framework's platform support.
