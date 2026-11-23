# NativeScript renderer

> The owned NativeScript renderer and how to replace upstream imports.

`@octane-xplat/nativescript-octane` is the shared renderer used by Octane Xplat on iOS, Android, and experimental macOS. It is maintained in this monorepo, with attribution to the original NativeScript Octane project. The [app creator](package-create.md) configures the iOS and Android targets. For a Mac app, follow the [AppKit setup](package-macos-appkit.md#configure-an-app).

For a custom iOS or Android entry point with the native preset already configured, mount your compiled app into a NativeScript host:

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
