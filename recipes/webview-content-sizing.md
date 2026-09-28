# Size a WebView to its document

ID: webview-content-sizing
Targets: web, ios, android
Related APIs: `WebView`, `WebViewContentSize`, `SafeArea`

## Starting point

The app embeds trusted remote or inline content in `WebView`. The app needs
either the measured document size or a frame height that follows the content.

## Requirements

The workflow must describe content measurement and automatic frame sizing on
each target, including the browser same-origin boundary. It must also show how
to extend the frame beneath system safe areas when that is desired.

## Acceptance criteria

- AC1: The app can receive measured content width and height after a successful load on web, iOS, and Android.
- AC2: The app can enable `matchContents` to size the frame to the content, and knows that cross-origin browser documents cannot be measured.
- AC3: The app can place the WebView in `SafeArea` and use `ignoreSafeArea` to extend content under system insets.

## Documentation

- AC1: [Building screens: WebView content sizing](../docs/primitives.md#webview-content-sizing) and maintained [WebViewDemo](../packages/demos/src/WebViewDemo.tsrx).
- AC2: [Building screens: WebView content sizing](../docs/primitives.md#webview-content-sizing), [known limits](../docs/known-limits.md), and maintained [WebViewDemo](../packages/demos/src/WebViewDemo.tsrx).
- AC3: [Building screens: WebView content sizing](../docs/primitives.md#webview-content-sizing) and maintained [WebViewDemo](../packages/demos/src/WebViewDemo.tsrx).
