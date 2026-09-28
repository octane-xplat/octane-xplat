# Linux webview host

The Linux target is a Tauri-style system webview: `vite build` produces the
DOM bundle, a thin native host owns the window (WebKitGTK) and exposes OS
APIs through one script-message channel.

Two hosts share the same wire contract:

| Host           | File           | Status   | Purpose                                                |
| -------------- | -------------- | -------- | ------------------------------------------------------ |
| WKWebView      | `WKHost.swift` | verified | macOS dev stand-in — same `webkit.messageHandlers` API |
| GJS/WebKitGTK  | `gjs-host.js`  | verified | the real host — Gio/D-Bus + libsecret (container pass) |

Wire contract (`packages/platform/src/bridge.linux.ts`):

```text
webview → host   webkit.messageHandlers.xplat.postMessage(JSON string)
host → reply     __xplatBridge.resolve(id, value) | .reject(id, message)
host → event     __xplatBridge.emit(service, event, payload)
document-start   window.__xplatInitialUrl (sync state that can't round-trip)
```

The request is a JSON *string*, not an object — WebKitGTK 6.0 delivers a bare
`JSCValue` to the handler, and `value.to_string()` beats walking properties.

## Container verification

`Dockerfile` + `container-smoke.sh` run gjs-host under Debian trixie
(WebKitGTK 2.52.6, gjs 1.82) with Xvfb + `dbus-run-session`:

```sh
docker build -t xplat-linux-host apps/linux/host
docker run --rm --shm-size=1g --security-opt seccomp=unconfined \
  -v <repo>:/work -w /work/apps/linux/host xplat-linux-host
```

Verified there (self-test, real D-Bus session): clipboard (GTK4
`set_content`/`read_text_async` — there is no `set_text`), Secret Service
round-trip (`COLLECTION_SESSION` — a headless `default` keyring prompts and
hangs the sync call), `org.freedesktop.Notifications` `GetCapabilities` +
`Notify` via `notification-daemon` (started manually — Debian ships no
activation service file), and the rejection path.

Container caveats: WebKitGTK sandbox needs
`WEBKIT_DISABLE_SANDBOX_THIS_IS_DANGEROUS`, compositing/DMA-BUF off under
Xvfb. `xdg-desktop-portal` starts and serves the backend-free interfaces
(NetworkMonitor, ProxyResolver, Trash, …); UI portals need a portal backend
and `/dev/fuse` for the documents portal — untested there.

Run the harness:

```sh
pnpm --filter @xplat/linux dev      # vite on :5201
apps/linux/host/run.sh --self-test  # build + launch + bridge round-trip check
```

Host-side services on real Linux are mostly D-Bus (org.freedesktop.\*,
xdg-desktop-portal) plus GDK/libsecret — no JS↔native binding layer needed.
