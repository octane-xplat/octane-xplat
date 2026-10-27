# Mason core extraction

Status: agreed prototype constraints; package and native boundaries proposed.
Updated: 2026-10-22.

Extract the Mason foundations Xplat needs into an independently usable core
package. Prove the boundary and build savings alongside the existing full
MasonKit package before integrating the two. Structure the work for a future
upstream contribution, preserving upstream source wherever practical.

This document guides future implementation; it does not report a completed
extraction or authorize publishing packages or switching consumer apps.

## Agreed constraints

- Keep the existing `nativescript-masonkit` entry point, exports, defaults,
  and behavior intact.
- Introduce core without making the full package depend on it during the
  prototype. Eventual integration is a separate step informed by evidence and
  upstream feedback.
- Use `git mv` for modules expected to remain largely unchanged. Preserve
  their contents, filenames, and relative directory structure where practical.
- Keep source moves separate from behavioral edits in commits. Avoid formatting,
  symbol renaming, and unrelated cleanup in moved modules.
- Allow minimal changes to the full package's build references when needed to
  consume relocated source. This is the narrow exception to leaving its
  internals alone; it must not become a full-package refactor.
- Keep extraction-specific adapters and boundaries in separate files where
  practical. Avoid an Xplat-specific fork of every shared module.
- Prove native artifact isolation as well as JavaScript dependency isolation.
  Smaller imports alone do not establish leaner application builds.

