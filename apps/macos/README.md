# macOS experiment

This experimental AppKit host runs the shared `@xplat/app` harness: its Home
shell, Apps gallery, all nine shared demos, and the Test tab with probes and
services. The adapted sweep drives the Home counter, routes into each demo,
checks representative state changes, and visits the Test surface.
The host exposes a `terminateAfterLastWindowClosed` option. The dev and
packaged app set it to `true`; `createAppKitWindow` defaults to AppKit's
keep-running behavior.

`apps/macos` imports `App` from `@xplat/app`, and the app imports UI components
from `@octane-xplat/ui` without a Vite alias for the package root. The package's
`macos` condition selects `src/index.macos.ts` and matching declarations. This
is an explicit experimental AppKit surface: components without a host
implementation use visible unsupported leaves, and platform services without
an AppKit implementation report `unsupported` or `unavailable` rather than
simulating success. Most shared components now have real `.macos` leaves
ported from the self-drawn native leaves — `Popover` renders inline (no
NSPopover anchoring yet) and `WebView`/`Video`/`CameraView`/`Pager` remain
hosted-unsupported. Leaf chrome that web draws via `.vx-*` CSS is inlined
as style props in the macOS leaves. The `__xplatAppKit` host seam provides
appInfo, app state, window size, clipboard, `openUrl`, NSUserDefaults-backed
storage, system color scheme (with appearance-change KVO), deep links
(`application:openURLs:`), imperative sheets (`openSheet` presents a
dialog-kind window), and `openWindow` multi-window support.
The renderer maps a curated set of `className` tokens to
AppKit views; it does not load CSS stylesheets or promise general NativeScript
or web style parity. In particular, this harness does not validate every
exported component or every service. AppKit's shared `VirtualList` fallback
mounts every row at once. The `List ×500` sweep checks that all 500 row
components mount and that dropping one removes a row; it does not prove
virtualization or large-list performance.

The AppKit Vite config compiles the UI package's macOS leaves with its renderer
and still supplies app-local shims for NativeScript core and escape-prop
helpers. The UI package includes the leaf sources and local helpers needed by
the bounded root surface. `tsconfig.json` sets the `macos` custom condition so
TypeScript selects the matching declarations.

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

Run `pnpm xplat dev --targets macos` to launch it, or
`pnpm xplat build --targets macos` to create the `.app` and `.dmg`. The app's
`package.json` opts in with `xplat.targets.macos.runtime: "appkit-node-api"`
and supplies product/package metadata under `xplat.targets.macos.package`.
The CLI forwards dev to this app's `dev` script; `xplat build` owns the shared
`.app`/`.dmg` packaging, signing, and optional notarization flow. The local
`package` script is only an alias for `xplat build --targets macos`.
`xplat doctor` checks the AppKit host, Apple Silicon architecture, package
metadata, declared runtime dependency, and packaging tools without requiring
the NativeScript CLI, iOS simulator, or Android SDK. This target is experimental
and Apple Silicon only. Packaging uses a pinned, statically linked Mach-O host
and system JavaScriptCore; it does not download or bundle Node.

With `OCTANE_MACOS_AUTOMATION=1`, the dev host runs the adapted macOS harness
sweep through the AppKit renderer's debug interface. It reports route and
interaction assertions in the process log, and accepts `tap`, `press`,
`snapshot`, and `parity` commands on stdin. Run
`pnpm --filter @xplat/macos parity` to write AppKit geometry and selected style
measurements to `parity-report/macos.json`. From the workspace root,
`pnpm parity:macos` rebuilds the web and macOS measurements and compares their
shared fixtures. The sweep compares geometry and selected style values.
For a focused HMR check, run `node apps/macos/scripts/verify-hmr.mjs` from the
repository root.

Screenshot-led comparison also exists: `node apps/web/scripts/parity-shots.mjs`
captures the web parity stage in Playwright (640x420 viewport at 2x, ~300pt
scroll steps) and `node apps/macos/scripts/parity-shots.mjs` drives the AppKit
host through the same scroll sweep, writing `shot-NNN.png` plus a
`shot-NNN.cells.json` sidecar per step under `parity-report/shots/`. The macOS
driver cannot capture its own window; it signals each pending capture through
the window title (`title shot-NNN` stdin command), so an external capturer —
Goddard Computer Use via `get_window_state` — polls the title and writes each
PNG to the expected path. `node scripts/parity-shots-compare.mjs --diffs` then
pairs per-fixture crops by window-space geometry (not shot index, so tab-bar
and title chrome differences do not bias the result) and ranks fixtures by
pixel difference. Additional automation stdin commands: `scrolltop <n>`,
`cells`, `frame <id>`, `ancestors <id>`, `pin-window` (re-asserts the 640x420
content size after AppKit refits the window to constraint-driven content).

