# GTK UI parity work

The [export inventory](linux-gtk-ui-exports.json) lists every name reachable
from `packages/ui/src/index.mobile.ts` at `779d1047213df8664ffa42e527304c68ade6da62`:
357 runtime values and 764 type-only exports. It includes the shared barrel,
aliases, and the mobile `KeyboardAvoiding` override. The broader
[Linux capability inventory](linux-gtk-capability-inventory.md) also covers
services, leaf packages, packaging, and host infrastructure.

## Reading the inventory

Each module records its exported names, selected GTK/default source,
classification, and verification state. `findingSources` links to source
findings and line numbers in the same JSON file. Classification follows the
transitive relative runtime imports, excluding type-only imports and honoring
the GTK preset's escape-props alias. Cross-package runtime imports remain
explicit review items.

- `works-as-is`: source reuse candidate, or an erased type contract. This is
  **not** a runtime pass.
- `needs-renderer-or-prop`: the shared source requires an intrinsic, event,
  host method, or property binding that needs GTK implementation/qualification.
- `needs-gtk-leaf`: a NativeScript-only dependency, service stand-in, or explicit
  foreign platform import needs replacement at the GTK file boundary.
- `needs-review`: the source survey cannot settle a package boundary or parser
  result. Resolve these before promising support.
- `not-feasible`: reserved for a demonstrated platform limitation. No entry is
  assigned this classification from source inspection alone.

The inventory is a baseline survey, not a list of promised GTK exports.
`index.gtk.ts` remains the available root surface. Silo's `gtk_ui_checks` table
tracks each name individually, using the same Git origin identity across
worktrees. Source findings, compilation, runtime assertions, OS input and visual
qualification are separate evidence. Type-only exports need declaration
compatibility rather than widget execution.

## Implementation order

| Priority | Work | Required evidence |
| --- | --- | --- |
| 1. Primitives | View, Text, Pressable, gestures, ref/property semantics, icons/images | Mount/update/dispose; pointer press/cancel/drag; attributed text and image behavior |
| 2. Layout | Stack family, Grid, Layout regions, measurement, scrolling | XplatMason allocations, track/span changes, overflow, retained widget identity and cleanup |
| 3. Inputs | TextInput/TextArea, selection, checkbox/radio, slider, pickers | Controlled writes without feedback loops, selection, disabled/read-only behavior, keyboard/IME and OS input |
| 4. Overlays | Layer host, portals, menus, dialogs, sheets, tooltips, toast | Provider ownership, focus, outside dismissal, stacking, geometry and disposal |
| 5. Navigation | Root route outlet, app/navigation chrome, retained panes and windows | Push/Back retention, route lifetimes, modal behavior and actual input |
| 6. Theme | OS appearance, preference persistence, tokens, sizing, i18n | OS-change subscriptions, scoped updates, persistence and process restart |

Prefer renderer fixes to copies of reusable UI leaves. Add `.gtk` leaves where
the shared implementation depends on another host's APIs. Do not export a
component merely because tree-shaking makes its import compile. Preserve the
native names and prop contracts for every exported member. Reconcile generated
GTK declarations, public guidance, skill references and release notes as each
slice is qualified.

## Verification environment

The integration worktree is
`andromeda.local:/Users/alec/dev/alloc/worktrees/octane-xplat/gtk-ui-parity`,
based on `origin/main`. Runtime checks use a separate checkout at
`/home/alec/worktrees/gtk-ui-parity` inside that host's existing OrbStack
`octane-linux` guest: Ubuntu 24.04.5 x86_64, GJS 1.80.2, GTK 4.14.5. Headless
checks use Xvfb. No screenshots or visual analysis are part of this work.
The existing guest is shared infrastructure; do not shut it down as though it
were a disposable task-owned VM.

An initial frozen install on the clean base installed dependencies, then failed
its broad postinstall on a stale `store-review` renderer target (`octane`
versus `@octane-xplat/jsx`). Installing with `--ignore-scripts` and running the
focused Turbo tasks prepares only the required dependency graph. The existing
GTK test task passes on the Mac with its GJS-dependent cases skipped; that is
build evidence, not Linux runtime qualification.

## Mason test artifact prerequisite

The GTK binding on this base consumes a MasonCore archive from
`dist/native/mason-core/desktop/<triple>`. The public Mason fork at
`1f101ca` (`core-v1.0.0-beta.5`) has Apple-only `build-native.mjs` modes and no
`build.native.desktop` target. This is a build-tooling gap, not evidence that
Rust layout cannot execute on Linux.

