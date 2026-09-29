# Get a working app and iterate

> Start in the browser, give your agent one useful task, and check each
> platform you intend to ship.

## Create and run

Install [Node.js compatible with Vite 8](https://vite.dev/guide/) (20.19+ or
22.12+) and pnpm before running the creator:

```sh
pnpm create octane-xplat my-app
```

The creator copies the starter, installs dependencies, and starts the web dev
server. Open the local URL printed in the terminal. Leave that process running
while you work. To restart after stopping it with Ctrl+C:

```sh
cd my-app
pnpm dev
```

Open `my-app` in your coding agent and give it a bounded first task:

> Read AGENTS.md and .agents/skills/xplat/SKILL.md. Replace the starter screen
> with a trip packing checklist: add items, mark them packed, remove them,
> and show the number still to pack. Use in-memory state and shared xplat
> components. Run pnpm lint, pnpm typecheck, and pnpm build. Report failures
> and which targets you actually ran.

Try adding and packing an item. Then ask for a change you can check, such as
“Group items by bag.” Add persistence or device features once the basic flow
works. The skill guides code changes; it does not give the agent automatic
access to your browser, simulator, or device.

## Run on iOS and Android

Install the [NativeScript environment prerequisites](https://docs.nativescript.org/setup/)
for the target first. iOS development needs macOS and Xcode; Android needs the
Android SDK, a compatible JDK, and an emulator or connected device. This
repository's Android setup uses JDK 17; its Gradle 8.14.3 setup fails on Java 25.
For iOS, check that the Ruby on PATH can load `xcodeproj`:
`ruby -e 'require "xcodeproj"'`. If it cannot, install the user gem with
`gem install --user-install xcodeproj`.

From the app directory, run `pnpm exec ns doctor` for the NativeScript
environment and `pnpm xplat doctor` for xplat configuration and patch checks.
Then use a separate terminal while the web server stays running:

```sh
pnpm dev:ios       # iOS simulator or connected device
pnpm dev:android   # Android emulator or connected device
```

Alternatively, stop the existing dev processes and let the CLI launch selected
targets together:

```sh
pnpm xplat dev               # pick available targets
pnpm xplat dev -t web,ios    # web plus an available iOS target
```

## See a shared edit in running targets

Ask the agent to change the checklist's empty state or layout, then save the
shared screen. Web and iOS/Android development sessions watch the same source.
The xplat development loop has been verified with a shared `.tsrx` edit reaching
web and an iOS simulator; verify your own running targets after each change.
This updates code in local development sessions, not data between devices or
installed production apps.

Start mobile sessions through the starter's `ns run` scripts so the update
connection attaches. A manual app launch may load a bundled app without live
updates. Native configuration or dependency changes can require a rebuild.
If an edit does not appear, use the
[dev-loop troubleshooting table](toolchain-notes.md#dev-loop-troubleshooting).
macOS uses a separate experimental update path described below; there is no
Windows dev target in this checkout.

## Agent context and versions

The starter's `AGENTS.md` points to `.agents/skills/xplat/SKILL.md`. Keep that
project context available to the agent; it covers shared components, platform
files, styling, state, and verification. The
[docs index](https://octane-xplat.goddardai.org/llms.txt) and
[full guides](https://octane-xplat.goddardai.org/llms-full.txt) provide more detail.

NativeScript also publishes [official agent skills](https://github.com/NativeScript/skills)
for native APIs, platform behavior, and tooling. They are optional, installed
separately, and do not replace xplat's component and file conventions. Choose
skills relevant to the task and check their API/version assumptions against
your app before applying examples from another frontend.

The checked-in [starter manifest](../packages/create/template/package.json)
pins NativeScript core 9.1.2, CLI 9.1.1, Vite integration 8.0.11, Octane 0.4.0,
and the Octane NativeScript integrations at 0.2.1. It also carries framework
patches. The framework workspace can use newer versions; the published
creator can differ from this checkout. Use the created app's manifest and
lockfile as the authority, retain its patches, and follow
[patch management](../packages/cli/README.md) when upgrading. Do not infer
compatibility from the latest upstream skill or release alone.

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
not part of the scaffolded starter. See the
[target guide](spec.md#choose-your-targets) for release support boundaries.
`xplat.targets.macos.package` in the app manifest supplies the app name, bundle identifier, executable name, version, minimum macOS version, Vite
config, and production bundle path. An optional `icon` path selects an `.icns`
file inside the app project for the packaged app icon. `entitlements` is also
required when `MACOS_SIGNING_IDENTITY` is set. The minimum macOS version must be
13.5 or later for the JavaScriptCore host. `xplat doctor` rejects lower
values and checks the configuration and local packaging tools, including
`codesign` and `hdiutil`. It also checks the installed
`@nativescript/macos-node-api` type declarations and license, plus the pinned
JavaScriptCore host and compatible addon used in development and packaging.
Packaging verifies host artifact checksums before running Vite, then rejects
external imports outside its documented host API.
The `.app` uses system JavaScriptCore and bundles no Node executable or JS
engine binary; `xplat dev` runs the Vite watcher in Node while the AppKit app
and Octane HMR run in the JavaScriptCore host. See
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
round-trip check); `gjs-host.js` is the real GJS/WebKitGTK host, verified in
an OrbStack container (`host/Dockerfile` + `container-smoke.sh`) against real
D-Bus services. Host-side services are D-Bus/Gio-shaped (freedesktop
notifications, portals, libsecret) — no JS↔native binding layer. See the
[Linux host notes](../apps/linux/host/README.md) and decision #61.
