# Linux WebKit consumer regression baseline

> Preserve existing Linux applications while adding another renderer. This record separates source contracts, checks run on macOS, and Linux runtime qualification still needed.

Plan item **6a**, recorded 2026-10-11 (America/New_York), at
`474aed8d2945a6b59369313f9e30b5ef1f2e1f66`. This is research evidence, not authority
to implement GTK. The existing renderer is an experimental **DOM frontend inside
WebKitGTK**, hosted by GJS, GTK4 and libadwaita. GTK success is independent of this
baseline. No Linux runtime or visual analysis was performed for this assignment.

## Current consumer contract

Linux is manually configured in an existing static Octane/Vite frontend. The
starter and `xplat add` currently offer web, iOS and Android, not Linux
([scaffold target registry](../../../packages/create/scaffold.mjs), lines 27–104).
Use the [consumer setup guide](../../../docs/platform/linux-package.md) and its maintained
[fixture](../../../packages/cli/test/fixtures/linux-app/package.json):

```json
{
	"version": "1.0.0",
	"xplat": {
		"targets": {
			"linux": {
				"runtime": "webkitgtk",
				"host": { "scheme": "linux-proof" },
				"package": {
					"applicationId": "org.octane.LinuxProof",
					"productName": "Linux Consumer Proof",
					"executableName": "linux-proof",
					"viteConfig": "vite.linux.config.mjs"
				}
			}
		}
	}
}
```

| Surface                   | Existing behavior and source                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Renderer selection        | `hasLinux` recognizes only `runtime: 'webkitgtk'`; absent/other runtime does not declare a Linux target. Packaging separately rejects other runtimes. There is no native selector, preference/fallback policy, or post-mount switch. [targets](../../../packages/cli/src/targets.ts), lines 35–37, 139–147, 185–187; [config](../../../packages/cli/src/linux/config.ts), lines 4–11.                                                                                                                                                              |
| Identity validation       | Reverse-DNS ID, at most 255 characters; nonempty single-line product name without control characters; executable limited to letters/digits/underscore/hyphen, starts alphanumeric, cannot be `host` or `bundle`. Version is package override or manifest version and must match the validator's semantic-version pattern. [config](../../../packages/cli/src/linux/config.ts), lines 13–52.                                                                                                                                                         |
| URI and build config      | Scheme defaults to `xplat`, must be lowercase custom URI syntax, excludes `http`, `https`, `file`, `data`, `javascript`. Vite config defaults to `vite.linux.config.ts`, must exist and pass relative/in-app lexical path validation. [config](../../../packages/cli/src/linux/config.ts), lines 15, 54–73.                                                                                                                                                                                                                                         |
| Consumer resolution       | Vite conditions `['linux', 'web']`; Linux suffix precedes web within each extension family, then shared. TypeScript uses `moduleSuffixes: ['.linux', '.web', '']`, DOM libraries and the same conditions. Existing `.linux` leaves are web-host adaptations, not GJS application code. [Vite config](../../../apps/linux/vite.linux.config.ts), lines 19–40; [TypeScript config](../../../apps/linux/tsconfig.json), lines 4–9.                                                                                                                      |
| Public package boundary   | CLI exports `@octane-xplat/cli/linux` with `packageLinux`; the platform package publishes Linux root/subpath conditions into `dist/linux`, plus explicit bridge and desktop-client entries. [CLI manifest](../../../packages/cli/package.json); [platform manifest](../../../packages/platform/package.json).                                                                                                                                                                                                                                        |
| Development               | `xplat dev --targets linux` delegates to the app-owned `pnpm run dev`; it does not supply a generic Linux development host. The repository harness starts Vite on strict port 5201, waits for HTTP readiness, launches GJS on Linux and a Swift WKWebView stand-in on macOS, and stops when host/server exits. A consumer must avoid making its delegated `dev` script recurse into this command. [CLI dev](../../../packages/cli/src/commands/dev.ts), lines 38–40; [harness dev](../../../apps/linux/scripts/dev.mjs), lines 14–88.               |
| Discovery and diagnostics | CLI lists experimental WebKitGTK build/dev targets even on macOS. Doctor checks package config and tar everywhere; on Linux also GI bindings, GTK 4.10+, display variable and session-bus variable. It does not prove keyring unlock or functional desktop services. MCP independently detects `webkitgtk`, allows packaging off Linux, but blocks actual launch/discovery off Linux. [doctor](../../../packages/cli/src/commands/doctor.ts), lines 517–568; [MCP adapter](../../../packages/cli/src/mcp/runtime/adapters/linux.ts), lines 21–143. |

