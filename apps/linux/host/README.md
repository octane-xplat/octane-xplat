# Linux webview host

The Linux target is a Tauri-style system webview: `vite build` produces the
DOM bundle, a thin native host owns the window (WebKitGTK) and exposes OS
APIs through one script-message channel.

Two hosts share the same wire contract:

| Host           | File           | Status | Purpose                                             |
| -------------- | -------------- | ------ | --------------------------------------------------- |
| WKWebView      | `WKHost.swift` | works  | macOS dev stand-in — same `webkit.messageHandlers` API |
| GJS/WebKitGTK  | `gjs-host.js`  | desk   | the real host — Gio/D-Bus + libsecret, unverified   |

Wire contract (`packages/platform/src/bridge.linux.ts`):

```text
webview → host   webkit.messageHandlers.xplat.postMessage({id, service, method, args})
host → reply     __xplatBridge.resolve(id, value) | .reject(id, message)
host → event     __xplatBridge.emit(service, event, payload)
document-start   window.__xplatInitialUrl (sync state that can't round-trip)
```

Run the harness:

```sh
pnpm --filter @xplat/linux dev      # vite on :5201
apps/linux/host/run.sh --self-test  # build + launch + bridge round-trip check
```

Host-side services on real Linux are mostly D-Bus (org.freedesktop.\*,
xdg-desktop-portal) plus GDK/libsecret — no JS↔native binding layer needed.
