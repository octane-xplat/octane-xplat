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

The starter includes the packages needed to run, build, and test your selected
platforms. Follow [automated tests](../testing/testing.md#add-automated-tests)
to run the sample checks and adapt them to your screen. Add feature packages
when your app needs them.

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
contains TypeScript and screen markup. [Building screens](../app/primitives.md)
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
Repeat the checks after the change. The [checking guide](../testing/testing.md)
explains `lint`, `typecheck`, and `build`; they catch code mistakes but do
not replace trying the app.

You now have a first feature you can use in the browser. Choose what you
want to do next:

- Keep building screens with the [screen guide](../app/primitives.md).
- Try the app on a phone with [iOS and Android setup](#run-on-ios-and-android).
- Prepare the app to run outside development with [build and check](#build-and-check).

The remaining sections cover those tasks and optional setup. You can return
to them when you need them.

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
targets. Choose one device with `--device` and its identifier from
`pnpm xplat targets --json`. For iOS simulators, Xplat waits for the simulator to
boot through `simctl`, so the Simulator desktop app is optional.

```sh
pnpm xplat dev macos
pnpm xplat dev ios --device DEVICE_UDID
pnpm xplat dev android --device DEVICE_SERIAL
pnpm xplat dev -t web,ios
```

Replace `DEVICE_UDID` or `DEVICE_SERIAL` with the exact device identifier.
Use either a single selection (with optional `--device`) or `--targets`.

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
[live-update troubleshooting](../../.agents/docs/notes/toolchain-notes.md#dev-loop-troubleshooting).
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

The framework supplies a compatible set of package versions. The starter's
`package.json` lists the packages your app uses; `pnpm-workspace.yaml` stores
their versions in a named **catalog**, a shared version list. The lockfile
records what pnpm installed. Keep all three files in Git.

```json
{
	"dependencies": { "octane": "catalog:xplat" },
	"devDependencies": { "@tsrx/oxc": "catalog:xplat" }
}
```

An app can also live inside a pnpm **workspace** — a repo where several
apps and packages share one install. Move the scaffolded app under a folder
the workspace covers (for example `apps/mobile`) and list the packages in
the root `pnpm-workspace.yaml`. With `nodeLinker: hoisted`, pnpm installs
all dependencies at the workspace root and the app's own `node_modules`
stays nearly empty; the dev server resolves packages upward the same way
Node does, so iOS/Android dev sessions work unchanged. Keep the catalog,
patches, and `allowBuilds` settings in the root `pnpm-workspace.yaml` —
workspace members read them from there.

```yaml
# pnpm-workspace.yaml at the workspace root
packages:
  - 'apps/*'
nodeLinker: hoisted
```

### Upgrade framework packages

Run from your app folder. In a workspace containing several packages, an
upgrade aligns managed dependencies across that whole workspace. Start with
a committed working app so you can review the changes and return to it.
Preview the latest published CLI's version set, then apply it:

```sh
pnpm dlx @octane-xplat/cli@latest upgrade --check
pnpm dlx @octane-xplat/cli@latest upgrade
pnpm xplat doctor
pnpm typecheck
pnpm build
```

The preview writes nothing and exits `1` when changes are needed. Applying
updates the framework packages, compiler, bundler, enabled test/native tools,
and matching patches, then runs pnpm install. It keeps app-specific packages
and local links. A custom patch or conflicting override stops the command
before any file changes; reconcile the named conflict and run it again.

```sh
pnpm xplat upgrade --check
```

This shorter command aligns to the CLI already installed in your app; it does
not look for a newer release. `doctor` checks actual installed versions and
reports duplicate runtimes, including two physical copies of the same
version. Continue with your app's tests and target builds; these package checks
do not prove that the app runs on a phone or desktop.

```sh
pnpm test                 # if your app has a test script
pnpm build:ios            # if iOS is configured and its tools are installed
```

See the [CLI version-management reference](../../packages/cli/README.md#compatible-versions)
for deferred installs, library peer ranges, Windows preview pins, and
install-failure recovery. Framework maintainers keep the shared set in the
[compatibility manifest](../../packages/create/compatibility.json).

## Build and check

A **build** prepares your code to run outside the development server. Run
these from the app folder for the platforms you have set up:

| Command              | Result                                                    |
| -------------------- | --------------------------------------------------------- |
| `pnpm build`         | Prepares the browser app.                                 |
| `pnpm build:ios`     | Builds the iOS app; requires the iOS tools.               |
| `pnpm build:android` | Builds the Android app; requires the Android tools.       |
| `pnpm typecheck`     | Checks the app's web and phone TypeScript configurations. |
| `pnpm lint`          | Checks shared code patterns without changing source.      |
| `pnpm lint:fix`      | Applies safe lint fixes and reports remaining findings.   |
| `pnpm format`        | Formats JS/TS/JSX/TSX and `.tsrx` files in place.         |

The starter's lint scripts use `xplat lint`, with Oxlint and the framework
rules included in the CLI. You can also check just your screen folder; the
[checking guide](../testing/testing.md#lint-and-format-source) explains fixes,
formatting, and configuration:

```sh
pnpm exec xplat lint src
pnpm exec xplat lint --fix src
```

### Preview and publish Web

Start by trying the built app locally. From the app folder, run:

```sh
pnpm lint
pnpm typecheck
pnpm build
pnpm exec vite preview --host 127.0.0.1
```

Open the local address printed in the terminal. This preview serves the files
in `dist`, so it checks the build rather than the development server. Try your
main actions, open a link directly to a screen, and reload that screen.

A **static host** serves your built HTML, JavaScript, CSS and other files.
To publish the app at your site's root:

1. Configure the host's build command as `pnpm build` and output folder as
   `dist`, or upload the contents of `dist` after building locally.
2. Enable HTTPS. Device permissions, passkeys and other browser services can
   require a secure connection.
3. Configure app screen URLs to serve `index.html`. This lets a direct link or
   reload reach the app's router. Existing assets must still be served as files;
   a missing JavaScript, CSS or worker file must return an error rather than HTML.
4. Publish HTML so browsers check for a new version. If you cache files with
   content hashes in their names, keep those files available to already-open
   tabs during an update. Use the host's atomic deployment feature when available.
5. On the published HTTPS address, repeat your main actions, direct-link/reload,
   browser Back/Forward, keyboard navigation and installed service checks.
   Check the browser console and network panel for errors.

`vite preview` is a local check, not a production server. The host owns TLS,
rewrites, caching and deployment updates. Local browser and packed-starter
checks do not verify those settings on your published site.

Choose the browser versions and devices your app supports, then test them.
The framework's browser checks run locally (`pnpm test:e2e` in the
repository) across managed Chromium, Firefox and WebKit engines; they do not
qualify actual iOS Safari or screen-reader interaction. See the
[Web support boundary](spec.md#choose-your-targets) and the
[optional service qualification](../../.agents/docs/notes/optional-service-qualification.md)
for feature-specific release checks.

### Prepare phone releases

Before release, run `pnpm xplat build --release` and try the resulting app.
Phone signing must be configured for signed builds. Signing identifies your
app's publisher; app-store uploads and signing credentials stay with your
project. [Known limits](../testing/known-limits.md#same-edge-on-every-target) lists
current release-build issues.

Some native features require a **plugin**, a package that connects to device
code. The starter includes common UI plugins. If your app imports a platform
service that uses an optional plugin, declare it in the app's `package.json`
according to that service's setup guide. `pnpm xplat doctor` warns about
missing direct declarations. Plugins owned by add-on packages travel with
those packages instead; see [device features](../platform/platform-services.md).

## Create files without starting the app

If you need to prepare the project files before installing packages or
starting a server, run:

```sh
pnpm create octane-xplat my-app --no-install
```

You will still need to run `pnpm install` and `pnpm dev` from the new folder
before you can use the app. For the usual first-app setup, use the
[create and run steps](#create-and-run).

## When a target is unavailable

You can write screens and test shared calculations without a connected phone.
Phone builds still need the platform's development tools; iOS release builds
need a Mac. Add those tools when you're ready to work on that platform.

The [toolchain notes](../../.agents/docs/notes/toolchain-notes.md) cover framework build internals,
version pins, and package publishing. The sections below are for experimental
desktop setup and are separate from creating your first browser or phone app.

## Experimental AppKit target

The CLI can also run the in-repository experimental macOS AppKit Node-API app
with `pnpm xplat dev macos` and package it with
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

```json
{
	"xplat": {
		"targets": {
			"macos": {
				"runtime": "appkit-node-api",
				"package": {
					"productName": "Example",
					"bundleIdentifier": "com.example.app",
					"executableName": "Example",
					"version": "1.0.0",
					"minimumSystemVersion": "13.5",
					"viteConfig": "vite.package.config.mjs",
					"bundleFile": "dist/package-build/main.cjs",
					"icon": "assets/AppIcon.icns",
					"entitlements": "entitlements.plist"
				}
			}
		}
	}
}
```

During development, the CLI launches a temporary `.app` so macOS can use your
app's name and icon in the Dock and Cmd-Tab. It reuses `package.productName`
and `package.icon`; without a product name, it uses the root package's `name`.
To customize development without configuring a release, add `productName` and
an app-root-relative `.icns` path to `xplat.targets.macos.dev`. Restart the dev
command after changing these settings. This applies to AppKit and WKWebView.

```json
{
	"xplat": {
		"targets": {
			"macos": {
				"runtime": "appkit-node-api",
				"dev": {
					"viteConfig": "vite.dev.config.mjs",
					"bundleFile": "dist/dev/app.cjs",
					"productName": "Brim",
					"icon": "assets/AppIcon.icns"
				}
			}
		}
	}
}
```

The development bundle is removed when the command exits and is not installed
for Spotlight. Use the packaged `.app` for a lasting installation.

For AppKit rendering, install `@octane-xplat/macos-renderer` and use
`xplatMacOS` from `@octane-xplat/cli/macos/vite` to register the compiler,
platform resolution, and compatibility aliases. The app owns its windows,
startup, and custom fonts; the renderer defaults to Apple's system font.
See the [renderer setup](../../packages/macos-renderer/README.md) for dependencies,
Vite and TypeScript configuration, and the root lifecycle.

```js
// vite.package.config.mjs — AppKit build.
import { defineConfig } from 'vite'
import { xplatMacOS } from '@octane-xplat/cli/macos/vite'

export default defineConfig((env) => xplatMacOS(env, { entry: 'src/main.mjs' }))
```

Leaf packages can also ship `platforms/macos/` sources in C, ObjC, Swift, or
Zig. The CLI compiles them into separate libraries, extends app metadata, loads
them before JS, and signs them with the packaged app. Declare
`xplat.targets.macos.dev` for CLI-owned development with native rebuild/restart;
see [native macOS leaves](../platform/macos-native.md) for the package contract, toolchain,
language boundaries, and verification limits.

```json
{ "dev": { "viteConfig": "vite.dev.config.mjs", "bundleFile": "dist/dev/main.cjs" } }
```

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

```json
{ "xplat": { "targets": { "macos": { "renderer": "webview" } } } }
```

Configure `webViteConfig`, `hostViteConfig`, and `hostBundleFile` under both
`xplat.targets.macos.dev` and `.package`; packaging also requires `webOutDir`.
All paths are relative to the app root. `xplat doctor` checks this renderer
configuration. The frontend and host exchange typed calls, replies, events,
and capabilities through `@octane-xplat/platform/host`; see the
[WKWebView host guide](../platform/macos-webview.md) for configuration and custom services.

```json
{
	"dev": {
		"webViteConfig": "vite.webview.config.mjs",
		"hostViteConfig": "vite.webview-host.config.mjs",
		"hostBundleFile": "dist/webview-host/host.cjs"
	},
	"package": {
		"webViteConfig": "vite.webview.config.mjs",
		"hostViteConfig": "vite.webview-host.config.mjs",
		"hostBundleFile": "dist/webview-host/host.cjs",
		"webOutDir": "dist/web"
	}
}
```

## Experimental Windows target

Windows is not available in the app starter, and a supported downstream setup
is not provided yet. The framework repository has a private experimental WinUI
3 harness; its test-host instructions and preview dependency pins are for
framework contributors, not downstream apps. See [Windows support status](../platform/windows-setup.md).

## Experimental Linux target (WebKitGTK webview)

Declare `xplat.targets.linux.runtime: 'webkitgtk'` and Linux package settings.
`pnpm xplat build --targets linux` builds the static frontend and ships the
GJS host, relocatable launcher, per-user installer, desktop entry, and tar archive.
Follow [Package a Linux WebKitGTK app](../platform/linux-package.md) for the complete
configuration, prerequisites, installation, URI handling, and verification flow.

```json
{
	"xplat": {
		"targets": {
			"linux": {
				"runtime": "webkitgtk",
				"package": {
					"applicationId": "com.example.MyApp",
					"productName": "My App",
					"executableName": "my-app",
					"viteConfig": "vite.linux.config.mjs"
				}
			}
		}
	}
}
```

The target renders DOM inside system WebKitGTK, with `.linux` → `.web` → shared
resolution. It uses the desktop host protocol for OS services. The real host
has been exercised on the Ubuntu 24.04 x86-64 VM on Andromeda; the macOS
WKWebView stand-in is development evidence only. `xplat dev linux`
continues to run the app's configured dev script; see the [harness host
notes](../../apps/linux/host/README.md) for its Vite/GTK loop.

A second, earlier-stage runtime value — `"gtk"` — renders native GTK4 widgets
through GJS instead of a WebView. It is only usable inside this repository
today (the renderer package is private and unverified at runtime); see
[Package a Linux GTK4/GJS app](../platform/linux-gtk.md).