For this investigation, a task-local Linux artifact is built with the pinned
fork's `cargo rustc -p mason-c --lib --release --locked --target
x86_64-unknown-linux-gnu --crate-type staticlib` and its exported
`prepareHeaders` helper. Its manifest records the source revision, toolchain,
Cargo.lock, header and archive hashes, and explicitly identifies this local
preparation. The GTK facade is then built by its maintained `build.sh`.
The task-local archive does not establish an upstream desktop build command or
packaged consumer support. The maintained upstream producer remains a follow-up.

## Primitive and layout slice

The GTK root now adds 22 runtime exports to the previous Text/Pressable pair:
View, VStack, HStack, Grid, GridSpan, Stack, StackItem, Center, Section, Layout,
LayoutHeader, LayoutContent, LayoutFooter, LayoutPanel, Absolute, Spacer, Badge,
Divider, ColorSwatch, SizeContext, SizeProvider and useSize. Existing shared
leaves are reused. The renderer dispatches pan/swipe/touch through GTK gesture
controllers; `pan.gtk.tsrx` preserves their shared payload instead of applying
the NativeScript numeric-state adapter. Keep the matching `.tsrx` extension:
the preset's `.tsrx` resolution precedes `.gtk.ts`.

The maintained renderer task passes 28 tests in the Linux guest, with none
skipped. Its UI fixture performs 42 assertions, including real Mason allocation
of a Stack row, track/span propagation, size inheritance, press/cancel/drag
payloads, disabled-handler removal, current callbacks and teardown. The separate
Xvfb/X11 test sends actual pointer clicks and a drag with xdotool, checks GTK
hit-testing, verifies balanced press-in/out and receives the pan lifecycle.
Controller-signal checks and OS-input checks are distinct; neither establishes
visual or assistive-technology parity.

The declaration fixture compares every GTK runtime export with the generated
native public surface and checks representative prop contracts plus a rejected
invalid direction. It compares consumer declarations, not unrelated platform
source bodies under GTK-only conditions. The UI/dependents typecheck passes all
58 tasks; the expanded renderer/workshop/dependents check passes all eight.
`pack:check` validates packed exports and the declaration graph. Recipe structure
and links pass; this slice changes available components, not CLI workflows, so
no recipe requirements were changed. The Linux GTK packaging recipe now links
the named primitive/pointer evidence without treating it as packaged-consumer
verification. Coverage and execution are tracked separately in Silo
`gtk_recipe_checks`; the legacy `recipe_audit` target constraint excludes
Linux and is preserved. Full export qualification remains in
progress in Silo; these assertions do not close each component's entire prop,
keyboard, accessibility or visual contract.

Nested GTK containers use their actual allocation as a temporary definite engine size while laying out children. The adapter restores authored dimensions afterward; otherwise an auto-sized Grid recomputes its children at natural width inside an already stretched GTK widget. The retained Grid fixture checks two equal columns, a spanning child, an authored-width change and clearing that width.

The docs site build fails in `@tsrx/oxc@0.16.0` with `unsupported TSRX parser shape: reachable synthetic ESTree span`. It also fails with the guide restored to its original base content, while the GTK changes remain in the worktree. The diagnostic does not identify the module, so its full scope is unresolved. Both build logs are retained on andromeda in `/tmp/gtk-ui-docs-{build,baseline}.log`; the edited guide was restored after the comparison.

## Measurement slice

GTK refs remain the actual Gtk.Widget. The renderer adds app-content
`getBounds()`, allocation-size queries, and explicit `loaded`, `unloaded`,
and `layoutChanged` subscriptions. A subscribed frame callback compares bounds,
so ancestor scrolling and movement are observed without global screen positions.
It is removed when the last layout listener leaves, on unmap, on host recreation,
and on destruction. Other imperative event names currently throw.

The GTK `useMeasure` leaf uses this renderer protocol; it does not import GI
into UI or pretend a Gtk.Widget is a NativeScript View. The shared AspectRatio
component derives height from observed allocation and remains shared. The
curated barrel now contains 26 runtime exports and 31 type exports.

The maintained `ui-measure` fixture checks app-space bounds, actual size,
aspect-ratio layout at two parent widths, ancestor scroll movement, unchanged
frame coalescing, independent subscription removal, ref replacement,
`observe: false`, and unmount cleanup. Its host uses start alignment to constrain
the test width; a GTK content host with fill alignment can stretch a child beyond
its size request. Runtime qualification requires the real Mason typelib.
Renderer tests run serially because windows sharing one X11 display can otherwise
occlude the pointer fixture. No screenshots or visual analysis are involved.

Authored root dimensions under a fill-aligned GTK host remain an explicit
renderer parity gap (Silo feedback be181a83-f05c-48e7-a505-fed423af5ac6).
Opaque JSX root-mount typing, writable ref transforms/animation, scrolling
handles, the rest of the inputs, overlays, navigation and theme remain open.
The named checks do not prove ellipse clipping, all fit/shape styles, keyboard,
accessibility, Wayland, or full public-contract parity.

The Linux renderer task passes all 29 tests without skips, with 13 measurement
assertions plus the existing 42 primitive assertions and separate real X11
pointer input. The UI/dependent typecheck passes 58 tasks; the final expanded
renderer/dependent check passes eight. Packed exports/declarations, recipes and
release-note validation pass. Logs on andromeda: /tmp/gtk-ui-measure-types.log,
/tmp/gtk-ui-measure-renderer-types.log, /tmp/gtk-ui-measure-pack.log; guest runtime
log: /tmp/gtk-ui-measure-test-final.log. The existing docs-site parser failure
above remains unresolved; these checks do not claim a successful site build.

## Numeric root size correction

The root-sizing gap above is fixed for finite numeric widths and heights.
When a Gtk.Box hosts a renderer node, definite dimensions now select native
start alignment instead of silently stretching its size request. Auto dimensions
restore fill, explicit non-stretch alignment is preserved, and flex growth can
still enlarge the main axis. Mason parents continue to own child allocation;
moving a retained widget across the GTK/Mason boundary resets the old alignment.

The default fill-aligned measurement fixture now verifies a 200→160 width
change and clearing the width back to 300, with matching AspectRatio heights.
Four direct-driver checks cover numeric root sizing, reparenting into Mason,
moving back to Gtk.Box, and clearing a retained root's width. All 29 Linux tests
pass without skips (19 measurement assertions plus 42 primitive assertions and
the separate actual X11 pointer test). The expanded renderer/dependent typecheck
passes all eight tasks. Logs: guest /tmp/gtk-root-sizing-test.log and andromeda
/tmp/gtk-root-sizing-types.log. This does not qualify percentage/min/max root
dimensions or every alignment/flex interaction.

## Numeric animation and translation slice

The GTK barrel now exposes setTranslate and useAnimation, plus their three
shared types (28 runtime exports and 34 type exports in total). setTranslate
reuses the shared implementation: GTK refs expose backed transform properties.
The GTK animation leaf uses the shared createAnimatedValue state machine and the
existing GJS timer-backed animation-frame shim, writing through view.style so
GTK's read-only width/height properties are preserved.

The renderer keeps a local numeric style layer above authored inline values
and below CSS keyframe samples. It survives unrelated component renders; deleting
a local key reveals authored styling. Numeric writes are finite and restricted
to supported transforms, opacity, dimensions, box edges and text metrics.
Uniform scale writes both axes. Transform reads resolve authored shorthand;
disposed refs release their style callbacks and cannot revive destroyed nodes.
These are explicit backed operations, not a general NativeScript Style facade.

The real Linux renderer task passes 30 tests without skips. The new animation
fixture performs 24 assertions: actual allocation bounds for setTranslate and
timed movement, native opacity, width, uniform scale, stable hook identity,
frozen authored props, deletion, CSS keyframe precedence/restoration, timing,
spring settlement, replacement, stop, ref detachment and unmount cancellation,
invalid writes and stale-ref cleanup. The existing measurement fixture retains
19 assertions and the primitive fixture 42. Actual X11 pointer input is a
separate fixture; animation geometry checks do not prove transformed OS
hit-testing, visual frame pacing, assistive technology, or Wayland behavior.

The UI/dependent typecheck passes all 58 tasks; packed exports and declaration
graph, web barrel consistency, recipe structure and release notes pass.
The final renderer/dependent typecheck passes all eight tasks
(/tmp/gtk-animation-renderer-types-final.log).
Other logs: andromeda /tmp/gtk-animation-{types,pack,barrels,recipes,changelog}.log
and guest /tmp/gtk-animation-test-final.log. The existing docs-site parser
failure is still unresolved. GTK system reduced-motion behavior for imperative
playback and exhaustive numeric-property qualification remain open.

## Headless scrolling slice

The GTK barrel now exposes useScrollableArea and its ten shared types:
29 runtime values and 44 types in the curated surface. The native hook is reused.
Pass HostElement from @octane-xplat/jsx/intrinsics as its generic argument when
spreading the returned refs onto strict GTK intrinsics. Its shared default is
object; the stale props comment claiming HostElement has been corrected without
changing the native public signature. Silo feedback
66c5f87f-6928-4de0-9760-48d691d80850 preserves that typing mismatch.

Gtk.ScrolledWindow refs now expose scrollWidth/Height, clientWidth/Height,
scrollLeft/Top, scroll and layout subscriptions, and vertical/horizontal offset
methods. GtkAdjustment is authoritative for dimensions, ranges and movement.
Animated writes use a bounded monotonic-time transition; immediate writes,
replacement, external native movement and destruction cancel the prior work.
GTK's disabled-animation setting makes animated offsets immediate. Extent
changes notify layout subscribers even when the viewport's bounds stay fixed.

Axis and indicator settings now compose from the complete prop bag instead of
overwriting each other. Hidden indicators use GTK_POLICY_EXTERNAL on allowed
axes; GTK_POLICY_NEVER would let content determine the size rather than retaining
the viewport. This distinction is documented in the
[GTK PolicyType reference](https://docs.gtk.org/gtk4/enum.PolicyType.html).

The maintained scroll fixture performs 21 assertions on real Ubuntu/GJS/GTK,
including an actual X11 wheel event sent with xdotool. It checks both axes,
edge flags, range clamping, intermediate animation and final offsets, replacement,
native interruption, hidden indicators, axis changes, content resizing,
subscription independence and teardown. All 31 renderer tests pass without
skips; animation, measurement and primitive checks remain included. This is
Linux Xvfb/X11 evidence, not Wayland, assistive-technology or visual evidence.

The UI/dependent typecheck initially passed 57 tasks and failed the renderer
fixture's object ref generic. The corrected renderer/dependent check passes all eight tasks
(/tmp/gtk-scroll-renderer-types-final.log); the full initial log is
/tmp/gtk-scroll-types.log. Packed exports/declarations, recipes and release
notes pass. Runtime logs: guest /tmp/gtk-scroll-test-final.log; first full runtime
run /tmp/gtk-scroll-test.log. The public setup/packaging recipe requirements are
unchanged; widget/hook evidence is distinct from packaged-consumer verification.

The ScrollableArea component remains absent from the GTK barrel until its
refresh controller, indicator and both-axis handle have been qualified. Generic
masonview overflow and input-only isScrollEnabled behavior remain open.

## Source component root typing

Octane 0.14.0's published universal-core declarations require UniversalComponent,
including compiler-owned UNIVERSAL_COMPONENT metadata and a UniversalRenderable
return. Xplat's shared JSX NativeNode is deliberately unknown in source
declarations. Consequently a source TSRX component cannot be passed directly to
the upstream root type, even though the GTK preset compiles that component for
the universal runtime. This is a source-type/compiled-ABI boundary constraint,
not evidence of a runtime renderer failure.

GTK now exposes GtkRoot and GtkComponent as its source-facing binding.
prepare/render/renderAsync infer props from the component; NoInfer on the
props argument prevents a mismatched bag from widening the component's contract.
createGtkRoot, container.root and the runGtkApp mount callback expose that same
binding. The runtime object, event handling, transport, disposal and compilation
requirements are unchanged; the binding assertion stays at createGtkRoot.

The [maintained declaration fixture](../../../packages/linux-gtk-renderer/test/fixtures/src/ui-types.gtk.ts)
accepts real TSRX source components and upstream branded components through every
mount entry, rejects missing/wrong props, and checks assignment back to UniversalRoot.
A separate expected-error case preserves the upstream constraint explicitly.
This is type-level qualification. Reassess the bridging assertion when source
declarations carry the upstream metadata/renderable contract, or Octane provides
a source-facing mount overload; it must not become an application-level cast.

The expanded renderer/dependent typecheck passes all eight tasks, including the
source mount cases and rejected prop bags (/tmp/gtk-root-mount-types-final.log).
Recipe structure/local links pass. This change is erased at compilation; it
adds no new runtime behavior and does not claim a new GJS runtime qualification.

## Cancelled native refresh gestures

The shared native refresh controller used to route GestureStateTypes.cancelled
(0) through the same threshold-release path as ended (3). A cancelled pull could
therefore call onRefresh. Cancellation now collapses an idle reveal or preserves
a controlled dock without invoking the callback. The existing positive release
path is unchanged. The controller also serves the iOS table and Android
recycler leaves; their source file is unchanged.

Eight new native controller tests simulate both isIOS branches, covering
cancellation past the threshold, a held controlled refresh, a dock deferred
during touch, positive release and teardown. The focused Turbo test:native task
passes (/tmp/gtk-refresh-native-focused.log). These are Node/controller tests,
not iOS or Android OS runtime evidence.

The full native task passes 452 tests and fails the unchanged
batch-observer.mobile.test.ts expectation that an observer exception propagates;
the installed patched driver logs it instead. The failure reproduces with only
that existing test selected (2 pass, 1 fail). Its source, native test config/shim,
dependency lock and canonical NativeScript patch are unchanged from origin/main
779d104. Logs: /tmp/gtk-refresh-native-tests.log and
/tmp/gtk-native-batch-isolated.log. This is an isolated unchanged-test reproduction,
not a claim that a separate clean-main checkout was executed. Keep its assertion
and report the failure rather than weakening the criterion.

## ScrollableArea and Spinner slice

The GTK barrel now adds ScrollableArea, Spinner and four associated shared types:
31 runtime values and 48 types in the curated surface. Both components reuse
their native source. ScrollableArea's shared refresh wrapper now applies the same
dimension styles as its core variant, places viewport and indicator explicitly
in one grid cell and clips overflow through GTK-scoped stylesheet rules. It expresses its initial transform through
the style channel. The core/both-axis handle contract is preserved.

GTK refs can subscribe imperatively to pan through the same GestureDrag wiring
as declarative events, with independent subscription ownership and teardown.
Imperative pan payloads use NativeScript's numeric states/deltaX/deltaY for the
shared native controller; public onPan props retain normalized string states.
The internal docking animate operation accepts translate and duration only,
settles with finished/cancelled status, and cancels on direct transform writes
or disposal. It is not a general NativeScript animation facade.

Real GTK exposed two binding mistakes during qualification. Gtk.Widget.get_width
reports the content width; getActualSize now reads untransformed border-box
bounds (including CSS border) from compute_bounds(view). The GJS accessible
property binding expects property/value arrays, not C varargs. Labels now use
that array binding, reset through reset_property, and never substitute the
automation name. GTK's test AT context verifies label storage; this does not
prove screen-reader behavior. References:
[widget width](https://docs.gtk.org/gtk4/method.Widget.get_width.html) and
[accessible property binding](https://docs.gtk.org/gtk4/method.Accessible.update_property_value.html).

An empty default testID also used to erase the widget name set by id. Identifier
writes now derive from the complete bag: nonempty testID, then automationText,
then id. Removing an override restores the remaining identifier; the separate
CSS id remains stable. A dropped id clears its selector state.

All 32 real-Linux renderer tests pass without skips. The new area fixture has
31 assertions: dimensions, padding, both-axis handles, animated/omitted/clamped
offsets, native Spinner activity and border-box size, labels and identifiers,
refresh clipping/reveal/threshold/cancel/controlled state, callback freshness,
busy updates and disposal. xdotool performs a real X11 pull gesture; existing
wheel and Pressable pointer fixtures remain separate OS-input evidence.
Log: guest /tmp/gtk-area-test-platform-final.log. No images were captured or analyzed.

The full UI/dependent typecheck passed 57 tasks and rejected an invalid numeric
Spinner size in the fixture. The public native contract uses named sizes; the
fixture now uses md/sm without widening GTK's API. The corrected expanded
renderer/dependent check passes all eight tasks
(/tmp/gtk-area-css-types.log). The CSS declaration audit reports zero unsupported
declarations; recipe structure/local links and all 11 release notes validate.
Packed exports/declarations pass
(/tmp/gtk-area-pack.log). The shared controller's focused eight native tests
pass; the broad native batch-observer failure above remains unchanged.
The docs-site parser failure remains open. These checks do not establish
visual parity, every common/accessibility prop, Wayland, or mobile OS runtime
qualification of the shared wrapper styling.