The existing fixture initializes the Linux adapter before calling the desktop
client ([frontend](../../../packages/cli/test/fixtures/linux-app/src/main.web.tsrx),
lines 1–10):

```ts
import '@octane-xplat/platform/bridge.linux.ts'
import { desktopHost } from '@octane-xplat/platform/host/web'

const host = desktopHost()
if (!host) throw new Error('Linux host transport is missing')
```

## Build, installation and application identity

These are the established build/install commands; execute launch and URI
registration on Linux, with a disposable app ID and isolated test directories:

```sh
pnpm exec xplat build --targets linux
# For the fixture identity above, on Linux:
tar -xzf dist/linux/linux-proof-1.0.0.tar.gz
./linux-proof/linux-proof
./linux-proof/install.sh
xdg-mime default org.octane.LinuxProof.desktop x-scheme-handler/linux-proof
```

| Contract                       | Source evidence                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Build ownership/output         | CLI calls the app's declared Vite directly, forces base `/`, requires static `bundle/index.html`, and copies its shipped host. It emits `dist/linux/<executable>/` and `<executable>-<version>.tar.gz`; staging preserves the previous app on frontend failure. No runtime libraries are bundled; `app.json` currently records no explicit renderer or fallback policy. [packager](../../../packages/cli/src/linux/package.ts), lines 24–167.                                                          |
| Relocation and installation    | Launcher derives paths from itself and passes absolute `--bundle`; installation defaults to `${XDG_DATA_HOME:-$HOME/.local/share}/<applicationId>`. Installer requires Python 3, writes an absolute quoted desktop `Exec`, and preserves `%u` URI forwarding. Scheme registration is explicit, not performed by installation. Desktop metadata includes product name, scheme and `StartupWMClass`; `DBusActivatable=false`. [packager](../../../packages/cli/src/linux/package.ts), lines 84–138.      |
| Host launch overrides          | Host bundle lookup tries `--bundle`, `XPLAT_BUNDLE_DIR`, host-relative bundle and working-directory fallbacks; HTTP URL arguments allow development. `--self-test`, `XPLAT_SELFTEST_SCRIPT` and `XPLAT_LOG_CONSOLE=1` control diagnostics; `XPLAT_PROBE_APP_ID` isolates probes. These are existing WebKit host controls, not native-renderer selection. [host](../../../packages/cli/src/linux/host/gjs-host.js), lines 17–64, 1009–1033, 1222–1275.                                                   |
| Runtime requirements/failure   | Runtime requires GJS, GTK4 4.10+, libadwaita, WebKitGTK 6.0 GI API, libsecret, graphical session and D-Bus. Launcher explicitly checks only GJS and exits 1 with installation guidance when absent; it relies on host/GI errors for other missing dependencies. There is no unified renderer startup diagnostic/log policy yet. [launcher/README generation](../../../packages/cli/src/linux/package.ts), lines 84–138; [host imports](../../../packages/cli/src/linux/host/gjs-host.js), lines 12–15. |
| Identity ownership             | `app.json` supplies application ID, product name and scheme. ID names the `Adw.Application`, Secret schema, config storage and private media paths. Default unconfigured host identity is `org.octane.xplat`. `XPLAT_PROBE_APP_ID` can override the runtime ID for probes. [host](../../../packages/cli/src/linux/host/gjs-host.js), lines 19–33, 155–175, 324–343.                                                                                                                                     |
| Runtime app information caveat | Host returns ID as `bundleId`, but version/build are null for normal packages: generated `app.json` contains only ID/name/scheme, whereas `appInfo` reads version/build from it. Archive naming still uses the configured version. Do not treat runtime version reporting as qualified behavior. [packager](../../../packages/cli/src/linux/package.ts), lines 68–82; [appInfo](../../../packages/cli/src/linux/host/gjs-host.js), lines 291–296.                                                      |
| Startup/content/deep links     | Bundle loads at `<scheme>://localhost/`, with secure/CORS scheme registration and SPA fallback. `HANDLES_OPEN` forwards additional invocations over D-Bus. Cold-start URL is injected before frontend execution; subsequent links queue until load or emit to the running frontend. Content-prefix URIs select content, other URI arguments become incoming links. [host](../../../packages/cli/src/linux/host/gjs-host.js), lines 38–64, 94–158, 1104–1141, 1285–1342.                                 |
| Persistence/lifecycle          | Normal secure storage uses the default Secret Service collection with an app-ID schema and asynchronous operations. Self-test writes use the session collection. Main window starts at 1024×768, uses product name, emits state/resize changes and supports secondary webviews. Actual close/reopen and external activation remain Linux qualification cases. [host](../../../packages/cli/src/linux/host/gjs-host.js), lines 830–864, 1163–1342.                                                       |

