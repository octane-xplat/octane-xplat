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
The Android qualification host consumes XPI1 and matches complete logical slots
before claims; the iOS host still uses XPH1 during migration. Host-native decoder
checks do not establish mobile rendering or normal-app integration. Keep backend
value/font checks before native allocation. The current cascade reads viewport
dimensions only through media queries: retain exact dimension guards if any
registered query depends on width, height or orientation, including currently
unmatched rules. With no such query, Mason uses the actual viewport. This is
conservative dependency handling, not a general responsive expression program.

## Separate native layout, frame submission and presentation

Android's hardware `registerFrameCommitCallback` establishes swap-chain
submission, not display presentation. The Home gate waits for that callback
on supported hardware paths. Its safe-area readiness also requires the last
drawn bounds to match current parent padding with no pending layout. Include
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

The maintained control checks the same twenty wrapper IDs, entry/launch counts
of one, unchanged nineteen claim calls, state4 on the first observed warm
layout, and real OS input4→5→3 afterward. It qualifies this fixed Home's live
state across one Activity replacement. It does not establish first-frame
presentation, warm style/geometry parity, arbitrary topology/navigation/plugin
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
