# macOS experiment

This experimental AppKit host runs the shared `@xplat/app` harness: its Home
shell, Apps gallery, all nine shared demos, and the Test tab with probes and
services. The adapted sweep drives the Home counter, routes into each demo,
checks representative state changes, and visits the Test surface.
The host exposes a `terminateAfterLastWindowClosed` option. The dev and
packaged app set it to `true`; `createAppKitWindow` defaults to AppKit's
keep-running behavior.

```js
// In apps/macos/src/main.ts, using this harness's host helper.
import { createAppKitWindow } from './appkit'

const host = createAppKitWindow({ terminateAfterLastWindowClosed: true })
// host.contentView is the NSView passed to createMacOSRoot below.
```

## Incoming route links

The primary AppKit root binds the platform's incoming links from its effect,
after outlet layout setup, and releases the binding on unmount. Route catalog
imports install definitions without consuming launch URLs. The private binding
buffers startup delivery until it has acquired cleanup, forwards through the
normal router and reports rejection/refusal with fixed messages. It keeps the
router's admission/cancellation policy; it does not bypass guards or retry blocked
links automatically. See [incoming-link ownership](../../docs/app/navigation.md#handle-incoming-links).

```tsx
// apps/macos/src/App.tsx owns the binding for this harness.
import { useEffect } from 'octane'
import { App } from '@xplat/app'
import { bindAppKitRouteLinks } from '@xplat/app/appkit-route-links.macos'

export default function AppKitApp(props: Parameters<typeof App>[0]) {
	useEffect(() => {
		try { return bindAppKitRouteLinks() }
		catch { console.warn('[macos] Incoming link setup failed') }
	}, [])
	return <App {...props} />
}
```

The actual entry catches setup errors with a fixed message. Nine source models
are authored, all unrun; they are not Octane effect or native URL-delivery proof.
Actual cold/warm launch, root/HMR disposal, routing/focus, scheme/signing and
installed consumers remain unqualified. Host setup precedes rendering; remount or
bind again after a setup failure. The private helper is harness machinery, not a
public framework API.

## Fonts

`@octane-xplat/macos-renderer` owns the AppKit driver and JSX declarations.
The app owns startup, windows, and host services. See the [renderer package](../../packages/macos-renderer/README.md)
for an independent consumer setup.

The renderer defaults to Apple's system font. This harness explicitly registers
Geist and selects it on each root to keep its demo typography consistent.
`src/fonts.ts` owns the font assets, license, and registration; the packaged
host embeds the font bytes and license. See [AppKit fonts](../../docs/app/styling.md#appkit-fonts)
for application font ownership and fallback behavior.

```js
// In the harness entry; fonts.ts registers the app-owned Geist descriptors.
import { harnessFontOptions } from './fonts'
import { createMacOSRoot } from '@octane-xplat/macos-renderer'

const root = createMacOSRoot(host.contentView, harnessFontOptions)
```

## System WebView backend

The macOS target can also run the full shared app through the system WKWebView.
Set `xplat.targets.macos.renderer` to `"webview"`; the CLI then builds the
`.web` frontend and a JavaScriptCore/NativeScript host. The sample configuration
in this app points to `vite.webview-app.config.mjs` and
`vite.webview-app-host.config.mjs`. See the [WKWebView host guide](../../docs/platform/macos-webview.md)
for configuration and the typed service protocol. AppKit remains the fallback
when no renderer is selected.

```json
{
	"xplat": {
		"targets": {
			"macos": { "runtime": "appkit-node-api", "renderer": "webview" }
		}
	}
}
```

The independent protocol proof runs with
`bun run --filter @xplat/macos webview:proof`; it verifies framework services,
capability discovery, an app-defined service and event, and deep-link delivery
inside a real WKWebView. `bun run --filter @xplat/macos webview:dev` launches that
proof fixture for manual development. The configured renderer uses the full
shared app from `apps/web/src/main.tsrx`.

`apps/macos` imports `App` from `@xplat/app`, and the app imports UI components
from `@octane-xplat/ui` without a Vite alias for the package root. The package's
`macos` condition selects `src/index.macos.ts` and matching declarations. This
is an explicit experimental AppKit surface: components without a host
implementation use visible unsupported leaves, and platform services without
an AppKit implementation report `unsupported` or `unavailable` rather than
simulating success. Most shared components now have real `.macos` leaves
ported from the self-drawn native leaves — `Popover` renders inline (no
NSPopover anchoring yet) and `Video`/`CameraView`/`Pager` remain
hosted-unsupported. Leaf chrome that web draws via `.vx-*` CSS is inlined
as style props in the macOS leaves. The `__xplatAppKit` host seam provides
appInfo, app state, window size, clipboard, `openUrl`, NSUserDefaults-backed
storage, system color scheme (with appearance-change KVO), deep links
(`application:openURLs:`), imperative sheets (`openSheet` presents a
dialog-kind window), and `openWindow` multi-window support.
The harness loads the same stylesheets as the mobile app (`src/styles.ts`:
UI tokens and chrome, `virtual:bamboo.css`, demo and app CSS). The renderer
applies them with NativeScript's selector engine; see
[Apply stylesheets](../../packages/macos-renderer/README.md#apply-stylesheets)
for the supported cascade and its limits. This does not promise general
NativeScript or web style parity. In particular, this harness does not validate every
exported component or every service. The current `List ×500` sweep checks
that a bounded row window mounts (more than zero and fewer than 500 rows)
and that dropping one updates the collection to 499 rows. This does not
establish large-list performance or sustained OS scrolling behavior.

```ts
// Shared service calls; the configured AppKit host supplies their implementation.
import { clipboard, openUrl, storage } from '@octane-xplat/platform'

await clipboard.writeText('Trip notes')
storage.setString('bag', 'Carry-on')
openUrl('https://example.com/trips')
```

The AppKit Vite config compiles the UI package's macOS leaves with its renderer
through `@octane-xplat/cli/macos/vite`. The preset resolves NativeScript
compatibility shims from `@octane-xplat/macos-renderer`. The UI package includes the leaf sources and local helpers needed by
the bounded root surface. `tsconfig.json` sets the `macos` custom condition so
TypeScript selects the matching declarations.

```js
// vite.config.mjs
import { defineConfig } from 'vite'
import { xplatMacOS } from '@octane-xplat/cli/macos/vite'

export default defineConfig(({ mode }) => xplatMacOS(mode))
```

In development, Node runs Vite's bundle watcher and launches the same
JavaScriptCore host used for packaging. A stable CommonJS shell owns the AppKit
window, renderer, and Octane runtime. Vite rebuilds a separate component bundle;
after each successful build, the host evaluates it in the existing JavaScriptCore
environment and passes it to Octane's universal HMR wrapper. Component state
survives successful edits. A compile error leaves the last good component
mounted; a later valid edit can recover without restarting the host. The dev
host uses the CLI's rebuilt NativeScript framework, not the package's Node
addon. The package supplies TypeScript declarations and its license. This uses
Vite's bundle watcher and Octane's component HMR API; it does not use
NativeScript's `/ns-hmr` HTTP-ESM transport.

From `apps/macos`, run `bun run xplat dev macos` to launch it, or
`bun run xplat build --targets macos` to create the `.app` and `.dmg`. The app's
`package.json` opts in with `xplat.targets.macos.runtime: "appkit-node-api"`
and supplies product/package metadata under `xplat.targets.macos.package`.
The app's `dev` script is `xplat dev macos`, which launches the CLI's own dev
loop (`macos/dev-entry.mjs`) because this app declares
`xplat.targets.macos.dev`; `xplat build` owns the shared
`.app`/`.dmg` packaging, signing, and optional notarization flow. The local
`package` script is only an alias for `xplat build --targets macos`.
`xplat doctor` checks the AppKit host, Mac architecture, package
metadata, declared runtime dependency, and packaging tools without requiring
the NativeScript CLI, iOS simulator, or Android SDK. This target is experimental.
Packaged apps are universal binaries for Apple Silicon and Intel Macs. Packaging uses a pinned, statically linked Mach-O host
and system JavaScriptCore; it does not download or bundle Node.

```sh
# Run from apps/macos.
bun run xplat doctor
bun run xplat dev macos
bun run xplat build --targets macos
```

With `OCTANE_MACOS_AUTOMATION=1`, the dev host runs the adapted macOS harness
sweep through the AppKit renderer's debug interface. It reports route and
interaction assertions in the process log, and accepts `tap`, `press`,
`snapshot`, and `parity` commands on stdin. Run
`bun run --filter @xplat/macos parity` to write AppKit geometry and selected style
measurements to `parity-report/macos.json`. From the workspace root,
`bun run parity:macos` rebuilds the web and macOS measurements and compares their
shared fixtures. The sweep compares geometry and selected style values.
For a focused HMR check, run `node apps/macos/scripts/verify-hmr.ts` from the
repository root.

### Non-visual smoke checks

From the repository root on an Apple Silicon Mac, initialize the vendor
submodules and install before checking the harness:

```sh
git submodule update --init
bun install --frozen-lockfile
bun run typecheck:macos
bun run --filter @xplat/macos build
bun run smoke:macos
```

`smoke:macos` requires all 30 assertions in the existing shared harness sweep,
then runs the isolated AppKit UI ref-animation and layout-placement fixtures
and the maintained signals, counter, and Lottie probes. A missing assertion, failure,
host exit, or timeout fails the command. These checks inspect native view state
and dispatch AppKit actions; they do not prove OS mouse input, hit-testing,
visual parity, or animation playback in Lottie.

The layout-placement regression checks nested absolute and grid panels in a real
AppKit window: declared child frames, full-width interior rows, growing scroll
height, repeated solver passes, and window resize without host shrinkage or
repositioning. Run it independently with:

```sh
bun run --filter @xplat/macos test:layout-placement
```

Lottie has an explicit macOS leaf: it displays an unsupported label, calls
`onError` on mount, and supplies no playback handle or loaded/ended events.
The motion-package probe route also reports unsupported on AppKit; its mobile
gesture and reduced-motion imports are excluded by the generated macOS route
manifest. UI ref animation is checked independently and does not establish
support for `@octane-xplat/motion`. Home uses the shared Bamboo probe class;
its generated stylesheet ships in the bundle with the app CSS.

Measured on 2026-10-25 with `bun run --filter @xplat/web parity`,
`bun run --filter @xplat/macos parity`, and
`node scripts/parity-check.ts --targets=web,macos`: loading CSS raised the
AppKit result from 913 to 963 of 1145 checks, and no check that passed before
fails. (The pre-CSS build needed the `Screen` export fix to run.) The macOS
sweep took 182 s, against 172 s before CSS.

After adding or changing a platform route, run
`bun run --cwd packages/app xplat routes` so the eager manifest excludes
overridden files before bundling them. Install runs declaration generation;
checking while postinstall is still running can report stale route types.
Published declaration verification is a separate boundary from these source
and harness checks.

The AppKit packaging recipe's AC7 still describes the earlier all-rows list
fallback. That criterion remains unchanged and is not satisfied by the current
windowed-list check; its reconciliation belongs to the VirtualList workflow.

Screenshot-led comparison also exists: `node apps/web/scripts/parity-shots.ts`
captures the web parity stage in Playwright (640x420 viewport at 2x, ~300pt
scroll steps) and `node apps/macos/scripts/parity-shots.ts` drives the AppKit
host through the same scroll sweep, writing `shot-NNN.png` plus a
`shot-NNN.cells.json` sidecar per step under `parity-report/shots/`. The macOS
driver cannot capture its own window; it signals each pending capture through
the window title (`title shot-NNN` stdin command), so an external capturer —
Goddard Computer Use via `get_window_state` — polls the title and writes each
PNG to the expected path. `node scripts/parity-shots-compare.ts --diffs` then
pairs per-fixture crops by window-space geometry (not shot index, so tab-bar
and title chrome differences do not bias the result) and ranks fixtures by
pixel difference. Additional automation stdin commands: `scrolltop <n>`,
`cells`, `frame <id>`, `ancestors <id>`, `style <id> <prop> <n>` (applies a
style and reports the node's window frame).

Per-fixture diffs rank text baseline offsets (~1pt) and anti-aliasing as the
main residual gaps; labels, spacing, padding, and self-drawn controls match
closely. The AppKit parity stage mounts inline in place of the whole app
shell — pushed root routes present as dialog surfaces that automation cannot
hold open long enough to measure. The window holds
its 640x420 content size: the contentView carries required width/height
constraints so AppKit can't drag the window to the content's fitting size,
and stack children get per-side margins via a transparent wrapper view
(NSStackView lacks child margins).
This CLI target does not add macOS to the `create-octane-xplat` starter or the
supported web/iOS/Android release contract.

`bun run --filter @xplat/macos bench:virtual-list` compares the all-rows fallback
with an AppKit-only fixed-height windowing prototype at 500, 2,000, and 5,000
items. The prototype slices the array around the scroll position and inserts
spacer views. It uses an internal AppKit scroll callback; it does not change the
shared `VirtualList` API. The probe jumps to the end of the list and checks that
the mounted and mapped row counts stay within 32 and that the correct final row
is mounted. Set `OCTANE_MACOS_VLIST_SIZES` to choose other sizes (up to 10,000)
or `OCTANE_MACOS_VLIST_MODES=windowed` to run only the windowing probe.

For example, run just the windowed probe at 500 and 1,000 items:

```sh
OCTANE_MACOS_VLIST_SIZES=500,1000 OCTANE_MACOS_VLIST_MODES=windowed bun run --filter @xplat/macos bench:virtual-list
```

These figures were collected before the JavaScriptCore dev-host migration and
are historical Node-host measurements. New benchmark runs measure the
JavaScriptCore host's RSS and CPU; JavaScriptCore heap usage is reported
as `null` because the host does not expose it. The fixed-height windowed
figures are from the Apple Silicon rerun after correcting for AppKit's default
14pt vertical stack gap:

| Mode     | Items |                Initial render | RSS increase |                    Mounted rows |
| -------- | ----: | ----------------------------: | -----------: | ------------------------------: |
| All rows |   500 |                        137 ms |     18.7 MiB |                             500 |
| All rows | 2,000 |                      1,133 ms |    135.6 MiB |                           2,000 |
| All rows | 5,000 | Process killed before metrics |            — |                               — |
| Windowed |   500 |                       17.7 ms |      2.3 MiB |   24 → 16 (rows 484–499 at end) |
| Windowed | 2,000 |                       16.2 ms |      2.2 MiB | 24 → 16 (rows 1984–1999 at end) |
| Windowed | 5,000 |                       16.6 ms |      2.1 MiB | 24 → 16 (rows 4984–4999 at end) |

Both AppKit windowing prototypes now include the stack gap in their spacer
heights. The fixed-height benchmark also asserts that the total document height
is unchanged between the initial and end-of-list windows.

Render timing covers bundle import and the initial Octane render/commit, but not
the bundle build or later AppKit layout. RSS increase is sampled around initial
render. The end-of-list check uses a programmatic AppKit scroll, not a sustained
trackpad or wheel fling; it does not measure frame time, variable-height rows,
or long-session behavior. The results show that bounded AppKit mounting is
feasible for fixed-height rows, but do not establish production `VirtualList`
behavior.

`bun run --filter @xplat/macos bench:virtual-list-scroll` adds a 5,000-row
variable-height probe (32/48/64pt rows) with 180 programmatic 8pt offset
updates at about 16ms intervals, followed by midpoint and end seeks. In the
latest Apple Silicon run, the document stayed at its expected 309,970pt height,
the window mounted at most 24 rows, and all three row heights were present at
the end. Across 182 `onScroll` notifications, range commits were 6.61ms at p95
(17.92ms max); the 16ms main-loop heartbeat was 21.13ms at p95 (32.95ms max,
zero intervals above 33.3ms).
Those scroll figures were also collected with the former Node dev host; they
have not been remeasured under JavaScriptCore.

The fixed-height benchmark models a 44pt row with no inter-row gap — the
AppKit stack's default spacing is 0 (web parity). A previous revision assumed
a 14pt default gap and reported a document-height mismatch until the bench was
updated. The full AppKit geometry parity sweep
now mounts all 104 fixtures and produces a dump — set
`OCTANE_MACOS_PARITY_FIXTURES=name1,name2` to scope the stage to a subset
while debugging. `scripts/parity-check.ts --targets=web,macos` currently
evaluates 1110 checks; a handful of checks keep `macos` out of `equalTargets`
where the facet is inherently CSS- or font-metric-driven (stepper/navmenu
active-item boxes, the command-palette list width). The sweep pins
`themePreference` to `light` before measuring so a dark host scheme does
not skew control-color facets.
The historical Node-host measurements above are not JavaScriptCore results.

This drives the clip view with `scrollToPoint`, so it measures the bounds-change
and Octane range-update path under sustained offset changes. It is not a
`scrollWheel:` or physical trackpad test. A synthetic Quartz wheel stream
produced zero AppKit scroll notifications: `loginwindow` remained the
frontmost app and the Node host could not activate, so the events did not reach
the test window. The heartbeat is a responsiveness proxy, not display frame
pacing; real wheel/trackpad behavior and actual frame times remain unproven.
This remains an app-local prototype, not a change to the shared `VirtualList`
API.

## Packaging proof

`bun run --filter @xplat/macos package` delegates to the CLI to build a universal
`.app` and compressed `.dmg` for Apple Silicon and Intel Macs. Every build verifies SHA-256 checksums
of the pinned host, NativeScript framework, and metadata before running Vite.
The statically linked host lives in `Contents/MacOS`, loads system
JavaScriptCore, initializes the compatible Node-API addon from
`Contents/Frameworks`, then evaluates `Resources/app/main.cjs`. Per-architecture
metadata (`metadata.macos.arm64.nsmd`, `metadata.macos.x86_64.nsmd`) and the
JavaScript host shim live in `Contents/Resources`. No Node executable or
JavaScript engine binary is bundled. The bundle targets macOS 13.5 or later.
Artifacts are written under
`apps/macos/artifacts/macos-universal/` so dev builds do not clean them.

The host accepts one bundled CommonJS entry. Vite must bundle ordinary
dependencies. Set `build.rollupOptions.external` to
`['@nativescript/macos-node-api', /^node:/]`, as in the
[independent fixture](../../packages/cli/test/fixtures/macos-jsc-app/vite.config.mjs).
External imports are limited to `@nativescript/macos-node-api` and
`node:crypto`, `node:fs`, `node:os`, and `node:path`; packaging rejects
other `require()` imports and dynamic `require()`. The supported Node subset is
`crypto.createHash('sha256').update(data).digest('hex')`, synchronous `fs`
`mkdirSync`/`existsSync`/`readFileSync`/`writeFileSync`, `os.homedir()`, and
`path.join`/`path.resolve`. Globals include `console`, `process.env` reads,
`process.cwd()`, `Buffer.from(base64, 'base64')`, timers, `queueMicrotask`,
`AbortController`/`AbortSignal`, and `WebSocket` (backed by
`NSURLSessionWebSocketTask`; `ws:` and `wss:` URLs, text and binary
`ArrayBuffer` messages, `binaryType` stays `'arraybuffer'`). Packaging rejects static calls to unsupported host members;
the shim also throws `Unsupported macOS host API` for unsupported runtime
access. Use the AppKit ObjC bridge for native UI and services; general Node
modules are outside this host contract.

```js
// This synchronous host subset is available in the packaged JavaScriptCore app.
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

const bytes = readFileSync(join(homedir(), 'trip-notes.txt'))
console.log(createHash('sha256').update(bytes).digest('hex'))
```

Bridge notes for delegate/protocol work: import the Objective-C framework
first (`objc.import('AuthenticationServices')` etc.) so protocol constants
resolve, then register classes with `NSObject.extend(members, { protocols,
exposedMethods })` — class syntax plus `NativeClass` registers the class but
not its methods on this runtime, so delegate callbacks never fire. JS
functions marshal into ObjC blocks both synchronously and asynchronously on
the main queue (verified via `enumerateObjectsUsingBlock` and
`NSOperationQueue.mainQueue`). Provider flows that consult Apple daemons —
`ASAuthorizationController.performRequests`,
`ASAuthorizationAppleIDProvider.getCredentialStateForUserID` — go unanswered
from this unsigned dev binary; a completed ceremony needs the packaged app
signed with the matching entitlement.

```js
// The JavaScriptCore host supplies the ObjC bridge after runtime initialization.
objc.import('AuthenticationServices')

const CredentialObserver = NSObject.extend(
	{
		credentialRevoked() {
			console.log('Credential revoked')
		},
	},
	{
		exposedMethods: {
			credentialRevoked: { returns: interop.types.void, params: [] },
		},
	},
)
const observer = CredentialObserver.new()
```

The native inputs and source revisions are recorded in
`packages/cli/src/macos/jsc-host/prebuilt/manifest.json`. The adjacent
`build-runtime.sh` rebuilds the statically linked host and compatible
framework from pinned upstream revisions, the checked-in metadata snapshot,
and the reviewed source patches. It builds arm64 and x86_64 slices and combines them with `lipo`. Run it on
Apple Silicon with Xcode, CMake,
pnpm, Node headers, and Homebrew development headers; `--install` updates the
CLI's prebuilt files and checksums. Its scratch clones and outputs stay under
gitignored `research/`.

From the repository root, run `node packages/cli/test/verify-macos-jsc.mjs`
to build an independent unsigned fixture app, boot its packaged executable,
and check the unsupported-import diagnostic. Run
`node packages/cli/test/verify-macos-websocket.mjs` to exercise the host's
`WebSocket` global against a real echo server. Both scripts leave artifacts
under gitignored `research/` for inspection.

Set the optional `icon` package field to an app-root-relative `.icns` file to
include a custom app icon in packaging and development. The CLI validates the path, copies it to
`Contents/Resources/AppIcon.icns`, and sets `CFBundleIconFile` in `Info.plist`.

```json
{
	"xplat": {
		"targets": {
			"macos": { "package": { "icon": "assets/AppIcon.icns" } }
		}
	}
}
```

Without signing configuration, the app is ad-hoc signed for local use. Set
`MACOS_SIGNING_IDENTITY` to a Developer ID Application identity to sign the app
and disk image for distribution. The app host and framework use the same
packaging signing flow. For notarization,
save a credential profile in Keychain. Replace the sample Apple ID, Team ID,
and signing identity with your own; `notarytool` prompts for the app-specific
password:

```sh
APPLE_ID="you@example.com"
TEAM_ID="ABCDE12345"
xcrun notarytool store-credentials octane-notary --apple-id "$APPLE_ID" --team-id "$TEAM_ID"
unset APPLE_ID TEAM_ID
export MACOS_SIGNING_IDENTITY="Developer ID Application: Example Company (ABCDE12345)"
export MACOS_NOTARY_PROFILE=octane-notary
bun run xplat build --targets macos
```

Run the build from `apps/macos`; the CLI signs and verifies the app and disk
image, submits the image, staples the ticket, and validates it. See
[Apple's notarytool credential guidance](https://developer.apple.com/documentation/technotes/tn3147-migrating-to-the-latest-notarization-tool).

The AppKit target remains experimental pending validation across supported
macOS versions and notarized distribution. Signing and notarization remain
available in the CLI but were not exercised in this JavaScriptCore change.
The packaged host's AppKit event
loop, window close, and runtime error behavior should be checked in each app;
the in-repository sweep covers its shared harness, not every AppKit API.

## Embedded WebView verification

The shared `@octane-xplat/ui` `WebView` embeds WKWebView inside an AppKit screen;
it is separate from the system WebView app-shell backend above.
Run `bun run --cwd apps/macos node test/verify-webview.mjs` from the
repository root for the isolated compiled component fixture. It exercises real
WebKit load callbacks, reload, HTML replacement, local-file history and errors,
content measurement and unmount cleanup without screenshots. Delegate tests run with
`bun run --filter @octane-xplat/macos-renderer test`. Those simulated callbacks do
not establish OS input or hit-testing.

## In-app browser source fixture

The AppKit harness declares `@octane-xplat/web-browser` so its native package
collector includes the owned Swift/WebKit browser bridge. The manual fixture
starts with an empty address and opens only after an explicit action. Its runner
records controls mounting, not browser presentation or network behavior.

```sh
bun run probe run apps/macos/test/fixtures/browser-service.macos.tsrx --target macos --watch
```

A scoped Turbo package task orders app and CLI build prerequisites before the
existing native packaging script. This is an expensive native build/package
operation, separate from ordinary PR checks. Swift/class discovery, actual
navigation/close/AX and clean packaged consumers remain unqualified.

```sh
goddard-agent resource run --json '{"resources":{"native_builds":1},"purpose":"AppKit native package"}' -- bun run turbo run package --filter=@xplat/macos
```

The idle dialog page lets a human check website labels, alert/confirm results,
prompt defaults, empty text versus Cancel, sequential sheets and keyboard/IME/
VoiceOver. Serve it locally, then enter the printed host and port plus
`/browser-dialogs.html` in the browser-service fixture. Close or replace the
browser from the app while a dialog is open and verify completion and teardown.
These steps have not run; local HTTP remains subject to the app's network/ATS policy.

```sh
python3 -m http.server 8765 --bind 127.0.0.1 --directory apps/macos/test/fixtures
# In the browser-service fixture, open http://127.0.0.1:8765/browser-dialogs.html
```

For page attachments, open `/browser-file-selection.html` on that same deferred
server. Its labeled single/multiple/image-hint/directory inputs display metadata
only; they do not read contents or send files. Check selection, Cancel, repeated
selection/reset, close/replacement during picking, directory delivery, keyboard
and VoiceOver. The public WebKit picker parameters expose no accepted types, so
HTML accept hints do not guarantee a native filter. Actual file delivery,
directory enumeration, sandbox grants and upload transport remain unqualified.

```text
http://127.0.0.1:8765/browser-file-selection.html
```
