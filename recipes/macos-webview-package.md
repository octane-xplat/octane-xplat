# Run a macOS app in the system WKWebView

ID: macos-webview-package
Targets: macos
Related APIs: xplat.targets.macos.renderer, xplat dev, xplat build, @octane-xplat/platform/host, @octane-xplat/platform/host/web, desktopHost, createHostClient, createHostDispatcher, WKWebView

## Starting point

An existing experimental macOS target configured with the JavaScriptCore and
NativeScript host. The reader knows how to build the app with `xplat` and wants
its shared DOM frontend inside the system WKWebView.

## Requirements

- Select the system WebView renderer for this app without changing the AppKit
  default for other apps.
- Keep the `.web` frontend and native host behind the typed desktop service
  channel.
- Package the WebView page with the host so the app runs without a dev server.

## Acceptance criteria

- AC1: The reader can configure the macOS target as `renderer: "webview"`, run `xplat doctor`, and retain AppKit behavior when the renderer setting is omitted.
- AC2: `xplat dev --targets macos` runs the DOM frontend in WKWebView through the NativeScript/JavaScriptCore host, and the frontend resolves `.web` implementations.
- AC3: `xplat build --targets macos` includes the frontend and host in the `.app`; the packaged page loads through the app scheme without a dev server.
- AC4: Framework and app-owned services share typed calls, replies, events, and capability discovery, with serializable payloads and handled call failures.
- AC5: Framework clipboard, app-info, lifecycle, window-size, deep-link, outbound-link, share, files, notifications, secure-storage, and color-scheme adapters use host services inside WKWebView and preserve browser behavior outside the desktop host.
- AC6: The proof runs in a real WKWebView, discovers every advertised framework/app-owned method, invokes the noninteractive methods, and verifies secondary webview windows plus typed host events.

## Documentation

- AC1: [Renderer configuration and doctor](../docs/platform/macos-webview.md#configure-the-renderer).
- AC2: [Development, DOM suffix resolution, and the maintained app config](../docs/platform/macos-webview.md#configure-the-renderer).
- AC3: [Packaging and the app scheme](../docs/platform/macos-webview.md#configure-the-renderer).
- AC4: [Typed service and event contracts](../docs/platform/macos-webview.md#share-typed-host-services) and the [app-owned service proof](../apps/macos/webview-proof/ProofScreen.web.ts).
- AC5: [Framework service adapters](../docs/platform/macos-webview.md#share-typed-host-services) and the [WKWebView proof](../apps/macos/webview-proof/ProofScreen.web.ts).
- AC6: [Boundary verification](../docs/platform/macos-webview.md#verify-the-boundary) and the [proof host](../apps/macos/webview-proof-host.ts).
