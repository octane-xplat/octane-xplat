# `@octane-xplat/desktop-webview`

System-WebView host adapters for desktop Octane apps. Currently one entry:
`./macos` attaches a real `WKWebView` to an app-owned AppKit content view
through `@nativescript/macos-node-api`, so a macOS app can render its DOM
frontend in system WebKit while the existing JavaScriptCore + NativeScript
host keeps serving native APIs — no bundled Chromium.

```sh
pnpm add @octane-xplat/desktop-webview
```

```ts
import { createMacOSWebView } from '@octane-xplat/desktop-webview/macos'

const webview = createMacOSWebView(contentView)
webview.installDispatcher((message) => routeToHost(message))
webview.setBootstrap(serializedInitScript)
webview.load(devServerUrl) // or loadPackaged() for the bundled frontend
// host → page messages go through webview.deliver(message)
```

Select this renderer per app with `xplat.targets.macos.renderer:
"webview"`; AppKit remains the default. The frontend resolves `.web`
files inside the webview while the host continues to run macOS-native
code — the two sides exchange JSON messages over the installed
dispatcher/`deliver` pair.

This package is host-side machinery, not an app-facing widget — apps opt
into the renderer through their xplat config rather than importing it
directly. Setup and message-channel details:
[`docs/macos-webview.md`](../../docs/macos-webview.md).
