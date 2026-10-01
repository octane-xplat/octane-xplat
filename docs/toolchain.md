# Create your first app

> Open a starter app in your browser, then make a small change and try it.

## Create and run

You need two tools on your computer:

- **Node.js** runs the tools that prepare your app. Install version 22.22.2
  or later from the [Node.js download page](https://nodejs.org/en/download).
- **pnpm** downloads the packages your app uses and runs its project commands.
  Follow the [pnpm installation guide](https://pnpm.io/installation). This
  checkout's starter uses pnpm 11.24.0.

A **package** is a bundle of code your app uses, such as Xplat's buttons and
text fields. You don't need phone development tools to start in the browser.

1. Open a terminal: Terminal on macOS, PowerShell on Windows, or your Linux
   terminal app. This is where you type commands. Your code editor may also
   have a terminal panel.
2. Check that both tools are available. Run each line separately:

   ```sh
   node --version
   pnpm --version
   ```

   Each should print a version number. If you see “command not found” or
   “not recognized,” finish installing that tool and reopen the terminal.

3. Open the folder where you want to keep your project in your editor's
   terminal, or use `cd` to move there. For example, `cd Desktop` moves into
   a Desktop folder inside your current folder. Create the app:

   ```sh
   pnpm create octane-xplat my-app
   ```

   `my-app` is the new folder's name; you can choose another name. Use a
   folder that doesn't already contain files. The command asks which
   platforms to target — web, iOS, and Android are pre-selected — then
   copies the matching starter files, installs its packages, and starts a
   **development server**: a local process that serves your app to the
   browser and watches for edits. Pass `--targets` to skip the prompt
   (`pnpm create octane-xplat my-app --targets web` scaffolds web only);
   non-interactive runs without it keep all three.

   A platform skipped at create time can be enabled later from the app
   directory — `pnpm xplat add ios` copies its files, adds its packages and
   scripts, and installs. `xplat add` never overwrites files or manifest
   entries you have already edited.

4. Open the local address printed in the terminal. The checked-in starter
   contains a counter and a light/dark theme button. Try the counter buttons.
   Leave the terminal running while you edit the app.

Press Ctrl+C in that terminal when you want to stop the server. To start it
again, move into your app's folder and run:

```sh
cd my-app
pnpm dev
```

`cd my-app` means “change into the my-app folder.” If your terminal is already
there, run only `pnpm dev`.

If setup stops with “Install didn't finish,” enter `my-app` and run
`pnpm install`. Resolve its reported error before running `pnpm dev`; you
can give the error to your agent for help. If the browser cannot connect,
check that the server is still running and open the address it printed.

To create the files without installing packages or starting the server,
add `--no-install` to the create command. You will still need to run
`pnpm install` and `pnpm dev` from the new folder before you can use the app.

## Build and check your first flow

Try a packing checklist as your first change. It's small enough to check by
using the app, and it teaches adding, changing, and removing information.
You can adapt it to a small feature from your own app idea.

Open the `my-app` folder in your editor. If you're using a coding agent,
give it this prompt:

> Read AGENTS.md and .agents/skills/xplat/SKILL.md. Replace the starter screen
> with a trip packing checklist. Let me add items, mark them packed, remove
> them, and see how many are still to pack. Keep the list only while the app
> is open; it should reset on reload. Use shared Xplat components so it can
> also run on iOS and Android. Run pnpm lint, pnpm typecheck, and pnpm build.
> Explain what changed, report any failures, and say where you ran the app.

You can make the same change yourself in `src/App.tsrx`. A `.tsrx` file
contains TypeScript and screen markup. [Building screens](primitives.md)
introduces the components you can use.

Once the change appears in the browser:

1. Add “Passport” and “Charger.” Both should appear, with two items remaining.
2. Mark Passport packed. It should stay visible, with one item remaining.
3. Remove both items. The empty list should offer a way to add an item.
4. Add Passport again, then reload. The list should reset because this first
   version does not save it between sessions.

If something doesn't work, describe what you did and what happened:
“After packing Passport, the remaining count still says two; it should say
one.” Your agent can use that to fix the problem. Its ability to use your
browser or device depends on the tools available to it; you can always try
these actions yourself.

Then add one feature, such as saving the list or opening a second screen.
Repeat the checks after the change. The [checking guide](testing.md)
explains `lint`, `typecheck`, and `build`; they catch code mistakes but do
not replace trying the app.

## Run on iOS and Android

You can stay in the browser while building the first screens. When you're
ready to try a phone app, install the
[NativeScript development tools](https://docs.nativescript.org/setup/)
for that platform. NativeScript connects your TypeScript code to phone views
and device features.

| Platform | What you need                                                                                        |
| -------- | ---------------------------------------------------------------------------------------------------- |
| iOS      | A Mac, Xcode, and an iOS simulator or connected device.                                              |
| Android  | The Android SDK (development tools), JDK 21 (Java build tools), and an emulator or connected device. |

The Android setup in this repository works with JDK 21 and Gradle 8.14.3.
JDK 25 fails with `Unsupported class file major version 69`. If you have
multiple Java versions installed, configure `JAVA_HOME` to point to JDK 21
for Android builds; your agent can help with your machine's setup.

For iOS, check that Ruby, a tool used by the build, can load its `xcodeproj`
package. Run `ruby -e 'require "xcodeproj"'`. Success prints nothing. If it
reports that the package is missing, run
`gem install --user-install xcodeproj`, then repeat the check.

Open a second terminal in the app folder so the browser server can keep
running. Check the setup with:

```sh
pnpm exec ns doctor
pnpm xplat doctor
```

The first checks NativeScript's development tools; the second checks your
Xplat configuration and required patches. Patches are fixes supplied with
the framework for the versions it uses. Read any reported problems before
continuing.

Run the command for the phone platform you set up:

```sh
pnpm dev:ios
```

Or, for Android:

```sh
pnpm dev:android
```

The `dev:*` scripts exist for every platform enabled at create time —
`pnpm xplat add <platform>` adds one that was skipped. These start the app
on a simulator, emulator, or connected device. Once it
opens, try the same checklist actions you tried in the browser.

To launch multiple platforms together instead, stop the existing development
commands with Ctrl+C and run `pnpm xplat dev`. It offers a choice of available
targets. `pnpm xplat dev -t web,ios` selects web and an available iOS target.

## See a shared edit in running targets

With the browser and a phone development session running, change the empty-list
text to “Ready for your next trip?” in the shared screen, or ask your agent
to do it. Save the file and empty the list in each app. Both should show the
new text without you restarting them.

Each running app has its own packing list. Live updates change the code
while you're developing; they do not sync data between devices or update
apps you have already released. A shared `.tsrx` edit has been checked in
the browser and an iOS simulator; check your own platforms too.

Start phone development through `pnpm dev:ios` or `pnpm dev:android` so the
live-update connection attaches. Opening an installed app by hand can load
its bundled code without that connection. Changing native configuration
or packages can require a rebuild. If an edit does not appear, see
[live-update troubleshooting](toolchain-notes.md#dev-loop-troubleshooting).
Desktop development has separate experimental setup, described below.

## Agent context and versions

The starter's `AGENTS.md` points your agent to `.agents/skills/xplat/SKILL.md`.
These files explain Xplat's components, platform files, styling, state, and
checks. Keep them in the project. Agents can also read the
[docs list](https://octane-xplat.goddardai.org/llms.txt) or
[full guides](https://octane-xplat.goddardai.org/llms-full.txt).

NativeScript's [official agent skills](https://github.com/NativeScript/skills)
are optional instructions for native features and tooling. They are installed
separately. Ask your agent to use examples that match your app's package
versions; examples for another framework may need changes.

The starter's `package.json` lists its packages and commands. Its lockfile
records the versions installed. Keep both, along with the supplied patches.
The [checked-in package list](../packages/create/template/package.json) uses
NativeScript core 9.1.2, CLI 9.1.1, Vite integration 8.0.17, Octane 0.6.3,
and the Octane NativeScript integrations at 0.2.4. The published creator and
framework workspace can use different versions. Follow your created app's
files and [patch management instructions](../packages/cli/README.md) when upgrading.

## Build and check

A **build** prepares your code to run outside the development server. Run
these from the app folder for the platforms you have set up:

| Command              | Result                                                    |
| -------------------- | --------------------------------------------------------- |
| `pnpm build`         | Prepares the browser app.                                 |
| `pnpm build:ios`     | Builds the iOS app; requires the iOS tools.               |
| `pnpm build:android` | Builds the Android app; requires the Android tools.       |
| `pnpm typecheck`     | Checks the app's web and phone TypeScript configurations. |

Before release, run `pnpm xplat build --release` and try the resulting app.
Phone signing must be configured for signed builds. Signing identifies your
app's publisher; app-store uploads and signing credentials stay with your
project. [Known limits](known-limits.md#same-edge-on-every-target) lists
current release-build issues.

Some native features require a **plugin**, a package that connects to device
code. The starter includes common UI plugins. If your app imports a platform
service that uses an optional plugin, declare it in the app's `package.json`
according to that service's setup guide. `pnpm xplat doctor` warns about
missing direct declarations. Plugins owned by add-on packages travel with
those packages instead; see [device features](platform-services.md).

## When a target is unavailable

You can write screens and test shared calculations without a connected phone.
Phone builds still need the platform's development tools; iOS release builds
need a Mac. Add those tools when you're ready to work on that platform.

The [toolchain notes](toolchain-notes.md) cover framework build internals,
version pins, and package publishing. The sections below are for experimental
desktop setup and are separate from creating your first browser or phone app.

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

For AppKit rendering, install `@octane-xplat/macos-renderer` and use
`xplatMacOS` from `@octane-xplat/cli/macos/vite` to register the compiler,
platform resolution, and compatibility aliases. The app owns its windows,
startup, and custom fonts; the renderer defaults to Apple's system font.
See the [renderer setup](../packages/macos-renderer/README.md) for dependencies,
Vite and TypeScript configuration, and the root lifecycle.

Leaf packages can also ship `platforms/macos/` sources in C, ObjC, Swift, or
Zig. The CLI compiles them into separate libraries, extends app metadata, loads
them before JS, and signs them with the packaged app. Declare
`xplat.targets.macos.dev` for CLI-owned development with native rebuild/restart;
see [native macOS leaves](macos-native.md) for the package contract, toolchain,
language boundaries, and verification limits.

The in-repository app runs the shared `@xplat/app` harness through
`@octane-xplat/ui`'s `macos` package condition; its Vite config does not alias
the UI package root. An adapted sweep covers the Home shell, Apps gallery,
nine demos, and Test/probe surface. The AppKit renderer implements a bounded
set of components and style tokens, while missing host services report
`unsupported` or `unavailable`. This verifies the in-repository harness, not
general NativeScript or web parity; see the [macOS experiment notes](https://github.com/aleclarson/octane-xplat/blob/main/apps/macos/README.md)
for the measured boundary.

### System WKWebView renderer

Set `xplat.targets.macos.renderer` to `"webview"` to run the app's DOM
frontend in the system WKWebView. The default remains the experimental AppKit
renderer. The WebView path uses the same Apple Silicon JavaScriptCore host and
NativeScript mediator, while the frontend resolves `.web` implementations.
Development serves the frontend from loopback and packages it under
`Contents/Resources/web`; packaged pages load through the app's `xplat://app`
scheme. The supported minimum remains macOS 13.5.

Configure `webViteConfig`, `hostViteConfig`, and `hostBundleFile` under both
`xplat.targets.macos.dev` and `.package`; packaging also requires `webOutDir`.
All paths are relative to the app root. `xplat doctor` checks this renderer
configuration. The frontend and host exchange typed calls, replies, events,
and capabilities through `@octane-xplat/platform/host`; see the
[WKWebView host guide](macos-webview.md) for configuration and custom services.

## Experimental Windows target

The repository includes an experimental WinUI 3 app in `apps/windows`,
separate from the starter. The native host can launch on Windows, but UI
support remains incomplete. See [Windows setup](windows-setup.md) and
[Windows limits](windows-notes.md) before using it for an app; a successful
bundle build does not establish that its controls work.

It requires Windows 10 1809+, .NET 10 SDK, Developer Mode, Node.js, and pnpm.
The scaffold pins `@nativescript/windows` to `0.1.0-alpha.144`, NativeScript
CLI to `9.1.2-dev.2026-09-24-36031892256`, and core/Vite to PR #11468 preview
builds. The standard core 9.1.2/Vite 8.0.17 patches do not apply to those
previews. Keep this setup separate from the starter's mobile version matrix.

Follow the [Windows harness instructions](../apps/windows/README.md) for
commands and prerequisites. Ask your agent to report bundle checks separately
from Windows runtime checks; a compiled shared screen does not prove that its
native controls or device services work there.

## Experimental Linux target (WebKitGTK webview)

Declare `xplat.targets.linux.runtime: 'webkitgtk'` and Linux package settings.
`pnpm xplat build --targets linux` builds the static frontend and ships the
GJS host, relocatable launcher, per-user installer, desktop entry, and tar archive.
Follow [Package a Linux WebKitGTK app](linux-package.md) for the complete
configuration, prerequisites, installation, URI handling, and verification flow.

The target renders DOM inside system WebKitGTK, with `.linux` → `.web` → shared
resolution. It uses the desktop host protocol for OS services. The real host
has been exercised on the Ubuntu 24.04 x86-64 VM on Andromeda; the macOS
WKWebView stand-in is development evidence only. `xplat dev --targets linux`
continues to run the app's configured dev script; see the [harness host
notes](../apps/linux/host/README.md) for its Vite/GTK loop.
