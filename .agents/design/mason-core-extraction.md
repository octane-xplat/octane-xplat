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
private `packages/nativescript-mason-core` helper package. Its source provenance
and path mapping live in `tools/mason-core/README.md` in that repository. Five
portable styling helpers and three existing tests moved unchanged, followed by
27 unchanged layout/style/view/scroll source files. A separate core-only iOS
host now builds and runs on an arm64 simulator. A core-only Android AAR and
isolated Java client also compile. Both isolated NativeScript applications pass
bridge, geometry and ownership assertions, and core has independent bridge
declarations. Basic patched-renderer and Octane host-plan component checks also
pass on both simulator/emulator targets. A compiled TSRX component also passes
class styles, hook-driven updates, scrolling and cleanup. Real OS taps and swipes
also pass on both simulator/emulator targets.

| Evidence | iOS | Android |
| --- | --- | --- |
| Native host regressions | 15 UIKit simulator tests pass | 17 instrumentation tests pass on API 36 phone |
| Plain NativeScript consumer | arm64 simulator passes | API 36 phone passes; current-SDK control also passes on API 35 emulator |
| Patched Xplat renderer and Octane host-plan component | arm64 iOS 27 simulator passes | API 35 arm64 emulator passes; phone run pending |
| Compiled TSRX component, hooks, class styles, programmatic scroll | arm64 simulator passes | API 35 emulator passes |
| OS input: button hit testing and touch scrolling | arm64 simulator passes via HID | API 35 emulator passes via adb input; phone pending |
| Device host artifact | arm64 device framework and unsigned NativeScript app build; runtime unverified | arm64-v8a AAR and debug app build |
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

The temporary Swift projection keeps the full native sources and Xcode project
unchanged. Move unchanged native modules with `git mv` after qualifying their
full-build references and native regressions. The projection is not the final
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
An API 35 emulator passed 16 of 17 before that final correction and has not
been rerun. These results do not qualify OS input or the full package's native
behavior.
See the [recorded Android findings](../docs/notes/masonkit-layout-evaluation.md#core-extraction-android-style-synchronization-2026-10-22).
The tracked full Kotlin sources and Gradle project remain unchanged.

Android retains Glide, Gson, FontManager and AndroidX Core; the transitive graph
still contains AppCompat and Fragment. JNI initialization also requires the
existing `InlineSegment` data classes. These retained costs need matched app
measurements before any size claim. Commands and source hashes live in
`tools/mason-core/android-host-README.md` in the Mason fork.

The separate `build.plugin.prototype` target assembles the container-only runtime,
native host artifacts, dependency headers/licenses, Android Maven declarations,
and the iOS SDWebImage resource/privacy bundle. It does not change the ordinary
helper build or make full MasonKit depend on core. Its native artifacts cover
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

The separate `build.runtime` target now tests a container-only TypeScript
boundary at `dist/prototypes/nativescript-mason-core`; the ordinary package
build remains the portable helper slice. The runtime build projects core-only
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
`tools/mason-core/runtime-README.md` in the Mason fork. Do not switch Xplat to
this prototype before the native and application gates below are satisfied.

The implementation baseline is fork commit
`623114b070896a21315fcff9a3a6349bdd091cc4` (beta.126), including merged upstream
revision `2324b8ee52a1f22cf18dc684aa053e92b64a6451`. The helper-only package is not
a replacement for MasonKit in Xplat and does not establish native size savings.

The next native foundation packages the existing shared `mason-c` crate as
independent static engine archives, with a C consumer exercising callback-based
measurement and layout outside NativeScript. Its implementation and platform
qualification boundaries live in
`packages/nativescript-mason-core/src-native/README.md` in the Mason fork.
The shared Rust implementation remains unchanged; this step does not require
moving it or creating a second engine crate. Native artifacts are separate
from the helper package's tarball and ordinary build target.

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