## Existing coverage and checks run

Host for this assignment: **Darwin arm64**, Node **v26.10.0**, pnpm **11.24.0**.
Passing unit tests below use fakes/VM contexts where stated; none launches Linux.

| Check                                                                                                 | Result and evidence boundary                                                                                                                                                                                                                                                                        |
| ----------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `node --test packages/cli/test/linux-package.test.mjs packages/mcp/tests/discovery.test.mjs`          | 12 passed, 0 failed. Three packaging tests use a fake Vite executable but real tar, shell installer and Python: relocation, spaces/`$`/`%` path escaping, metadata, invalid identity/injection/traversal rejection, previous-app preservation. Nine MCP discovery tests include target recognition. |
| `node --test packages/platform/tests/deep-links.test.mjs packages/platform/tests/keep-awake.test.mjs` | 14 passed, 0 failed. Includes Linux initial-link consumption and mocked host keep-awake cookie ownership; no OS input, GJS or desktop-session qualification.                                                                                                                                        |
| `pnpm --filter @octane-xplat/platform test:packed`                                                    | Passed all native/web/Linux/macOS root, host and hook bundle checks. Builds/packs the real package and resolves published entries without workspace aliases. This is package/bundler evidence, not a running consumer host.                                                                         |
| `pnpm typecheck:linux`                                                                                | Passed: 18 Turbo tasks completed after a frozen reinstall restored the missing existing `@octane-xplat/lib` workspace link. Initial typegen failed with TS2307; no tracked dependency changes.                                                                                                      |
| `pnpm --filter @xplat/linux exec xplat build --targets linux`                                         | Passed after the frozen reinstall: real Vite frontend, shipped GJS host, launcher/installer and `octane-xplat-0.0.0.tar.gz` produced. The interrupted retry was restarted to obtain exit 0; no GJS launch occurred.                                                                                 |
| `pnpm build:docs`                                                                                     | Passed Vite production build and llms output generation.                                                                                                                                                                                                                                            |
| `pnpm check:recipes`, local link/JSON checks                                                          | Passed recipe structure/local links, all baseline source links, and JSON example parsing.                                                                                                                                                                                                           |

[Linux packed-consumer verifier](../../../packages/cli/test/verify-linux-consumer.mjs),
lines 12–130, exists but was **not executed**: it explicitly requires Linux. It
installs CLI/platform tarballs into an independent real Octane fixture, builds,
relocates, installs under a path with spaces/`$`/`%`, validates desktop metadata,
starts Xvfb/private D-Bus/keyring/notification services, checks frontend mount,
cold link injection, persistent secrets across restart, app-ID isolation,
second-instance links and explicit URI association. It launches from `/tmp` and
keeps WebKit's sandbox enabled. Association-file verification is not an
`xdg-open` end-to-end delivery assertion.

