# Running an xplat app

> Use the starter commands for everyday work; choose a target only when you
> need to inspect that target's behavior.

## Create and run

```sh
pnpm create octane-xplat my-app
cd my-app
pnpm dev
```

The starter opens the web development server. Native targets are available
when their local toolchains are installed:

```sh
pnpm dev:ios
pnpm dev:android
```

Run web and a native target together by keeping the two commands in separate
terminals, or let `xplat dev` spawn them side by side — it discovers the web
server plus booted simulators and connected devices:

```sh
pnpm xplat dev                # pick targets from a prompt
pnpm xplat dev -t web,ios     # skip the prompt
```

The dev servers are independent processes watching the same source tree —
one save hot-updates every running target. Each picks its own port (the
native server auto-bumps past `:5173` on collision and the device
self-discovers the port), so they never conflict.

## Build and check

```sh
pnpm build
pnpm build:ios
pnpm build:android
pnpm typecheck
```

The web build checks the browser bundle. The iOS and Android builds catch
problems in the native bundle and platform configuration. A typecheck should
pass for both target configurations before you publish an app.

Native plugin declarations belong to the app. If its source imports
`@octane-xplat/ui`, declare the UI plugins used by the native entry in that
app's `package.json`; platform service imports have the same rule. Run
`pnpm xplat doctor` from the app root to get warning-only checks for missing
direct declarations. The starter includes the common UI plugins; platform
service plugins remain opt-in to the services an app imports.

## When a target is unavailable

You can build and test shared logic without a connected device. Device builds
still need the platform SDK and signing setup, and iOS release builds require
macOS. Treat those tools as release prerequisites, not as requirements for
writing a shared screen.

For the two bundler pipelines, version pins, package publishing, native
plumbing, and compiler-specific details, see the [toolchain notes](toolchain-notes.md).

## Experimental AppKit target

The CLI can also run the in-repository experimental macOS AppKit Node-API app
with `pnpm xplat dev --targets macos` and package it with
`pnpm xplat build --targets macos`. This target is Apple Silicon only and is
not part of the scaffolded starter or the supported web/iOS/Android release
contract. `xplat.targets.macos.package` in the app manifest supplies the app
name, bundle identifier, executable name, version, minimum macOS version, Vite
config, and production bundle path. An optional `icon` path selects an `.icns`
file inside the app project for the packaged app icon. `entitlements` is also
required when `MACOS_SIGNING_IDENTITY` is set. The minimum macOS version must be
13.5 or later to match the bundled Node runtime. `xplat doctor` rejects lower
values and checks the configuration and local packaging tools, including
`clang`, `codesign`, and `hdiutil`. It also checks the installed
`@nativescript/macos-node-api` entry points, type declarations, license, and
ARM64 framework binary; missing paths appear in the runtime check. Packaging
performs the same layout check before running Vite, pins the Node archive and
executable checksums, then compiles a small Mach-O launcher. Install Xcode
Command Line Tools on the Apple Silicon build host. See
the [macOS experiment
notes](https://github.com/aleclarson/octane-xplat/blob/main/apps/macos/README.md)
for signing, notarization, and icon setup.

The in-repository app runs the shared `@xplat/app` harness through
`@octane-xplat/ui`'s `macos` package condition; its Vite config does not alias
the UI package root. An adapted sweep covers the Home shell, Apps gallery,
nine demos, and Test/probe surface. The AppKit renderer implements a bounded
set of components and style tokens, while missing host services report
`unsupported` or `unavailable`. This verifies the in-repository harness, not
general NativeScript or web parity; see the [macOS experiment notes](https://github.com/aleclarson/octane-xplat/blob/main/apps/macos/README.md)
for the measured boundary.

## Experimental Linux target (WebKitGTK webview)

The CLI also discovers an opt-in Linux target when an app manifest declares
`xplat.targets.linux.runtime: 'webkitgtk'` (see `apps/linux`). Unlike macOS,
Linux does not use the universal renderer — it renders the DOM inside the
system webview, so `pnpm xplat dev --targets linux` is the app's own vite
dev server (:5201) and `build` produces the same bundle web does. Suffix
chain is `.linux` → `.web` → shared: leaves only exist where the host bridge
improves on the DOM API (`packages/platform/src/*.linux.ts`).

OS access crosses a single `webkit.messageHandlers.xplat` channel — the same
API shape on WKWebView and WebKitGTK. `apps/linux/host/WKHost.swift` is a
macOS dev stand-in that runs the real contract (`run.sh --self-test` does a
round-trip check); `gjs-host.js` is the desk-written GJS/WebKitGTK host for
the container pass. Host-side services are D-Bus/Gio-shaped (freedesktop
notifications, portals, libsecret) — no JS↔native binding layer. See
`apps/linux/host/README.md` and decision #61.
