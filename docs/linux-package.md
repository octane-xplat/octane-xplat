# Package a Linux WebKitGTK app

> Package your web screens as an experimental Linux desktop app.

This is an advanced setup guide for an existing app. Start with
[the browser app](toolchain.md#create-and-run) first. A **frontend** is the
part someone sees and interacts with; a **WebView** displays that web content
inside a desktop window. The **host** is the native program around it that
provides device features.

The experimental Linux target renders your frontend in the system WebKitGTK
WebView inside a GTK4/libadwaita window. It resolves `.linux` implementations,
then `.web`, then shared files. It uses the framework's desktop message protocol
for clipboard, secure storage, notifications, files, appearance, windows, and
incoming links. The mobile NativeScript renderer is not part of this target.

## Configure the app

Start with an existing Octane Vite frontend that builds a static `index.html`.
Declare `octane` and the framework packages you import as dependencies, and
`vite`, `@octanejs/vite-plugin`, and `@octane-xplat/cli` as dev dependencies.
Keep exact versions in the manifest. Server-rendered and library-only bundles
cannot be packaged by this target.

Add the Linux target to `package.json`:

```json
{
	"version": "1.0.0",
	"scripts": { "build": "xplat build --targets linux" },
	"xplat": {
		"targets": {
			"linux": {
				"runtime": "webkitgtk",
				"host": { "scheme": "my-app" },
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

Use a unique reverse-DNS `applicationId` for each app. It identifies the GTK
application, its secret-storage schema, installed directory, and desktop entry.
Apps with the same ID forward launches to the same running instance. The URI
`scheme` identifies incoming links; choose one owned by your app rather than
`http`, `https`, or `file`.

`productName` must be a nonempty single-line string. `executableName` permits
letters, digits, hyphens, and underscores, starting with a letter or digit.
`version` defaults to the top-level manifest version and must be a semantic
version. `viteConfig` defaults to `vite.linux.config.ts` and must stay inside
the app directory. Invalid settings fail before the build starts.

Create `vite.linux.config.mjs`:

```js
import { defineConfig } from 'vite'
import { octane } from '@octanejs/vite-plugin'
import { xplatBoundary } from '@octane-xplat/cli/vite'

export default defineConfig({
	plugins: [...octane(), xplatBoundary('linux')],
	resolve: {
		conditions: ['linux', 'web'],
		extensions: [
			'.linux.tsrx',
			'.web.tsrx',
			'.tsrx',
			'.linux.tsx',
			'.web.tsx',
			'.tsx',
			'.linux.ts',
			'.web.ts',
			'.ts',
			'.mjs',
			'.js',
			'.json',
		],
	},
})
```

Initialize the Linux adapter in the frontend entry, before using leaves that
access host services:

```ts
import '@octane-xplat/platform/bridge.linux.ts'
```

The [maintained consumer fixture](../packages/cli/test/fixtures/linux-app/)
provides the complete manifest, Vite config, HTML entry, and Octane screen.
It also exercises the typed desktop client and cold/warm incoming links.

## Check the runtime

On Ubuntu 24.04, install the runtime and installer tools:

```sh
sudo apt install gjs gir1.2-gtk-4.0 gir1.2-adw-1 gir1.2-webkit-6.0 \
  gir1.2-secret-1 python3 desktop-file-utils xdg-utils
pnpm exec xplat doctor
```

Execution requires Linux, GTK 4.10 or later, libadwaita, WebKitGTK's `6.0`
introspection API, libsecret, a graphical X11/Wayland session, and a session
D-Bus. Doctor checks the target configuration and archive tool; on Linux it
also checks typelibs, the GTK version, display, and session-bus environment.
A successful build on macOS does not prove that the Linux runtime works.

Your desktop normally supplies an unlocked Secret Service keyring (for example,
GNOME Keyring) and a freedesktop notification server. Missing services are
reported by host calls; `notifications.ensure` returns `unsupported` when no
notification server is present. Real app secrets use the persistent default
collection. The bundled automated self-test uses an in-memory collection and
never writes its test secrets into your persistent keyring.

## Build and install

Build with the CLI, rather than making its Linux target call your build script:

```sh
pnpm exec xplat build --targets linux
```

For the example above, output is:

```text
dist/linux/my-app/                 relocatable app directory
  app.json                        app identity and URI scheme
  bundle/                         static frontend
  host/                           shipped GJS host and bridge self-test
  my-app                          executable launcher
  install.sh                      per-user installer
  com.example.MyApp.desktop        desktop-entry template
  README.txt                      runtime and uninstall instructions
dist/linux/my-app-1.0.0.tar.gz      distribution archive
```

The CLI ships the host, builds the frontend itself, and packages both together.
It serves frontend assets at `my-app://localhost/`, including SPA fallback;
no Vite server, Node, pnpm, or source checkout is needed to run the archive.
Vite's asset base is set to `/` for this origin. Output is staged, so a frontend
build failure preserves the previous packaged app. The archive is a distribution
of the host script and frontend, not a bundle of system GTK/WebKit libraries.

Transfer the archive to Linux, then extract and launch it:

```sh
tar -xzf my-app-1.0.0.tar.gz
./my-app/my-app
./my-app/install.sh
xdg-mime default com.example.MyApp.desktop x-scheme-handler/my-app
xdg-open 'my-app://screen/settings'
```

`install.sh` copies the app into
`${XDG_DATA_HOME:-$HOME/.local/share}/com.example.MyApp` and generates a desktop
entry with the installed absolute launcher path. Paths containing spaces are
supported. Python 3 is needed only by the installer. URI-handler registration
is an explicit choice; installation does not replace another app's handler.
The installed launcher receives URI arguments through GTK's application `open`
signal. A cold launch loads the bundled frontend and injects the incoming URI;
a second launch forwards the URI to the running instance.

To uninstall, remove that app directory and
`${XDG_DATA_HOME:-$HOME/.local/share}/applications/com.example.MyApp.desktop`.
If you registered the URI handler, select a replacement with `xdg-mime`.
The app's persistent secrets remain in your keyring until removed through the
secure-storage API or your keyring manager.

## Verify before distributing

With a graphical session, session bus, unlocked keyring, and notification server:

```sh
./my-app/my-app --self-test
```

The host prints named `SELFTEST_STEP` results and one `SELFTEST_RESULT` summary.
It exits nonzero for failures, a missing test script, or a timeout. The sweep
checks capabilities, clipboard, temporary secrets, notifications, appearance,
file reads, secondary windows, incoming events, and rejection of unknown calls.
The application's frontend must initialize the Linux adapter for this test.
For an app-specific sweep, set `XPLAT_SELFTEST_SCRIPT` to the absolute path of
a trusted JavaScript file that reports `SELFTEST_RESULT` through `xplatLog`.
The harness [UI sweep](../apps/linux/host/harness-selftest.web.js) shows this
contract; a missing script or incomplete result fails the run.
Set `XPLAT_LOG_CONSOLE=1` to include frontend console messages during normal runs.

For automated verification in a headless Linux environment, install `xvfb`,
`dbus-x11`, `gnome-keyring`, and `notification-daemon`, then start the test with
Xvfb and a private D-Bus session. The [consumer verifier](../packages/cli/test/verify-linux-consumer.mjs)
starts those services and verifies the extracted archive, per-user installer,
real Octane mount, persistent secrets across app restarts, isolation between
app IDs, and second-instance link delivery. From the repository root:

```sh
mkdir -p /tmp/xplat-linux-packs
pnpm --dir packages/cli pack --pack-destination /tmp/xplat-linux-packs
pnpm --dir packages/platform pack --pack-destination /tmp/xplat-linux-packs
node packages/cli/test/verify-linux-consumer.mjs \
  /tmp/xplat-linux-packs/octane-xplat-cli-0.7.3.tgz \
  /tmp/xplat-linux-packs/octane-xplat-platform-0.7.3.tgz
```

Use the actual tarball versions printed by `pnpm pack` if they differ.
The verifier runs on Linux and leaves its app and runtime evidence in the
printed temporary directory. It keeps WebKit's sandbox enabled. It creates its own temporary keyring; it
does not read or change your desktop keyring.

Ubuntu 24.04 x86-64 under OrbStack on an Intel Mac is the current VM proving
ground. Headless checks verify host behavior and services, not visual parity,
physical input, file-chooser interaction, or every Linux desktop environment.
The Linux target remains experimental; there is no AppImage, Debian/RPM package,
sandboxed installer, or bundled system-runtime distribution yet.