The [bridge self-test](../../../packages/cli/src/linux/host/bridge-selftest.linux.js)
checks capabilities, initial snapshot, legacy/typed transport, clipboard,
storage, secrets, notification calls, appearance, file reads, secondary-window
close events, deep-link emission and unknown-call rejection. File-picker user
interaction, real input and actual notification presentation are not checked.
The [harness smoke](../../../apps/linux/scripts/smoke.mjs) substitutes the maintained
[UI sweep](../../../apps/linux/host/harness-selftest.web.js), and rejects non-Linux
hosts. Existing documentation describes an Ubuntu 24.04 x86-64 OrbStack proving
ground; that historical description is not a fresh pass at this revision.

The current [CI workflow](../../../.github/workflows/ci.yml) runs CLI/unit tests and
packed package checks, but does not invoke this Linux consumer verifier, Linux
harness smoke, or `typecheck:linux`. An Ubuntu CI worker alone is not Linux
WebKit runtime evidence.

## Gaps and checks GTK work must preserve

**Existing verifier drift:** the consumer verifier waits for the literal
`SELFTEST_RESULT {"checks":24,"failed":[]}` (line 91). The shipped host advertises
camera; the self-test adds seven camera checks (lines 145–197), making a successful
current Linux run report **31** checks. Therefore the verifier's expected success
marker is stale by source inspection. Linux timeout behavior was not reproduced.
Correct the verifier in a separately authorized implementation change before
using it as a green regression gate; retain named check assertions and failure
exit semantics rather than weakening the gate. Local Silo observation:
`3fe5ab82-d58e-440c-ab68-ee3c454eb111`.

| Regression check          | Required evidence before claiming preservation                                                                                                                                                                                                                                                           |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Existing/default renderer | Existing `webkitgtk` manifest still selects the DOM/WebKit mode after GTK is introduced; no implicit migration, native leaf substitution or new GJS requirement for its frontend. Check CLI/MCP discovery, doctor and published entry resolution.                                                        |
| Configuration failure     | Valid old manifests build unchanged; malformed IDs/names/executables/schemes, missing/outside config, missing Vite and non-static output fail before a usable package is published. Preserve previous output on frontend failure. Existing negative tests cover only a subset of these branches.         |
| Consumer resolution       | Packed consumer with Linux/web conditions and suffixes resolves Linux host adaptations before web/shared; shared UI remains DOM-backed in WebKit mode. Add explicit sentinel coverage for extension families and published maps; current packed checks prove bundling, not every suffix ordering branch. |
| Distribution              | Build real static frontend; archive/extract/relocate; install into isolated XDG paths; validate desktop entry; launch from arbitrary working directory without checkout, Node or dev server. Mac packaging tests are partial evidence; final launch needs Linux.                                         |
| Identity and persistence  | ID/name/scheme agree across metadata, installed paths, window, runtime snapshot, GApplication instance and Secret schema. Preserve persistence across restart and isolation between two IDs. Test same-ID activation and repeated incoming links using real D-Bus.                                       |
| Startup and lifecycle     | Real cold URI, warm second invocation, registered handler via `xdg-open`, main close/reopen, secondary close cleanup and nonzero failure/missing-self-test paths. Current verifier covers cold/warm links but not the full lifecycle or registered-handler dispatch.                                     |
| Dependencies/services     | Exercise missing GJS/typelibs, missing display/bus, locked/missing keyring and absent notification service; distinguish diagnostics from runtime readiness. Re-run bridge sweep with temporary secrets and recorded named checks.                                                                        |
| Real-host boundary        | Record distro/architecture, GJS/GTK/Adw/WebKit/libsecret versions, X11/Wayland and session services. Xvfb service smoke does not qualify compositor activation, chooser interaction, IME/keyboard/pointer input, accessibility, theme/scale changes or presentation parity. These remain explicit gaps.  |

This record changes no public workflow. Relevant future reconciliation is owned
by `linux-package` AC1–AC6 and `platform-leaves` AC4; neither recipe's completion
criteria is changed here. No AppImage, Debian/RPM package, sandboxed installation
or bundled Linux runtime is currently established by this baseline.