Upstream feedback is requested in
[triniwiz/nativescript-mason#160](https://github.com/triniwiz/nativescript-mason/issues/160).
No upstream agreement is assumed. The issue asks about the package boundary,
native/text coupling, and the most useful first contribution.

## Package ownership

Start with one new core package. Its final name and publishing scope remain
open. Layout, scrolling, styling, and foreign-view hosting share a lifecycle;
split them into more packages only when a demonstrated consumer need or native
dependency boundary justifies it.

The prototype and eventual upstream design have different dependency graphs:

```text
Prototype:
  isolated core consumer -> new core package
  existing consumers    -> existing MasonKit package
  no package dependency between core and full MasonKit

Eventual upstream design, subject to feedback:
  Xplat renderer        -> core package
  existing consumers    -> MasonKit package -> same core package
```

During the prototype, the full package may build selected relocated source
without depending on the core package or its compiled artifacts. Shared source
does not imply shared native runtime ownership. Temporary duplication of
outputs is acceptable in separate hosts.

The following allocation is proposed, pending extraction evidence:

| Responsibility | Core | Full MasonKit |
| --- | --- | --- |
| Layout tree, computation, invalidation, batching | Owns | Eventually uses core |
| Flex/grid, sizing, positioning, overflow | Owns | Eventually uses core |
| Native container and scroll hosts | Owns | Eventually extends or composes core |
| Foreign native-view measurement, placement, lifecycle | Owns | Eventually uses core |
| Container backgrounds, borders, shadows, transforms, clipping | Retains initially | Preserves existing behavior |
| HTML-shaped elements and browser-default styles | Excluded | Owns |
| HTML parsing, serialization, markup-specific state | Excluded | Owns |
| Rich-text rendering, inline runs, list markers | Measurement boundary only | Owns implementation |
| MasonKit inputs, buttons, images, lists, textareas | Excluded | Owns |
| Framework integrations | Framework-neutral hosting only | Preserves existing paths |

Core must not depend on Octane, Xplat components, JSX tags, routes, or tokens.
Web-derived layout and scroll semantics remain useful; excluding HTML elements
does not imply removing CSS layout or changing the scroll contract.

## Preserve source and upstream mergeability

Perform the extraction in the Mason repository containing the implementation.
Do not copy the dependency wholesale into the Xplat repository. Keep upstream
licenses and attribution, and record the exact upstream/fork baseline commit
alongside the extraction's source-path mapping.

For each moved module, record its original path, destination, owning build
targets, and any necessary divergence. For example, an unchanged style helper
can move into core while both package builds retain access to the same source.
A widget-specific helper stays with the full package.

Git detects renames from similarity; `git mv` does not create permanent rename
metadata. Small diffs and focused move commits make upstream changes easier to
trace and merge. Avoid broad file splitting until a dependency requires it.

Move-only commits should remain buildable where feasible, with only the minimum
path/build-reference updates needed. Follow with separate commits for boundary
changes and fixes. A behavioral fix should have its own regression evidence and
be understandable independently of the extraction so it can be offered upstream.

Prefer shared source to parallel edited copies. When a module genuinely needs
to diverge, record why and keep the difference narrow. Do not silently change
the full package's behavior through a shared source edit. If a move would demand
substantial changes to full MasonKit, defer that move and document the blocker
rather than expanding the prototype into an integration project.

## Native boundaries and compatibility

Core needs independently built native artifacts: an Android AAR, corresponding
Apple framework targets, and an equivalent Windows boundary when qualified.
Retain the existing Rust crates as implementation building blocks; a separate
JavaScript engine package is not required by this design.

Initially use core and full MasonKit in separate hosts. Copied Objective-C
classes, Java/Kotlin classes, JNI symbols, and native libraries may collide;
coinstallation is not a supported prototype scenario until explicitly proven.
Do not rename large portions of native source merely to permit early
coinstallation.

Eventual integration must give every engine, native class, node, and style
buffer one owner. The full package should link core rather than embed a second
copy. Mixed consumption becomes a required test at that stage.

Before fixing the native module structure, investigate bridge metadata,
Objective-C names, Swift module visibility, JNI loading, buffer compatibility,
and NativeScript's transitive plugin discovery. Preserving JavaScript imports
does not establish compatibility for existing Swift/Kotlin consumers or
precompiled native clients. Record any such limitation explicitly.

## Text, styling, and foreign views

The key feasibility question is whether layout and scroll hosts can operate
without MasonKit's rich-text and HTML implementation. Foreign controls still
need intrinsic measurement, constraints, invalidation, and appropriate baseline
information. For example, a NativeScript label should be measured and placed
without creating a MasonKit text widget.

Extract only the text/layout participation boundary required by the current
implementation; do not invent a general plugin system. Test mixed text and
element content in full MasonKit before claiming its behavior is preserved.

Keep existing container styling initially. Separating dependencies should not
also reduce Xplat's supported styling behavior. Later extraction of optional
painting features needs separate evidence and justification.

Audit external dependencies by all remaining callers. Android Glide serves
backgrounds and nine-slice images as well as image widgets, so removing a widget
does not establish that its loader can be removed. Assess font and diagnostic
dependencies similarly; do not assume every text-related dependency is optional
until the core host builds and runs without it.

Foreign-view ownership must preserve child order, release subscriptions on
removal/reparenting, react to intrinsic-size changes, and avoid redundant nested
layout work. Clearing styles must restore the applicable default or cascade.
Keep renderer-command translation in the consuming renderer; core owns reusable
native hosting mechanics.

## Proof and integration gates

1. Establish the exact source baseline and a full-package regression baseline.
   Map required modules and native dependencies before moving them.
2. Relocate unchanged modules in focused commits with minimal full-build wiring.
   Extract core-specific boundaries separately; keep both builds usable.
3. Build isolated core-only and full-package consumers. Verify that core's import
   graph and native artifacts exclude HTML parsers and optional widgets.
4. Qualify core on iOS and Android, with explicit Windows status. Preserve the
   existing full-package targets and Rust consumers; adopting core in Xplat's
   macOS/Linux hosts is separate work.
5. Measure release application size and behavior before proposing a Xplat switch.
   Reconcile the design with maintainer feedback before full-package integration.
6. For eventual integration, prove core-only, full-only, and mixed consumers,
   including single engine ownership and native source/API compatibility.

Verification must cover flex/grid, intrinsic sizing, percentages, nested roots,
foreign controls, style reset, child reparenting/disposal, programmatic seeks,
and actual touch scrolling and hit-testing. The unchanged full package also
needs representative HTML, rich-text, and widget regressions. Handler dispatch
does not prove native input behavior.

Measure dependency download/unpacked size, release IPA/APK size, and startup/
layout cost separately with matching toolchains and build settings. Simulator
slices and debug symbols are installation costs, not automatic phone-app
savings. The archive review alone does not quantify extraction savings.

## Evidence and remaining decisions

The first extraction in the
[Mason fork](https://github.com/octane-xplat/nativescript-mason) introduces the
private `packages/nativescript-mason-core` native package. Its source provenance
and path mapping live in `tools/mason-core/README.md` in that repository. Five
portable styling helpers and three existing tests moved unchanged, followed by
27 unchanged layout/style/view/scroll source files. Another 25 Swift and 86
Kotlin/Java modules moved unchanged into core, with only full-build source
references and projection resolvers adjusted. The native mapping records every
original/destination root and baseline hash. A separate core-only iOS
host now builds and runs on an arm64 simulator. A core-only Android AAR and
isolated Java client also compile. Both isolated NativeScript applications pass
bridge, geometry and ownership assertions, and core has independent bridge
declarations. Basic patched-renderer and Octane host-plan component checks also
pass on both simulator/emulator targets. A compiled TSRX component also passes
class styles, hook-driven updates, scrolling and cleanup. Real OS taps and swipes
also pass on both simulator/emulator targets.

| Evidence | iOS | Android |
| --- | --- | --- |
| Native host regressions | 15 UIKit simulator tests pass | 17 instrumentation tests pass on API 36 phone and API 35 emulator |
| Plain NativeScript consumer | arm64 simulator passes | API 36 phone passes; current-SDK control also passes on API 35 emulator |
| Patched Xplat renderer and Octane host-plan component | arm64 iOS 27 simulator passes | API 35 arm64 emulator and API 36 phone pass |
| Compiled TSRX component, hooks, class styles, scrolling | arm64 simulator passes | API 35 emulator and API 36 physical phone pass (actual Vite, published beta) |
| OS input: button hit testing and touch scrolling | arm64 simulator passes via HID | API 35 emulator and API 36 physical phone pass via adb input |
| Device host artifact | arm64 device framework, signed NativeScript app and native UI-test runner build; physical runtime unqualified | arm64-v8a AAR and debug app build |
| Full MasonKit native regression baseline | 28 selected tests execute: 27 pass, one existing full-text test fails | 72 selected unchanged HTML/text/widget tests pass on API 35 emulator |
| Matched release app sizes | Unmeasured | Unmeasured |

Full MasonKit builds the relocated helpers through a generated source overlay
at `tmp/nativescript-masonkit`. This preserves its relative imports and emitted
module paths without a core runtime dependency. Tests use the same relocation
manifest. This is temporary build/test wiring, not the eventual native-library
integration. Source maps point into the generated overlay; edit the tracked
source rather than those generated files.

The iOS host proof compiles 39 existing Swift files, with 25 byte-identical
sources and 14 explicit core adaptations. It excludes the HTML parser,
rich-text renderer, and widget classes from its native binary and public
headers. Isolated Swift and Objective-C clients link against the exported
framework and accompanying dependency headers; all 99 declared C functions
are exported. Fifteen UIKit simulator tests pass, covering grid placement,
foreign-label intrinsic invalidation, percentages and reset, nested roots,
release, and programmatic scroll clamping. These are native UIKit tests, not
NativeScript bridge or OS-input qualification.

The 25 unchanged Swift modules moved with `git mv`; full Xcode edits only
redirect those source references. Fourteen adapted modules stay in the full
tree, with core transformations outside their preserved source. Full Swift
implementation bytes and test bodies remain unchanged. The projection is not the final
upstream module structure. Core retains FontManager for styling/font metrics
and SDWebImage for backgrounds/nine-slice painting. A small glyph-provider
protocol replaces the background painter's direct dependency on MasonKit's text
renderer; it does not add glyph outlines to ordinary foreign labels. The
shared Rust engine still includes inline-layout code and convenience node
constructors. Physical-device application behavior and matched release app
measurements remain gates. Commands and source
hashes are documented in `tools/mason-core/ios-host-README.md` in the Mason fork.

The Android build proof (`70a1fbba` in the Mason fork) compiles 96 source files:
86 byte-identical files, nine explicitly adapted files, and an unchanged context
helper declaration extracted from a text-widget source file. It builds the
unchanged JNI binding with 16 KB load alignment and verifies an isolated Java
client against the exported arm64-v8a AAR and its resolved dependencies. The
artifact excludes HTML parsing, rich-text rendering and widget classes. Its
17-test instrumentation APK passes all 17 tests on an API 36 physical phone,
including all 12 unchanged foreign-view tests. Two narrow core adaptations
correct standalone grid synchronization and foreign percentage root-cache
invalidation. The percentage regression uses a definite containing block and
explicit engine scale; removing only its cache correction fails the same test.
The final 17-test suite also passes on the API 35 emulator, with no skips. These results do not qualify OS input or the full package's native
behavior.
See the [recorded Android findings](../docs/notes/masonkit-layout-evaluation.md#core-extraction-android-style-synchronization-2026-10-22).
The 86 unchanged Kotlin/Java modules moved with `git mv`; the full Gradle
project adds only their shared source set. Full implementation bytes, Rust
crates and JNI binding remain unchanged.

Android retains Glide, Gson, FontManager and AndroidX Core; the transitive graph
still contains AppCompat and Fragment. JNI initialization also requires the
existing `InlineSegment` data classes. A matched full-source Android
baseline passes 72 selected unchanged HTML/text/widget tests. Its AAR is
2,332,626 bytes versus core’s 1,780,097 bytes; classes.jar is 1,886,358 versus
1,321,673 bytes (758 versus 600 class files). Both carry an identical 1,146,832-byte
JNI entry. These library artifact measurements do not establish release APK
savings or transitive dependency download costs. These retained costs need matched app
measurements before any size claim. Commands and source hashes live in
`tools/mason-core/android-host-README.md` in the Mason fork.

The packaged plugin artifacts show where the remaining savings do and do not
come from. The packed tarballs are 7,471,480 bytes for core versus
50,265,067 for the full package, and unpacked installs are 29,301,549 versus
189,992,482 bytes. Those headline gaps are dominated by packaging, not code
removal: the full XCFramework ships xros and x86_64 simulator slices plus
about 89 MB of dSYM DWARF that core does not yet ship, and the full release
AAR carries four JNI ABIs where core carries arm64-v8a alone. The like-for-like
per-slice deltas are smaller: the arm64 device framework binary is 8,497,568
versus 10,848,392 bytes (about 22% smaller), classes.jar drops 30%, and the
arm64-v8a `libmasonnative.so` is essentially unchanged (1,146,832 versus
1,147,256 bytes) because both link the same shared Rust engine. Widget
resources (color picker, seekbar drawables) leave the core AAR entirely.
These are install/download and per-artifact numbers measured on the same dist
builds; matched release IPA/APK sizes remain unmeasured.

The normal core `build` target now assembles the container-only runtime,
native host artifacts, dependency headers/licenses, Android Maven declarations,
and the iOS SDWebImage resource/privacy bundle. It does not change the ordinary
full MasonKit build or make it depend on core. The helper proof has separate
`build.helpers` / `verify.helpers` targets. Its native artifacts cover
arm64 iOS device/Simulator and Android arm64-v8a. The two Apple slices have
matching projected sources and public headers and are packaged as an
XCFramework, each with its own platform-specific SDWebImage privacy bundle.
An unsigned NativeScript device app builds with the device slice, core bridge
metadata and device resource metadata. This does not qualify device runtime. Packed files retain their hashes,
including independent bridge declarations tied to the native artifact hashes.
Both isolated NativeScript apps pass bridge, geometry and ownership assertions
with only core and NativeScript core as runtime dependencies. They generate
core metadata without optional HTML/text/widget classes. A separate consumer
uses the current Xplat catalog pins and canonical patches, retargeting only the
renderer patch's two Mason imports. Driver geometry updates, reparenting,
disposal and Octane component mount/update/unmount pass on iOS Simulator and
the Android emulator. An authored TSRX component compiled with Octane 0.14.0
also passes class geometry, native button-handler/hook updates, programmatic
scrolling and effect/ref cleanup in Xplat's Page/Frame hosting pattern. The
compiler's optional parser is fixture development tooling; core gains no
dependency. The ordinary scenario uses synthetic notifications. A separate
OS-input mode passes HID taps/swipes on iOS Simulator and adb taps/swipes on
Android emulator, requiring matching native row movement and scroll offset
plus the hook update and cleanup. The simulator also discovers its privacy
bundle through the core framework at runtime. No screenshots are used.
Physical-device input remains a gate.

The separate `build.runtime` target tests a container-only TypeScript
intermediate at `dist/prototypes/nativescript-mason-core`; the ordinary package
build outputs the native plugin at `dist/packages/nativescript-mason-core`. The runtime build projects core-only
`common.ts`, `tree/`, and root declarations from the preserved full sources.
It removes HTML/text-run/widget factories and gives containers NativeScript
view children. The tracked relocated wrappers and styling implementations stay
unchanged. A generated property adaptation changes types only; mobile emissions
resolve the Windows constant to false and omit the Windows-only rich-text copy
method. All other shared emissions must match the full build under the same
constant. The adaptation rules reject unexpected source structure.

The generated foreign-view helper also cancels pending style work on release.
A renderer reparent/remove/destroy sequence otherwise leaves a queued sync
targeting a cleared native label. Its regression fails without cancellation
and passes with it, including native-view replacement. Both native renderer
consumers pass after the correction (`8eeeafe7` in the Mason fork). The
adaptation remains outside the moved source; full-package runtime reproduction
is still separate.

This generated projection is a temporary proof mechanism while upstream
feedback is pending, not the proposed final upstream module structure. Its
runtime-only tarball contains independent bridge declarations but no native
host artifacts. The compiler rejects full MasonKit native type inputs. Standard
NativeScript SDK ambient types and `skipLibCheck` remain required. A build-only
Windows facade checks inactive shared branches and is not shipped. The pinned
Android declaration-generator adaptation and iOS generation provenance live in
`tools/mason-core/native-types-README.md` in the Mason fork. These are type/build
checks, separate from runtime and ABI evidence. Verification commands live in
`tools/mason-core/runtime-README.md` in the Mason fork. The proving harnesses
now exercise the beta as described below; remaining native and application
gates still limit broader adoption.

The implementation baseline is fork commit
`623114b070896a21315fcff9a3a6349bdd091cc4` (beta.126), including merged upstream
revision `2324b8ee52a1f22cf18dc684aa053e92b64a6451`. The initial helper-only
proof remains separate; the current normal output is the independent native plugin.
At that extraction baseline, no production Xplat dependency had been switched.

The next native foundation packages the existing shared `mason-c` crate as
independent static engine archives, with a C consumer exercising callback-based
measurement and layout outside NativeScript. Its implementation and platform
qualification boundaries live in
`packages/nativescript-mason-core/src-native/README.md` in the Mason fork.
The shared Rust implementation remains unchanged; this step does not require
moving it or creating a second engine crate. Raw engine artifacts are separate from the helper proof. The normal core
build packages the independently built native hosts.

The current C measurement callbacks are excluded on Android, which uses the
existing JNI binding instead. Do not infer Android foreign-view support from
the host C consumer. The staged C header also needs platform guards that the
existing Apple-oriented generated header omits; see the
[recorded source limitations](../docs/notes/masonkit-layout-evaluation.md#core-extraction-c-interface-boundaries-2026-10-22).

The initial review examined the fork pinned at `1.0.0-beta.125` and the local
[renderer patch](../../packages/cli/patches/@nativescript-community__octane@0.2.5.patch).
Xplat's renderer imports MasonKit's layout/scroll hosts and style surface while
using NativeScript controls for ordinary text, inputs, buttons, and images.
This is source evidence, not runtime verification of a lean variant.

Existing platform findings remain in the
[MasonKit layout evaluation](../docs/notes/masonkit-layout-evaluation.md).
[Upstream issue #77](https://github.com/triniwiz/nativescript-mason/issues/77)
contains a separate size investigation; its measurements must not be treated as
results for this extraction.

Open decisions include the exact module membership, the minimum text/layout
boundary, native module compatibility, retained external dependencies, package
names/versioning, and the eventual integration sequence. Record implementation
evidence and exploration state in Silo under the repository's
[exploration conventions](../docs/exploration.md). Revise this document when
evidence or upstream feedback changes the design; do not present provisional
boundaries as shipped behavior.

The full Swift baseline also compiles unchanged source/test bodies. Two existing
test files are missing from the upstream Xcode target; the temporary baseline
registers them so all 28 selected tests execute. Twenty-seven pass; the full
text-node uppercase/whitespace test fails its substring assertion. Preserve this
nonzero baseline rather than skipping
the test or editing full text internals. This is an existing full-source test
failure; core excludes that renderer. After the native moves, all 28 execute
with exactly the same one failing test identifier and zero skips; core remains
15/15 on iOS and 17/17 on Android. Both compiled consumers pass actual OS input.
The move commit is `6a51ad04` in the Mason fork. See the
[full iOS baseline finding](../docs/notes/masonkit-layout-evaluation.md#core-extraction-full-ios-baseline-2026-10-22).

The normal build requires explicit native artifact preparation; it does not
silently compile native projects. Pinned SDK generators install independently
through `prepare.native.sdk`, so bridge regeneration no longer requires an
already prepared consumer. The independent core project has no `build.all` release
target; full-package release defaults remain independent. Native output retains
NativeScript's ES-module auto-detection; the portable helper proof alone uses
CommonJS metadata. Public installation steps live in the Mason core README.
The package promotion is `02510b4a` in the Mason fork; all 30 emitted JavaScript
modules match the previously qualified prototype byte for byte. Normal-package
Android, iOS Simulator and unsigned iOS device builds pass. iOS OS input passes.
One Android run timed out after its single OS tap; the diagnostic rerun passes
the tap, swipe, matching row movement and cleanup. The cause remains unproven;
failure-state diagnostics are retained in `00e79792`. A retry pass does not
establish that the intermittent failure is fixed.

Xplat doctor and upgrade now preserve an explicit experimental core dependency.
They reject core alongside full MasonKit, duplicate installed core copies, and
Windows selection. The native Vite preset resolves the canonical renderer's
unchanged Mason imports to the app's core installation. Explicit core probes
exclude the harness's full engine and fingerprint core's native files. These
are opt-in tooling changes; defaults and production dependencies remain full.
All 343 CLI checks, 107 repository script checks and the required dependent
typechecks pass. Those are host checks, including real Vite resolution for both
mobile suffixes, rather than device-runtime qualification.

The separate actual-Vite fixture compiles authored TSRX with canonical patches
and passes real taps, hook/geometry updates, touch scrolling and cleanup on
iOS Simulator (`c7326b01` in the Mason fork). Android builds too. Its initial
debug startup failure was a fixture prerequisite error: the minimal manifest
omitted `INTERNET`, so the inspector server threw socket `EPERM` before
installing its runtime globals. Restoring the permission makes the canonical
Vite app accept a real inspector connection; Runtime evaluation and the
NativeScript DOM dispatcher both respond. An experimental separate inspector
entry is not needed and must not be promoted as an upstream workaround.

Android input diagnostics then caught stale coordinates published before
window insets finished applying: the single tap targeted y=224 pixels while
the button's final center was about y=286. The fixture now waits for native
window readiness and stable geometry before publishing coordinates, and the
combined inspector/OS-input run passes on the API 35 emulator (`043dda2c` in
the Mason fork): a real inspector WebSocket answers Runtime evaluation and
the NativeScript DOM dispatcher, and OS tap/swipe drive the hook update,
matching row movement and cleanup. Cold-boot runs remain intermittent — one
rerun lost its injected tap despite correct coordinates and verified window
focus, and another timed out inside the readiness gate — so failure
diagnostics now record the last window gate and observed native touch
actions. The earlier Webpack tap timeout is not proven to share a cause.
The upstream Mason issue remains open without maintainer comments at the
latest check.


Core has an independent beta release path in the Mason fork's `release.yml`
(`91f7edd8`, with draft-asset access corrected in `19a09a83`). Core versions use
`core-v<version>` GitHub tags and npm's `next` tag; full MasonKit keeps its
existing version and release path. A minimal `0.0.1` stub under `bootstrap`
establishes the package before npm trust can be configured. Publishing does
not switch Xplat's defaults or clear the remaining runtime/size gates.

The core workflow compiles TypeScript from the selected revision and assembles
it with locally built native inputs from a release asset. The archive checksum
and native source baseline are committed in `tools/mason-core/release-native.json`;
bridge manifests and the packed inventory check the native artifacts and
shipped files. npm provenance identifies the assembling/publishing workflow,
not a reproducible native build. Maintainers follow the Mason fork's
`RELEASING.md` for asset preparation, validation and publication.


The first independent beta is
[`core-v1.0.0-beta.0`](https://github.com/octane-xplat/nativescript-mason/releases/tag/core-v1.0.0-beta.0),
from fork commit `26b1c9a9`. npm accepted the `0.0.1` bootstrap stub and
`1.0.0-beta.0` beta through the configured trust binding; beta publication uses
`next` and includes provenance. Select the beta explicitly in an isolated app:

```sh
pnpm add @octane-xplat/nativescript-mason-core@1.0.0-beta.0
```

Full-package CI now resolves native enum drift checks through the relocation
manifest and typechecks the same generated source overlay as its build.
The release revision passes the full TypeScript unit suite, plugin/consumer
typechecks, generated-source checks, Rust tests and the independent core
package release checks. These are host/CI checks, not additional device runs.


The Xplat mobile proving harnesses explicitly selected the published
`@octane-xplat/nativescript-mason-core@1.0.0-beta.0` (since moved to beta.1
for the environment resolver): mobile (including the
navigation fixture), Maestro, Workshop demo, and the demos/media-probe
development dependencies. Default mobile probes inherit that engine and verify
its native file fingerprint. Vite uses the existing app-local alias for the
canonical renderer's full-MasonKit imports; the renderer patch is unchanged.
Windows retains full MasonKit because core has no Windows artifacts. The
scaffolder and compatibility manifest still default new apps to full MasonKit;
this worktree adoption does not clear the physical-device, cold-input or
matched release-size qualification gaps.

The upstream issue now has an
[update linking the source, tooling and first beta](https://github.com/triniwiz/nativescript-mason/issues/160#issuecomment-6368257363).


The adoption passes a frozen registry install, all 343 CLI tests, all 110
repository script/probe-host tests, and the 47-task targeted typecheck run for
touched packages and their dependents. The actual mobile Vite preset resolves
the renderer's MasonKit import prefix to the installed core beta. The default
counter probe builds and passes on the dedicated arm64 iOS Simulator
(`0e4bd387-6f83-4c1d-b0e2-4ba206920cf3`): initial count `0`, then `1` after
handler dispatch. This does not add OS-input or layout-geometry qualification,
and Android runtime was not rerun for this adoption. Local logs are in
`research/mason-core-adoption/`; the simulator was shut down after verification.

## Published-beta device qualification (2026-10-23)

The actual-Vite fixture now installs registry
`@octane-xplat/nativescript-mason-core@1.0.0-beta.0`, with the canonical patches
from Xplat `74ddcb9ba`. On the API 36 physical CPH2551 Android phone, the
combined inspector and OS-input run passes: Runtime evaluation and the
NativeScript DOM dispatcher answer through a real inspector WebSocket; a real
tap changes the label width from 89.85 to 129.85 logical pixels; and a real
swipe produces `scrollTop = rowMovement = 99.3846`. Mount and disposal counts
are both one, and the fixture verifies ref clearing and host release. The
consumer runtime graph excludes full MasonKit.

Evidence in the Mason fork is
`tmp/mason-core-nativescript-android-tests/1792770970049/{result,device,inspector,input-actions}.json`.
The registry selection, current patch fingerprints and build/run log are in
`tmp/mason-core-physical-qualification/`. The maintained runner command is:

```sh
MASON_CORE_ANDROID_SERIAL=DEVICE_SERIAL pnpm exec nx run \
  nativescript-mason-core:test.consumer.android.input.device --inspector
```

Run from the Mason fork after preparing its actual-Vite fixture, substituting
the authorized phone's adb serial and holding its native-build/device resource
reservation. This physical pass does not establish a fix for the separate
cold-boot Android emulator intermittency.

For iOS, the same published-core Vite fixture builds a development-signed
arm64 app and a native XCTest UI runner. The signed app verifies and installs
on the paired physical iPhone. The temporary UI test passes its tap/count and
row checks, then fails waiting for the button to disappear after its drag;
no passing consumer JSON was collected. This does not identify a core defect
or qualify physical iOS behavior. The user requested simulator qualification
instead. Signed artifacts and the failed test log remain in
`tmp/mason-core-physical-qualification/` in the Mason fork.

The dedicated arm64 iOS 27 Simulator passes the same registry-beta actual-Vite
fixture using native HID tap/swipe input. The label width changes from 90 to
130 points; `scrollTop` and native row movement both equal 169.2874 points;
mount and disposal counts are one, with ref clearing and host release verified.
The first run exposed a fixture-only bug: Android window diagnostic methods
were called before the iOS bypass. Guarding those diagnostics by platform
allows the maintained input runner to pass. No package runtime change was
required. Evidence is in
`tmp/mason-core-nativescript-ios-tests/1792772156997/{result,input-actions}.json`
and `tmp/mason-core-physical-qualification/ios-simulator-rerun.log` in the Mason
fork. The runner shuts down its dedicated simulator after completion.

```sh
pnpm exec nx run nativescript-mason-core:build.consumer.ios
pnpm exec nx run nativescript-mason-core:test.consumer.ios.input
```

Run these targets in the Mason fork with its dedicated simulator initially
shut down and its native-build/simulator reservation held. This simulator pass
does not qualify physical iOS runtime behavior.

## Host-scoped CSS environment resolver (2026-10-23)

Mason fork commit `f44f0497` adds resolution of
`env(safe-area-inset-top/right/bottom/left)` from a
host-owned window context. The host supplies device-independent pixels through
`bindCssEnvironment(root, source)` (`read` plus `subscribe`) or pushes changes
with `setCssEnvironment(root, insets)`. It owns native window selection, inset
observation and subscription disposal. Core owns expression preservation,
substitution and style re-evaluation. No global screen value or new platform
dependency supplies the insets.

```ts
import {
  bindCssEnvironment, type View, type CssEnvironmentSource,
} from '@octane-xplat/nativescript-mason-core';

export function connectWindow(root: View, source: CssEnvironmentSource) {
  return bindCssEnvironment(root, source);
}
```

The nearest host boundary supplies values to descendants; an unavailable
boundary uses fallbacks instead of inheriting a different window's values.
Genuine zero insets remain zero. Headless coverage includes nested math,
NativeScript-expanded variables, box shorthands and their multi-value
fallbacks, local precedence, expression removal, density conversion, window
isolation, unload/reload/reparenting, style transport scheduling and observer
teardown. Host recreation without a load transition requires an explicit
`refreshCssEnvironment(root)`.

```css
.safe-content {
  --safe-top: env(safe-area-inset-top, 0px);
  padding: calc(var(--safe-top) + 8px) env(safe-area-inset-right, 0px)
    env(safe-area-inset-bottom, 0px) env(safe-area-inset-left, 0px);
}
```

The new `css-environment.ts` is core-owned. Generated adapters in
`tools/mason-core/runtime-sources.mjs` integrate it with core style setters,
size conversion, shorthand expansion and foreign-view release. The tracked
shared modules and full MasonKit behavior remain unchanged. Packed shared
emissions are compared after applying those explicit adapters, and both
platform import graphs still exclude full MasonKit and optional HTML/widgets.

This implementation shipped as
[`core-v1.0.0-beta.1`](https://github.com/octane-xplat/nativescript-mason/releases/tag/core-v1.0.0-beta.1)
from fork commit `27281f97`, published to npm `next` with provenance through
the same trusted-publishing workflow. Evidence remains **headless only**: OS
inset observation and actual iOS/Android layout are still unqualified. Xplat
adopted the beta in its mobile harnesses and the create compatibility set; the
installed package advertises `masonCoreCapabilities.safeAreaEnvironment`
`owning-window-v1`, which the native preset reads to distinguish engines. The
issue #48 warning did not disappear — capable core now warns that inset
dispatch and layout await device qualification, while unsupported engines
keep the unresolved-`env()` warning. Ordinary NativeScript controls still
need `useSafeAreaInsets()` inline styling.

Unknown environment names may use fallbacks. Without one, the existing
invalid-length/diagnostic path still applies; this seam does not implement
general CSS invalid-at-computed-value inheritance. Parser substitution follows
the CSS environment draft's available-value/fallback distinction:
<https://drafts.csswg.org/css-env-1/#env-function>.
## Mason core mobile cutover (2026-10-23)

Engine selection was removed entirely — there is no opt-in. iOS/Android always
builds with core: `xplatNative` resolves the canonical renderer's unchanged
`nativescript-masonkit` imports to the app's core installation without an
installed-capability probe, and doctor/upgrade treat the full and legacy
packages as replaced engines. `xplat upgrade` migrates their pins to the core
catalog entry; `xplatNative`, doctor, and the probe runner reject them until
it runs. New scaffolds declare the core beta through `catalog:xplat`.

The Windows preview is a platform constraint, not an engine choice: core
ships no Windows artifacts, so windows-profile packages stay on full MasonKit
and upgrade replaces a stray core pin there. The `env()` warning split follows
the same platform line — mobile keeps the headless-qualification warning,
Windows keeps the unresolved-value warning.

Earlier paragraphs describing engine selection as opt-in (`selectMasonEngine`,
"defaults and production dependencies remain full") are superseded by this
cutover. The upstream contribution goal and the moved-source discipline are
unchanged.

## Windows core host status (2026-10-27)

The pinned desktop engine archive includes
`x86_64-pc-windows-msvc/MasonCore.lib` and its generated
`include/mason_native.h` (Mason fork `0cdc3c80`). A C++/WinRT core host and
Windows JavaScript leaves now exist in the Mason fork's preserved
`arthur/windows-core-host` branch. The host links that archive and retains
the container, layout, styling, scroll and foreign-view surface. This is
extraction and local package-build evidence; the Windows cutover is still
gated.

The `windy` Windows x64 host became reachable again. Its isolated
`mason-core-consumer` application runs through `@nativescript/windows` on
real XAML, with a saved console result of `success: true, checks: 13`.
Those checks establish a smoke run, with these narrower limits:

| Check | Observed evidence | Qualification still needed |
| --- | --- | --- |
| Flex/grid, add, reparent, detach | Operations complete; several checks record unconditional success | Assert native child order, parent ownership, frames and release |
| Native text and resize | A native label exists; style-buffer reads return | Assert text content, updated buffer values and native geometry |
| Layout dump and hit-test | Calls return without throwing; the dump result is `null` | Assert actual layout records and the expected hit-test target |
| Scrolling | A listener fires after programmatic `ChangeView` | OS-driven scroll input, offsets and corresponding child movement |

The Windows consumer and its CsWinRT projection/MSIX build repairs are
preserved on the lab host, but are not a maintained consumer fixture or
runner in the Mason branch. The outcome requires maintained native geometry
and real-input evidence; this smoke result does not satisfy that gate.

Installed registry core betas `.4` and `.5` contain neither
`index.windows.js` nor `platforms/windows`. A local package assembled from
the extraction branch contains both, and its packed inventory verifies
211 files, including the x64 DLL, WinMD, plugin build files and nine Windows
JavaScript leaves. Extraction and `pnpm pack` on Windows preserve every
inventory hash and produce a byte-identical tarball. This verifies archive
portability, not a fresh relocated MSIX build. Local assembly does not add
Windows support to an already published tarball.

Keep the `mason-engine.ts` Windows rejection until the qualification and
delivery gates are met. Removing it must also reconcile Windows engine pins,
doctor/upgrade, the native-preset regression, documentation and skill guidance.
The outcome's explicit relocatable-archive requirement applies to macOS and
GTK; a Windows source build or tarball inventory alone does not establish
installed consumer behavior or clear the separate Windows runtime gate.
