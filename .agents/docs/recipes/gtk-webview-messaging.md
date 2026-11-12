# Receive messages from a GTK WebView

ID: gtk-webview-messaging
Targets: linux
Related APIs: WebView, WebView.onMessage, WebViewMessageEvent, postToHost

## Starting point

A GTK app embeds a trusted page with its own JavaScript bundle and needs JSON
messages from that page. The host has GJS, GTK4, WebKitGTK 6.0 and a session D-Bus.

## Requirements

- The embedded page uses the shared `postToHost` helper; the app handles messages
  through the public `WebView` component.
- Navigation, callback updates and teardown preserve the message lifecycle.
- Explain the bounded outbox and the absence of replies and native origin metadata.

## Acceptance criteria

- AC1: The page can post JSON values at startup and later; the host receives their
  payloads in order. `src` messages carry the document URL; `html` messages do not.
- AC2: Replacing a callback uses the latest handler without recreating the view.
  Removing the callback stops polling, and navigation/disposal discard old eval
  completions. The outbox retains at most the newest 100 queued values.
- AC3: The reader understands that delivery is poll-drained, ordered and at-least-once,
  with no reply channel or native origin metadata. The app owns data validation;
  successful JavaScript evaluation alone does not prove delivery.

## Documentation

- AC1: [GTK WebView messaging](../../../docs/platform/linux-gtk.md#embed-web-content)
  and the maintained [WebView runtime fixture](../../../packages/linux-gtk-renderer/test/ui-webview.test.mts).
- AC2: [GTK message lifetime](../../../docs/platform/linux-gtk.md#embed-web-content)
  and the maintained [WebView runtime fixture](../../../packages/linux-gtk-renderer/test/ui-webview.test.mts).
- AC3: [GTK messaging limits](../../../docs/platform/linux-gtk.md#embed-web-content).

The fixture runs the actual helper inside WebKit documents and checks callback
lifetime independently of document loading and measurement.

Record coverage and execution separately in `gtk_recipe_checks`. Runtime evidence
requires real GJS/WebKitGTK execution; bundle and typecheck success are insufficient.
