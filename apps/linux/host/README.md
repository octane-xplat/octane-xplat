# Linux webview host

The Linux target is a Tauri-style system webview: `vite build` produces the
DOM bundle, a thin native host owns the window (WebKitGTK) and exposes OS
APIs through one script-message channel.

Two hosts share the same wire contract:

| Host          | File           | Status   | Purpose                                                |
| ------------- | -------------- | -------- | ------------------------------------------------------ |
| WKWebView     | `WKHost.swift` | verified | macOS dev stand-in — same `webkit.messageHandlers` API |
| GJS/WebKitGTK | `gjs-host.js`  | verified | the real host — Ubuntu 24.04 VM and container evidence |

The canonical GJS host and bridge self-test ship in
`packages/cli/src/linux/host/`; the files here are symlinks used by the harness.
For real apps, follow [Linux packaging](../../../docs/linux-package.md).

Wire contract (`packages/platform/src/bridge.linux.ts`):

```text
webview → host   webkit.messageHandlers.xplat.postMessage(JSON string)
host → reply     __xplatHostTransport.receive(JSON reply packet)
host → event     __xplatHostTransport.receive(JSON event packet)
legacy replies  __xplatBridge.resolve(id, value) | .reject(id, message)
document-start   window.__xplatInitialUrl (sync state that can't round-trip)
```

The request is a JSON _string_, not an object — WebKitGTK 6.0 delivers a bare
`JSCValue` to the handler, and `value.to_string()` beats walking properties.

## Load paths

The webview loads one of two URLs, chosen by `gjs-host.js` args:

- `xplat://localhost/` — production. A `WebKitURISchemeRequest` handler on
  the shared `WebKitWebContext` serves the bundle from `--bundle DIR` /
  `$XPLAT_BUNDLE_DIR` / `./bundle` / `../dist`, with SPA fallback to
  `index.html` for non-file paths. The scheme is registered _secure_ and
  _CORS-enabled_ so secure-context APIs (`navigator.clipboard`,
  `crypto.subtle`) and module/font fetches work.
- `http://localhost:5201` — dev; vite serves, HMR rides real HTTP.

`pnpm --filter @xplat/linux build` invokes the CLI packager and emits
`apps/linux/dist/linux/octane-xplat/` plus `octane-xplat-0.0.0.tar.gz`.
The launcher resolves host and bundle paths independently of the caller's
working directory. The installer generates the desktop entry at its destination;
URI-handler registration is explicit.

## VM verification

On Andromeda, the OrbStack `octane-linux` machine runs Ubuntu 24.04 x86-64.
With the repository and dependencies in `/home/alec/octane-xplat`, run:

```sh
ssh andromeda.local '/usr/local/bin/orb -m octane-linux bash -lc "cd /home/alec/octane-xplat && PATH=/home/alec/.local/share/pnpm/bin:$PATH pnpm --filter @xplat/linux smoke"'
```

The maintained [smoke runner](../scripts/smoke.mjs) builds through the CLI and
runs [handler-driven harness checks](harness-selftest.web.js) inside the real
GTK WebView under Xvfb. It checks mount/state, textarea growth, routes, virtual
list mount bounds and empty state, sheets, overlays, and unhandled page errors.
It does not measure pixels or physical input. The [packed consumer
verifier](../../../packages/cli/test/verify-linux-consumer.mjs) separately checks
archive relocation, installation, host services, keyring persistence and app
isolation, and URI forwarding with an app outside the workspace.

## Container verification

`Dockerfile` + `container-smoke.sh` run gjs-host under Debian trixie
(WebKitGTK 2.52.6, gjs 1.82) with Xvfb + `dbus-run-session`:

From the repository root (with Docker running):

```sh
docker build -t xplat-linux-host apps/linux/host
docker run --rm --shm-size=1g --security-opt seccomp=unconfined \
  -v "$PWD":/work -w /work/apps/linux/host xplat-linux-host
```

Verified there (self-test, real D-Bus session, both load legs): `xplat://`
bundle serving + `__xplatBridge` injection, `Gio.Application` 'open' deep
links (`HANDLES_OPEN` — URI argv and second-instance forwarding land as deep
links; cold-start URL arrives via `__xplatInitialUrl` injection), appearance
(`org.freedesktop.portal.Settings` Read → `Adw.StyleManager` fallback, pushes
`appearance.change`; WebKitGTK's `prefers-color-scheme` does NOT follow
GNOME — `theme/colorScheme.linux.ts` consumes the injected + emitted value),
files (`Gtk.FileDialog` pick/save + host-side `readText` — untested dialogs
aside), windows (`windows.open` → Adw window + own `WebKitWebView` + own
Octane root; `options.data` arrives as `window.__xplatWindowData`;
`windows.closed` emits back to the opener; kinds `regular`/`dialog` — dialog
maps to transient+modal, GTK has no sheets), clipboard (GTK4
`set_content`/`read_text_async` — there is no `set_text`), Secret Service
round-trip (`COLLECTION_SESSION` during self-tests; production uses the unlocked default
collection through asynchronous calls), `org.freedesktop.Notifications` `GetCapabilities` +
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