Per-fixture diffs rank text baseline offsets (~1pt) and anti-aliasing as the
main residual gaps; labels, spacing, padding, and self-drawn controls match
closely. The AppKit parity route keeps the host tab bar visible above the
stage, and AppKit still re-fits the window to content on commits — both are
harness quirks outside the per-fixture comparison.
This CLI target does not add macOS to the `create-octane-xplat` starter or the
supported web/iOS/Android release contract.

`pnpm --filter @xplat/macos bench:virtual-list` compares the all-rows fallback
with an AppKit-only fixed-height windowing prototype at 500, 2,000, and 5,000
items. The prototype slices the array around the scroll position and inserts
spacer views. It uses an internal AppKit scroll callback; it does not change the
shared `VirtualList` API. The probe jumps to the end of the list and checks that
the mounted and mapped row counts stay within 32 and that the correct final row
is mounted. Set `OCTANE_MACOS_VLIST_SIZES` to choose other sizes (up to 10,000)
or `OCTANE_MACOS_VLIST_MODES=windowed` to run only the windowing probe.

For example, run just the windowed probe at 500 and 1,000 items:

```sh
OCTANE_MACOS_VLIST_SIZES=500,1000 OCTANE_MACOS_VLIST_MODES=windowed pnpm --filter @xplat/macos bench:virtual-list
```

These figures were collected before the JavaScriptCore dev-host migration and
are historical Node-host measurements. New benchmark runs measure the
JavaScriptCore host's RSS and CPU; JavaScriptCore heap usage is reported
as `null` because the host does not expose it. The fixed-height windowed
figures are from the Apple Silicon rerun after correcting for AppKit's default
14pt vertical stack gap:

| Mode | Items | Initial render | RSS increase | Mounted rows |
| --- | ---: | ---: | ---: | ---: |
| All rows | 500 | 137 ms | 18.7 MiB | 500 |
| All rows | 2,000 | 1,133 ms | 135.6 MiB | 2,000 |
| All rows | 5,000 | Process killed before metrics | — | — |
| Windowed | 500 | 17.7 ms | 2.3 MiB | 24 → 16 (rows 484–499 at end) |
| Windowed | 2,000 | 16.2 ms | 2.2 MiB | 24 → 16 (rows 1984–1999 at end) |
| Windowed | 5,000 | 16.6 ms | 2.1 MiB | 24 → 16 (rows 4984–4999 at end) |

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

`pnpm --filter @xplat/macos bench:virtual-list-scroll` adds a 5,000-row
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
while debugging. `scripts/parity-check.mjs --targets=web,macos` currently
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

`pnpm --filter @xplat/macos package` delegates to the CLI to build an Apple
Silicon `.app` and compressed `.dmg`. Every build verifies SHA-256 checksums
of the pinned host, NativeScript framework, and metadata before running Vite.
The statically linked host lives in `Contents/MacOS`, loads system
JavaScriptCore, initializes the compatible Node-API addon from
`Contents/Frameworks`, then evaluates `Resources/app/main.cjs`. Metadata and
the JavaScript host shim live in `Contents/Resources`. No Node executable or
JavaScript engine binary is bundled. The bundle targets macOS 13.5 or later.
Artifacts are written under
`apps/macos/artifacts/macos-arm64/` so dev builds do not clean them.

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
`process.cwd()`, `Buffer.from(base64, 'base64')`, timers, and
`queueMicrotask`. Packaging rejects static calls to unsupported host members;
the shim also throws `Unsupported macOS host API` for unsupported runtime
access. Use the AppKit ObjC bridge for native UI and services; general Node
modules are outside this host contract.

The native inputs and source revisions are recorded in
`packages/cli/src/macos/jsc-host/prebuilt/manifest.json`. The adjacent
`build-runtime.sh` rebuilds the statically linked host and compatible
framework from pinned upstream revisions, the checked-in metadata snapshot,
and the reviewed source patches. Run it on Apple Silicon with Xcode, CMake,
pnpm, Node headers, and Homebrew development headers; `--install` updates the
CLI's prebuilt files and checksums. Its scratch clones and outputs stay under
gitignored `research/`.

From the repository root, run `node packages/cli/test/verify-macos-jsc.mjs`
to build an independent unsigned fixture app, boot its packaged executable,
and check the unsupported-import diagnostic. The script leaves its artifacts
under gitignored `research/` for inspection.

Set the optional `icon` package field to an app-root-relative `.icns` file to
include a custom app icon. The CLI validates the path, copies it to
`Contents/Resources/AppIcon.icns`, and sets `CFBundleIconFile` in `Info.plist`.

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
pnpm xplat build --targets macos
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
