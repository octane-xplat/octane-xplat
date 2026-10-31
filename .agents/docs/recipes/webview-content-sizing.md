# Size a WebView to its document

ID: webview-content-sizing
Targets: web, ios, android, macos
Related APIs: `WebView`, `WebViewContentSize`, `SafeArea`

## Starting point

The app embeds trusted remote or inline content in `WebView`. The app needs
either the measured document size or a frame height that follows the content.

## Requirements

The workflow must describe content measurement and automatic frame sizing on
each target, including the browser same-origin boundary. It must also show how
to extend the frame beneath system safe areas when that is desired.

## Acceptance criteria

- AC1: The app can receive measured content width and height after a successful load on web, iOS, Android, and AppKit macOS.
- AC2: The app can enable `matchContents` to size the frame to the content, and knows that cross-origin browser documents cannot be measured.
- AC3: The app can place the WebView in `SafeArea` and use `edges={[]}` (or the deprecated `ignoreSafeArea` alias) to extend content under system insets.

## Documentation

- AC1: [Building screens: WebView content sizing](../../../docs/app/primitives.md#webview-content-sizing) and maintained [WebViewDemo](../../../packages/demos/src/WebViewDemo.tsrx).
- AC2: [Building screens: WebView content sizing](../../../docs/app/primitives.md#webview-content-sizing), [known limits](../../../docs/testing/known-limits.md), and maintained [WebViewDemo](../../../packages/demos/src/WebViewDemo.tsrx).
- AC3: [Building screens: WebView content sizing](../../../docs/app/primitives.md#webview-content-sizing) and maintained [WebViewDemo](../../../packages/demos/src/WebViewDemo.tsrx).

## GTK coverage

`WebView` is a curated GTK root export backed by WebKitGTK 6.0. The
public-root [webview fixture](../../../packages/linux-gtk-renderer/test/ui-webview.test.mjs)
runs 28 assertions against a real WebKit web process: `src`/`html` loads,
load ordering, DNS-failure `onError` without a spurious `onLoad`, scroll
freeze, `matchContents` resize, `onLayoutContent` measured size, and
imperative-handle navigation. This covers the AC1 measured-size contract
and AC2's `matchContents` sizing on the GTK target — the cross-origin
measurement limit in AC2 is a browser-iframe boundary, not a GTK one.
AC3's safe-area extension has no GTK surface to verify: GTK reports zero
insets on every edge. The fixture needs the WebKitGTK 6.0 typelib and a
session D-Bus for the sandboxed web process. The GTK guide covers
`WebView` in [Embed web content](../../../docs/platform/linux-gtk.md#embed-web-content).
Record GTK coverage separately from execution evidence in
gtk_recipe_checks.
