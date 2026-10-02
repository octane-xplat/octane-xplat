# Run a macOS app in WKWebView

> Display your web screens inside an experimental macOS desktop app.

This guide assumes you already have the experimental
[macOS app setup](toolchain.md#experimental-appkit-target). For a first app,
start with [the browser guide](toolchain.md#create-and-run).
**WKWebView** is macOS's built-in view for web content. A **frontend** is
the screen code it displays; the **host** is the native program around it
that provides device features.

The macOS target can render its DOM frontend in the system WKWebView and keep
native services in the existing JavaScriptCore + NativeScript host. Select it
per app with `xplat.targets.macos.renderer: "webview"`; AppKit remains the
default when the setting is absent. The frontend resolves `.web` files, while
the host continues to call macOS APIs through NativeScript. This uses the
system WebKit engine and does not bundle Chromium.

## Configure the renderer

Keep the existing macOS runtime and package identity, and give the frontend
and host separate Vite builds. Paths are relative to the app root:

```json
{
	"xplat": {
		"targets": {
			"macos": {
				"renderer": "webview",
				"runtime": "appkit-node-api",
				"dev": {
					"webViteConfig": "vite.webview.config.mjs",
					"hostViteConfig": "vite.webview-host.config.mjs",
					"hostBundleFile": "dist/webview-host/host.cjs"
				},
				"package": {
					"productName": "Example",
					"bundleIdentifier": "com.example.app",
					"executableName": "Example",
					"version": "1.0.0",
					"minimumSystemVersion": "13.5",
					"webViteConfig": "vite.webview.config.mjs",
					"hostViteConfig": "vite.webview-host.config.mjs",
					"hostBundleFile": "dist/webview-host/host.cjs",
					"webOutDir": "dist/web"
				}
			}
		}
	}
}
```

The web Vite config should use the `web` condition, the `.web` suffix chain,
and `xplatBoundary('web')`, as the [macOS app example](../apps/macos/vite.webview-app.config.mjs)
does. The frontend HTML loads the DOM app entry. The host Vite config bundles
the NativeScript/JavaScriptCore entry as CommonJS and leaves
`@nativescript/macos-node-api` external, following the
[maintained host example](../apps/macos/vite.webview-app-host.config.mjs).

Run `xplat dev --targets macos` to serve the page on a loopback address and
launch the host. Run `xplat build --targets macos` to build the frontend and
host and package an Apple Silicon `.app` and `.dmg`. The package stores the
frontend in `Contents/Resources/web`; the host loads its `index.html` through
the `xplat://app` scheme. The page is served from a trusted local origin in
development. `xplat doctor` validates the selected renderer and its configured
paths. The current host requires macOS 13.5 or later.

## Share typed host services

The host bridge lives at `@octane-xplat/platform/host`. Frontend service
methods, host implementations, and event payloads use the same TypeScript
interfaces. Extend the framework maps for app-defined services:

```ts
import type {
	FrameworkHostEvents,
	FrameworkHostServices,
} from '@octane-xplat/platform/host/services'

export interface AppServices extends FrameworkHostServices {
	account: {
		load(id: string): Promise<{ id: string; name: string } | null>
	}
}

export interface AppEvents extends FrameworkHostEvents {
	'account.changed': { id: string }
}
```

In the frontend, `createHostClient<AppServices, AppEvents>(transport)` types
`call(service, method, ...args)`, `on(event, listener)`, and
`capabilities()`. In the host, register the matching methods with
`createHostDispatcher<AppServices, AppEvents>(services, port)`; use its
`emit()` method to send a typed event. The same pattern works for framework
leaves and application services (Annotation 1). The shared maps are compile-
time contracts only: messages are JSON, and there is no runtime schema
validation. Keep method results and event payloads serializable and handle
rejected calls.

The platform's `.web` adapters use the typed desktop host inside WKWebView:
clipboard, app info, lifecycle, window size, deep links, outbound links, share,
files, notifications, secure storage, and color scheme. They preserve browser
fallbacks outside a desktop host. The synchronous `storage` API remains
`localStorage`; the async `desktopHost().storage` service is available when a
frontend explicitly needs host persistence. Other web APIs remain browser
implementations until a host service is deliberately added. The macOS mediator
is NativeScript in the JavaScriptCore host; the Linux GJS and Windows WebView2
adapters use the same protocol. A future CEF backend would replace the frontend
engine only; it would not standardize the host-side JavaScript runtime
(Annotation 2).

`openUrl(url)` keeps its existing synchronous boolean signature. In a
WKWebView, `true` means the request was sent to the host; the eventual native
open result is asynchronous and is not returned by this API. Call
`client.call('system', 'openUrl', url)` directly when app code needs that
result.

## Verify the boundary

The [macOS WKWebView proof](../apps/macos/webview-proof/ProofScreen.web.ts)
runs in a real WKWebView. It verifies capability discovery for all 24 framework
methods and four proof-owned methods, and directly invokes the framework calls
that can run without user interaction: bootstrap state, clipboard, app state,
window size, file reads, secure storage, host storage, appearance, app-defined
calls/events, deep links, and a secondary webview window's close event. Run it
with `pnpm --filter @xplat/macos webview:proof`; the verifier reports
`[webview-proof] verified 28 typed host methods`. The full shared frontend used
by the configured macOS renderer starts from
[`apps/web/src/main.tsrx`](../apps/web/src/main.tsrx).
