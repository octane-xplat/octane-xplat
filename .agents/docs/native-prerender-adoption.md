# Native pre-render adoption boundaries

Read this when changing native adoption cleanup or upgrading its NativeScript,
Mason or Octane dependencies. The maintained
[qualification fixture](../../tools/platform-qualification/native-prerender/README.md)
owns the executable controls and their limits; Silo's
`native-prerender-adoption` topic owns current exploration state. These controls
are experimental host integration, not a public hydration API.

The reusable candidate logical contract now belongs to the private
[`native-prerender` workspace](../../packages/native-prerender/README.md).
It retains logical text slots, derives visual records and keeps command IDs
only in ephemeral matching maps. Text slots carry exact JavaScript display
strings; the seed retains its original value types. XPI1/JSON use the same
host-side validation. Independent Swift/Java readers share a maintained
interoperability corpus, including the real JSX producer output. Swift keeps
arbitrary seed dictionaries in NSDictionary to preserve distinct UTF-16 keys.
Both mobile qualification hosts consume XPI1 and match complete logical slots
before claims. The Swift/Java Mason backend adapters use the shared readers and retain
separate native setter/font eligibility checks. Host-native decoder
checks do not establish mobile rendering or normal-app integration. Keep backend
value/font checks before native allocation. Core9.1.3's
[media evaluator](https://github.com/NativeScript/NativeScript/blob/9.1.3/packages/core/media-query-list/index.ts#L29-L49)
passes physical Screen pixels for width/height and device-width/height and omits
reduced motion. The portable cascade receives logical viewport dimensions.
Foundation research commit `fb08527` records these pinned inputs.
The mobile producer therefore accepts positive screen/all and light/dark
color-scheme queries plus exact `(hover: hover)` fixed to false, matching Core; it rejects other media inputs, including currently
unmatched rules. Exact logical launch guards do not establish equivalence.
The IR retains explicit dimension predicates for host-authored launch limits;
that schema capability does not qualify responsive CSS. Keep the failing
configured-width fixture alongside the keyed fixture without dimensional queries. Do not change
global Core media semantics or relax parity tolerances as a local workaround.
The private [build worker](../../packages/native-prerender-build/README.md) owns
render-only production using Node and the selected project-installed Vite,
Octane, UI/lib/icons and native CSS preset. Its own dependencies supply the
portable IR and CSS engine. It accepts a JSON-selected entry/export/seed/environment
and a new/empty output destination, reserving the destination before asynchronous
work. Normalized stylesheet bytes also enter the identity. Styles reuse the
selected native preset's CSS sibling selection and `@platform` filtering;
CSS `@import`, package CSS imports and query imports fail explicitly. Existing source bytes and
absent resolution candidates are both inputs: a newly created platform sibling
invalidates an old artifact even when its previous sources remain unchanged.
Native packaging verifies both sets before copying and after compilation. The qualification
command only selects inputs and scratch placement. It keeps a dedicated
build-host plugin and four shared primitive exports from the installed UI source layout; it does not load the
app's Vite configuration or establish full UI-barrel eligibility. Generic
logical projection, backend preflight and native mounting belong to the reusable
package; the Android wrapper binding now also belongs to that package. The fixed
Home host, observations and adoption controls remain in qualification tooling. Native mounts must not contain seed, node-count or
element-index assumptions from a screen fixture. The current IR still requires
one logical root, which may be a container or Label. See the fixture's
[producer contract](../../tools/platform-qualification/native-prerender/README.md#produce-home-without-a-device-runtime).

## Root-scoped creation is a maintained driver seam

The owned `@octane-xplat/nativescript-octane` driver creates views through its
element registry and adds `NativeScriptRootOptions.createView` to the
container/root constructors as typed source.
It runs only when a non-text host is created during command application.
Returning undefined uses the ordinary registered constructor. Supplied wrappers
must be ViewBase instances without a live driver owner or logical parent.

The private startup package's `createNativeClaims` owns the initial command-ID
map and one-time consumption state. Keep native binding and lifecycle outside
that portable guard. Native adapters must import it and `ArtifactError` through
the same package entry as callers; mixing `src` with `dist` creates different
error constructors and can break rejection recovery. It distinguishes preflight rejection from a failed
accepted commit; after initial claims are consumed, new client work uses
ordinary constructors. Retire its maps and references alongside the native
lease, including when Core retains the logical wrappers for restoration.

The private Android `platforms/android/mason-binding.android.js` owns wrapper association
for the backend-validated Mason/Label tree. It checks native classes, distinct
objects and topology before creating wrappers. An initial existing-child attach
updates Core/Mason bookkeeping without reinsertion; each child can take that
path only once. Subsequent moves use ordinary Mason behavior, including moves
from callbacks before the initial commit returns. Restore attachment methods
and Label factories in commit's finally path so success and accepted failure
release startup closures. Clear adopted Mason native/style caches only after
Core contexts, native handles and loading have been released. The adapter is
version-sensitive: keep the exact repaired Mason snapshot and Core9.1.3 evidence,
not just an npm version claim. It does not own window/lifecycle handoff or defaults.

Octane0.16.3's direct transaction marks host acceptance before apply and
continues logical/lifecycle/layout publication after an apply error, preserving
the first thrown value. A failed commit can therefore have published refs and
callbacks; it cannot be handled as an aborted preparation. See the
[pinned upstream transaction source](https://github.com/octanejs/octane/blob/octane%400.16.3/packages/octane/src/universal-core.ts)
and foundation research commit `f774f79` in the private prior-art repository.

```ts
import type { ViewBase } from '@nativescript/core'
import { createNativeScriptRoot } from '@octane-xplat/nativescript-octane'

const claims = new Map<number, ViewBase>()
const root = createNativeScriptRoot(host, {
  createView(id) {
    const view = claims.get(id)
    claims.delete(id)
    return view
  },
})
```

The host owns complete logical matching, native-class validation, native object
association, default restoration, one-use claims and failure disposal. The hook
does not provide hydration or rollback. Preparation/abort, logical text hosts
and element-registry hot replacement do not call it. The seam is covered by the
owned driver's unit suite (`packages/nativescript-octane/src/driver.spec.ts`).
Keep this small driver extension separate from Octane's universal renderer;
the current preparation/commit API needs no pre-render fork.

## Keyed logical identity does not guarantee native move identity

The pinned0.2.5 [driver insert path](https://github.com/nativescript-community/octane/blob/e8d9fd7b11b6d2cbce6f6621126ccda22541bef6/packages/octane/src/driver.ts#L491-L507)
detaches an existing view before attaching it at the new position. With the
qualified Android Core/Mason adapter, that retains the keyed logical wrapper
but recreates the moved Label and its Mason native node. The configured keyed
control compares these lifetime transitions against an ordinary-rendered root;
initial adoption must preserve every native object, while later updates must
follow ordinary host behavior. A removed key must create an ordinary new
wrapper/native object when it returns, never replay its startup factory.

Keep this cost visible rather than calling every keyed move identity-preserving.
Preserving native objects during moves needs a separate driver/Mason move seam
and lifecycle qualification; startup adoption does not supply it. Do not retain
startup factory overrides to simulate preservation: Core can later restore the
same logical owner under a different Activity. The current control checks one
bounded Android list and does not establish arbitrary reparenting or every
container/platform's lifetime semantics.

## Native-owned iOS entry

The `@nativescript/ios`9.1.0
[stock launcher](https://github.com/NativeScript/ios/blob/9.1.0/project-template-ios/internal/main.m)
guards its Objective-C main with NS_SWIFTUI_BOOT. Set the Xcode build setting
to1; the platform project supplies the corresponding preprocessor definition.
Adding only a GCC_PREPROCESSOR_DEFINITIONS entry is unsafe with CLI9.1.1's
xcconfig property lookup and can produce a second, self-referential definition.
The app can supply a native entry point and use the SDK's
[NativeScriptStart helpers](https://github.com/NativeScript/ios/blob/9.1.0/project-template-ios/internal/NativeScriptStart.m)
for delayed setup/boot. The supporting
prior-art source research is commit 879ce4c (bounded UIKit SDK runtime
clarification: 7e417d4), with the public source linked here so this
guidance remains usable without that private repository.

```xcconfig
NS_SWIFTUI_BOOT = 1
SWIFT_OBJC_BRIDGING_HEADER = /absolute/path/to/owned/StartupBridge.h
```

The ios9.1.0 template's
[Swift bridging header](https://github.com/NativeScript/ios/blob/9.1.0/project-template-ios/internal/Swift-ObjC-Bridging-Header.h)
uses `#ifndef TARGET_OS_WATCH`. Apple's iOS headers define that macro to zero,
so those imports are excluded. The SDK qualification fixture uses an app-owned
header with explicit Foundation, NativeScript and NativeScriptStart imports;
it does not edit the installed SDK. NativeSource compiles the owned Swift entry
through the normal CLI. The separate
[stock SDK control](../../tools/platform-qualification/native-prerender/README.md#stock-ios-sdk-startup-control)
owns its build/run assertions. It checks UIKit startup only, separately from
the Home IR, wrapper adoption, Core window handoff and production integration.

The separate stock SDK Home control compiles the shared Home bootstrap through
NativeSource with `XPLAT_PRERENDER_STOCK_SDK`, emits XPI1 into the normal Vite
app bundle, and calls the same SDK helpers. Its producer resolves from the
isolated app's installed package tree; the live bundle uses the installed
native preset and the existing four-primitive qualification facade. It reuses
the Home identity, Core Page/window and style/layout assertions. This remains
a fixed-screen control, not normal app opt-in installation or arbitrary
component eligibility.

The arm64 Mason archive requires excluding x86_64 from this simulator build.
Swift also needs the SDK's generated static-library include directory to import
FontManager through MasonCore's textual interface. Use the SDK-provided module;
do not duplicate the native FontManager implementation or edit the SDK cache.

```xcconfig
EXCLUDED_ARCHS[sdk=iphonesimulator*] = x86_64
SWIFT_INCLUDE_PATHS = $(inherited) "$(BUILT_PRODUCTS_DIR)/include"
```

## Separate native layout, frame submission and presentation

Android's hardware `registerFrameCommitCallback` establishes swap-chain
submission, not display presentation. The Home gate waits for that callback
on supported hardware paths. Its safe-area readiness also requires the last
drawn bounds to match current parent padding and current safe-area metrics
with no pending layout. On API30+, use bounds and insets from one
[WindowMetrics](https://developer.android.com/reference/android/view/WindowMetrics#getWindowInsets())
snapshot. View-level root insets can lag during attachment; mixing those with
window bounds can under-pad a cutout. The qualification-only
[stale root-inset control](../../tools/platform-qualification/native-prerender/README.md#android-stale-root-inset-control)
keeps that input transition explicit rather than relaxing cold/live parity. Include
position as well as size in stability checks and revalidate after any deferred
startup turn before freezing the final native baseline. Three stable size
observations alone can accept a pending parent inset adjustment; tracing
exposed that race even when independent style comparisons still passed.

The nonvisual presentation control separately correlates the Home draw's
enclosing Choreographer token with its application buffer frame and the
corresponding SurfaceFlinger display frame. It requires known non-dropped
presentation results, display completion before engine initialization, and no
trace errors/data loss. A passing device run and a nonempty trace are
prerequisites, not substitutes for that frame chain. See the fixture's
[capture and analysis commands](../../tools/platform-qualification/native-prerender/README.md#android-home-frame-submission-and-presentation).

This is platform-reported presentation on the qualified Android emulator.
It does not establish pixel parity, a physical display or release startup
performance. Keep its artificial engine gate and diagnostic costs separate
from production timing; do not infer a speedup from the observed lead time.

Use the separate matched startup control for timing. It uses one profileable
release APK with default native-first and eager-JS `:ordinary` processes,
the same Home/viewport/SDK inputs, and no artificial250ms delay, extra abort
probe or pre-frame receipt serialization. Startup can reach configuration
replacement earlier than a delayed control; retain logical owners and restore
their native objects rather than replaying cold IR. A passing delayed cold
entry alone does not qualify that ordering.
Three stable safe-bound draws and a hardware frame-commit callback still do
not guarantee display completion before engine initialization. Retain the
independent presentation gate for startup trials; do not turn passing tree
or input checks into a timing qualification when that gate rejects a trace.

For paired trials, retain app data after predeclared warmups, force-stop each
process, alternate order and reject stale receipts using launch tokens.
Nonempty trace bytes do not establish capture readiness: wait for the actual
all-data-sources-started event before launching, then match that acknowledgement
against the completed trace. Trace receipt reads/writes and reject any before
the first presentation, including Activity destruction diagnostics. Keep first
presented Home, live-tree acceptance and actual OS-input confirmation distinct.
A commit/restore timestamp is not
first possible input latency. The fixture's
[startup protocol](../../tools/platform-qualification/native-prerender/README.md#matched-android-release-startup-controls)
owns executable assertions; reports/Silo own measurements and current verdicts.
The collector can select a physical phone only by explicit serial under a
`device:<serial>` reservation. It never shuts that phone down. Keep device
identity/API/firmware bound to each trial and distinguish a physical pilot
from a production performance or first-working-input qualification.

## Keep cold adoption separate from warm owner restoration

The Android Home control can use Core9.1.3's normal
`Application.run({ create })` entry after matching its prepared tree and before
committing claims. Core's actual `ActivityCallbacks.onCreate` installs the same
native viewport; the fixture forwards the already-completed native super only
once. The initial entry returns a prepared host with no logical children, then
Octane commit claims the existing native objects. This still uses the targeted
cold lifecycle-observer catch-up, not a general late-bootstrap API.

Once JS owns a live screen, a configuration recreation must not replay its
cold snapshot. The bounded Home restoration control keeps its Octane root,
hook state and logical wrapper parents through Core's saved-root-ID pipeline.
Before accepting a new Activity, it restores original Label native factories
and attachment methods, clears adopted Mason native/style caches and native
arrays, and requires cleared old Activity contexts/handles. It skips warm IR
decoding/allocation and lets Core create ordinary native objects from the
retained owners. It does not prepare or commit another Octane tree.

Use the same safe-area native viewport for cold, ordinary fallback and restored
roots. Replacing it with a plain Mason View can preserve owners and working
input while expanding the screen beneath system bars or a cutout. Ordinary
readiness must also require a draw at current safe bounds. Keep viewport/input
receipts and compare the observed root against the current window safe area;
positive child sizes and focus do not prove that geometry.

Retirement must work before any probe interaction as well as after a user state
change. Android can replace an Activity while the initial comparison is still
running. Keep the control's expected counter value in the runner's requested
recreation checks; asserting it before teardown can leave old native parents
attached when an earlier configuration change occurs. The comparison records
both native and ordinary viewport bounds so a launch-time inset change remains
an explicit parity failure rather than being hidden by a tolerance.

The maintained control checks the same twenty wrapper IDs, entry/launch counts
of one, unchanged nineteen claim calls, state4 on the first observed warm
layout, current window-safe root bounds, and real OS input4→5→3 afterward. It qualifies this fixed Home's live
state across one Activity replacement. It does not establish first-frame
presentation, complete warm child style/geometry parity, arbitrary topology/navigation/plugin
restoration or process-death persistence. Requalify Core save/root restoration,
Mason native-cache teardown and event reattachment when upgrading those inputs.

## Failed native insertion can escape ordinary tree cleanup

Verified with NativeScript Core9.1.3 and the qualification snapshot of
`@octane-xplat/nativescript-mason-core`1.0.0-beta.8 on Android: Mason's
`common.js` `insertChild` adds the child to its collection before calling Core's
`_addView`. If native attachment throws, its catch removes the collection entry
without clearing Core's parent/context state. Core establishes that state
during insertion; its separate `_removeView` operation clears the parent link.
See [Core's owning implementation](https://github.com/NativeScript/NativeScript/blob/9.1.3/packages/core/ui/core/view-base/index.ts).
The pinned Mason snapshot's implementation is authoritative for this control;
do not assume another checkout or beta has identical insertion semantics.

The actual nineteen-view Home fault control throws during its seventeenth
existing-child native attachment. Normal Octane unmount and host teardown can
leave seventeen claimed wrappers with Activity contexts/native handles even
when the host child count is zero. Core parent links can also survive. This is
runtime evidence of a partial-insertion cleanup gap, not a claim about ordinary
successful mounting or garbage collection.

The fixture keeps an explicit list of claimed wrappers. Its failure recovery
removes managed children normally and uses Core's internal `_removeView` seam
for a child whose parent still points into the failed scope but whose collection
entry is absent. It checks scope ownership first, unloads/tears down any residual
contexts, retires Mason native/style caches, and requires cleared parents,
contexts, handles and loaded state before ordinary rendering. It then empties
the discarded native/Mason tree. No dependency source is patched by this
control. Keep the internal removal seam version-pinned; it is not an app API.

Recheck this control when upgrading Mason insertion rollback, Core view
lifecycle or Octane host disposal. Remove the explicit orphan workaround only
when failed insertion clears Core ownership and the native fault control passes
without it. Empty child lists and cleared wrappers do not establish native or
Rust-object deallocation. General commit/application exceptions still fail;
the control recovers only from its distinct injected attachment error.

## Give process image caches an Application context

Core9.1.3's Android Activity-created handler calls `initImageCache` with the
Activity. Its bundled widgets `Fetcher.getInstance(context)` stores the first
context in the process singleton's `Worker.mContext` and does not replace it.
See [Core's initialization](https://github.com/NativeScript/NativeScript/blob/9.1.3/packages/core/application/application.android.ts)
and [the native singleton](https://github.com/NativeScript/NativeScript/blob/9.1.3/packages/ui-mobile-base/android/widgets/src/main/java/org/nativescript/widgets/image/Fetcher.java).
An actual Android heap retaining-path analysis found that singleton keeping a
retired Home Activity, its installed viewport, and all nineteen observed
native views/Mason Java nodes alive after wrapper teardown and repeated GC.

The cold native host initializes `Fetcher.getInstance(applicationContext)`
before JS and Core's first Activity callback. Core still configures its ordinary
image cache, but receives the already-created Application-bound singleton.
This uses the existing native API, not a dependency patch. It must happen before
the first singleton creation; a later `getInstance` call cannot repair an
Activity-bound singleton. This contract is qualified for the owning cold
Application host, not arbitrary embedding into an already-running process.

Native claims also have their own retirement contract: restore attachment
overrides, clear native/style caches and explicit native/parent/wrapper arrays,
and release logical owner links when the scope is discarded. The factory
closure captures only its claim state, rather than the whole Activity creation
activation. The lifetime control requires the retired nineteen views and
nineteen Mason Java Node objects to disappear through Java weak references,
then verifies the warm Home still handles OS input. This establishes the
bounded Java-object lifetime only, not Rust allocation counts or repeated-cycle
memory stability.

The SDK's public `Mason.debugStats()` also permits a live-node check. Capture
the accepted Home baseline before creating its hidden comparison root; a
baseline that already includes temporary references can conceal retention.
After retired Java objects collect, require native arena `liveNodes` and Java
registry `trackedNodes` to return to that baseline, then exercise the current
screen. Record buffer-pool counters separately: a larger free-slot pool can
coexist with unchanged live nodes and active buffer memory. These are bounded
allocation counters, not proof of whole-process or all native-byte reclamation.

Revisit the eager singleton initialization if upstream normalizes its context
to `getApplicationContext()` or Core supplies the Application directly. Remove
it only after the retired-object control passes without it. Inspect strong
retaining paths before diagnosing failed weak collection as a Mason engine
leak; optional heap capture is documented with the fixture.
