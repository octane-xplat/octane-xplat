# Get a working app and iterate

> Start in the browser, give your agent one useful task, and check each
> platform you intend to ship.

## Create and run

Use Node.js 22.22.2 or later and install pnpm before running the creator.
The framework workspace’s Octane package requires that Node version; meeting
Vite’s lower minimum alone is not a sufficient toolchain check:

```sh
pnpm create octane-xplat my-app
```

The creator copies the starter, installs dependencies, and starts the web dev
server. Open the local URL printed in the terminal. The checked-in starter
shows an `octane-xplat` screen with a small counter and a theme toggle;
it does not yet contain the packing app you will ask your agent to build.
Leave that process running while you work. To restart after stopping it
with Ctrl+C:

```sh
cd my-app
pnpm dev
```

If installation stops with “Install didn't finish,” enter `my-app`, run
`pnpm install`, and resolve the reported error before running `pnpm dev`.
If the browser cannot connect, check that the dev process is still running
and use its printed URL rather than assuming a port.

## Build and check your first flow

Open `my-app` in your coding agent and give it a bounded first task:

> Read AGENTS.md and .agents/skills/xplat/SKILL.md. Replace the starter screen
> with a trip packing checklist: add items, mark them packed, remove them,
> and show the number still to pack. Use in-memory state and shared xplat
> components. Run pnpm lint, pnpm typecheck, and pnpm build. Report failures
> and which targets you actually ran.

Check the running result before adding another feature:

1. Add “Passport” and “Charger.” Both should appear, with two items remaining.
2. Mark Passport packed. It should stay visible, with one item remaining.
3. Remove both items. Check that the empty state offers a way to add an item.
4. Add “Passport” again, then reload. The list should reset because this
   first task uses in-memory state.

If a check fails, give the agent the action, expected result, and actual result:
“After packing Passport, the remaining count still says two; it should say one.”
This gives it a specific behavior to fix. The skill supplies coding guidance;
access to your browser or device depends on the tools available to your agent.

Once this works, ask for “Group items by bag.” Add persistence or device
features after the basic flow passes. Run the lint, typecheck, and build checks
again after the change; those checks complement the interaction you just tried.

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

With web and a native development session running, ask the agent to change
the empty-state text to “Ready for your next trip?” in the shared screen.
Save the file and empty the list on each target. Both should show the new text
without manually restarting the apps. Check each app separately: their
in-memory packing lists are separate too.

Web and iOS/Android development sessions watch the same source.
The xplat development loop has been verified with a shared `.tsrx` edit reaching
web and an iOS simulator; verify your own running targets after each change.
This updates code in local development sessions, not data between devices or
installed production apps.

Start mobile sessions through the starter's `ns run` scripts so the update
connection attaches. A manual app launch may load a bundled app without live
updates. Native configuration or dependency changes can require a rebuild.
If an edit does not appear, use the
[dev-loop troubleshooting table](toolchain-notes.md#dev-loop-troubleshooting).
macOS uses a separate experimental update path described below. The Windows
scaffold has a CLI dev target, but its launch and live updates have not yet
been verified on Windows.

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

## Experimental Windows target

The repository includes a WinUI 3 scaffold in `apps/windows`, separate from
the creator. Its Windows-targeted bundle builds on macOS; launch, interactions,
and live updates still need verification on a Windows host. This is an
experimental path, not a verified Windows release workflow.

It requires Windows 10 1809+, .NET 10 SDK, Developer Mode, Node.js, and pnpm.
The scaffold pins `@nativescript/windows` to `0.1.0-alpha.144`, NativeScript
CLI to `9.1.2-dev.2026-09-24-36031892256`, and core/Vite to PR #11468 preview
builds. The standard core 9.1.2/Vite 8.0.11 patches do not apply to those
previews. Keep this setup separate from the starter's mobile version matrix.

Follow the [Windows harness instructions](../apps/windows/README.md) for
commands and prerequisites. Ask your agent to report bundle checks separately
from Windows runtime checks; a compiled shared screen does not prove that its
native controls or device services work there.

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
