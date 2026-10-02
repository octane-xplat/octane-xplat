# `@octane-xplat/desktop-webview`

```sh
pnpm add @octane-xplat/desktop-webview
```

System-WebView host adapters for desktop Octane apps. Currently one entry:
`./macos` attaches a real `WKWebView` to an app-owned AppKit content view
through `@nativescript/macos-node-api`, so a macOS app can render its DOM
frontend in system WebKit while the existing JavaScriptCore + NativeScript
host keeps serving native APIs — no bundled Chromium.

```ts
import { createMacOSWebView } from '@octane-xplat/desktop-webview/macos'

// The host owns contentView and implements the typed bridge dispatcher.
export function attachFrontend(contentView: object, routeToHost: (message: string) => void) {
	const webview = createMacOSWebView(contentView)
	webview.installDispatcher(routeToHost)
	webview.setBootstrap('globalThis.tripApp = true')
	webview.load('http://localhost:5200')
	return webview
}
```

Select this renderer per app with `xplat.targets.macos.renderer:
"webview"`; AppKit remains the default. The frontend resolves `.web`
files inside the webview while the host continues to run macOS-native
code — the two sides exchange JSON messages over the installed
dispatcher/`deliver` pair.

```ts
// Host code: attachFrontend above returns the bridge-backed webview.
const reply = JSON.stringify({ type: 'event', name: 'app.state', payload: 'active' })
// Call with the webview returned by attachFrontend when the host emits an event.
export function deliverReply(webview: ReturnType<typeof attachFrontend>) {
	webview.deliver(reply)
}
```

This package is host-side machinery, not an app-facing widget — apps opt
into the renderer through their xplat config rather than importing it
directly. Setup and message-channel details:
[`docs/macos-webview.md`](../../docs/macos-webview.md).
