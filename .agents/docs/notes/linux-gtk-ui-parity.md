# GTK UI parity work

The [export inventory](linux-gtk-ui-exports.json) lists every name reachable
from `packages/ui/src/index.mobile.ts` at `779d1047213df8664ffa42e527304c68ade6da62`:
357 runtime values and 764 type-only exports. It includes the shared barrel,
aliases, and the mobile `KeyboardAvoiding` override. The broader
[Linux capability inventory](linux-gtk-capability-inventory.md) also covers
services, leaf packages, packaging, and host infrastructure.

Current availability is 68 runtime values and 105 types in index.gtk.ts, including
Tooltip, the text-entry controls, field/group owners, selection indicators,
CheckboxInput, Switch, RadioList, RadioListItem, NumberInput, CheckboxList, CheckboxListItem, SegmentedControl, SegmentedControlItem, PinInput, Slider, InputRating and SelectorOption. Counts in the earlier slice records describe those commits; the JSON
remains the original source survey and Silo holds per-export qualification.
TextArea uses the shared native leaf with GTK fitting and native TextView
support. The current root qualification and remaining limits are recorded
at the end of this note.

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

| Priority      | Work                                                                  | Required evidence                                                                                           |
| ------------- | --------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| 1. Primitives | View, Text, Pressable, gestures, ref/property semantics, icons/images | Mount/update/dispose; pointer press/cancel/drag; attributed text and image behavior                         |
| 2. Layout     | Stack family, Grid, Layout regions, measurement, scrolling            | XplatMason allocations, track/span changes, overflow, retained widget identity and cleanup                  |
| 3. Inputs     | TextInput/TextArea, selection, checkbox/radio, slider, pickers        | Controlled writes without feedback loops, selection, disabled/read-only behavior, keyboard/IME and OS input |
| 4. Overlays   | Layer host, portals, menus, dialogs, sheets, tooltips, toast          | Provider ownership, focus, outside dismissal, stacking, geometry and disposal                               |
| 5. Navigation | Root route outlet, app/navigation chrome, retained panes and windows  | Push/Back retention, route lifetimes, modal behavior and actual input                                       |
| 6. Theme      | OS appearance, preference persistence, tokens, sizing, i18n           | OS-change subscriptions, scoped updates, persistence and process restart                                    |

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

## Icon and registry slice

The GTK barrel adds Icon, IconRegistryProvider, createIconRegistry, registerIcon
and registerIcons, plus their seven shared types: 36 runtime values and 55 types.
The native Icon and registry/provider components are reused. The svg.gtk source
helper keeps file/data/URL strings intact for renderer decoding, avoiding the
shared helper's browser-only fetch/atob assumptions.

New image/svgview intrinsics use Gtk.Picture, with real GDK texture decoding,
scoped registry overrides, custom-property/currentColor tinting, independent
widget/source identity, source cancellation, explicit clearing and disposal.
The [renderer note](linux-gtk-renderer.md#gtk-icon-and-picture-sources) records
SVG loader/Soup requirements, the local :root and desktop #id fixes, and the
boundary between raw intrinsics and Image's still-unqualified wider contract.
The desktop selector fix is committed separately as 350f4e8cc.

The focused Ubuntu/GJS/GTK fixture passes 44 state/dimension/lifecycle assertions
(/tmp/gtk-icon-test-clear.log). These include actual loopback HTTP loading,
registered GResource and filesystem sources, a synthetic one-pixel PNG's
dimensions, stale promises/requests, clearing, failures and cleanup.
No screenshot, pixel inspection, OS input or external AT client is used by this
fixture. Stored GTK accessibility name/hidden state is narrower evidence than
screen-reader behavior.

Both expanded UI/CSS-engine checks pass 63 tasks, including the selector fix
(/tmp/gtk-icon-types-expanded.log and /tmp/gtk-css-id-types.log). CSS-engine
tests pass all 37 cases; packed declarations pass six tasks. The declaration
surface preserves shared native types. The prior native batch-observer and
docs-site parser failures remain open. Recipe structure/local links, 12 release
notes and the CSS declaration audit pass. This adds no UI dependencies or peers;
the existing GTK packaging recipe criteria remain unchanged and not runtime
qualified by these widget tests.

The final combined renderer suite passes all 33 tests without skips
(guest /tmp/gtk-icon-test-final.log), retaining separate real X11 click/drag,
pull and wheel fixtures. The icon fixture retains all 44 assertions.
The final expanded renderer/dependent typecheck passes eight tasks
(andromeda /tmp/gtk-icon-types-complete.log). No macOS GTK stand-in,
Wayland, visual/pixel or external screen-reader qualification is added.

## Native text-input ref foundation

The shared TextInput's imperative text-write and focus/blur paths now work on
real GTK refs. Text writes preserve Unicode code-point cursor positions and
clamped/reversed selections without controlled onChange echoes. Read-only editing
uses GtkEditable independently of disabled sensitivity. Default/removed hint,
secure and keyboard-purpose props reset their prior values; labels/hints use
stored GTK accessibility text, including explicit undefined resets.

A capture controller cancels delayed selection repair on real key/button/touch
input; the fixture creates a controlled write immediately before an OS Left key
and verifies that repair does not move the cursor back. Dispose cancels pending
repair and makes stale .text/focus/blur ref operations inert. Nested native focus
events use the universal root's dispatchEvent scope inheritance, so Clear can
focus its field and run the current callback inside the discrete press scope.
The [renderer note](linux-gtk-renderer.md#native-text-refs-and-editable-behavior)
records GTK 4.14.5's wrapper cursor limitation and its delegate-property workaround.

The focused real-Linux fixture passes 51 assertions
(guest /tmp/gtk-text-ref-test-fifth.log). It exercises shared TextInput source,
programmatic value writes, field label/description, clear through GTK controller
dispatch, native focus ownership, and real X11 keyboard edit/Return/readonly/
disabled/navigation phases. Clear's controller dispatch is separate from OS
input evidence. No IME, AT-client, compositor or pixel qualification is claimed.
The final expanded renderer/dependent typecheck passes eight tasks
(andromeda /tmp/gtk-text-ref-types-final.log).

The curated UI barrel stays at 36 runtime values and 55 types. TextInput remains
a direct-source fixture until its field-tooltip/full-state contract is qualified;
TextArea still needs a multiline intrinsic and row sizing. This foundation
changes no UI source or public prop types, adds no dependency, and does not turn
the wider input surface into a passed qualification. Recipes remain unchanged;
their packaging/runtime requirements are not proved by this widget fixture.

The final combined real-Linux renderer suite passes all 34 tests without skips
(guest /tmp/gtk-text-ref-test-final.log), including 51 text-entry assertions and
the earlier real X11 press/drag, pull and wheel fixtures. The final expanded
renderer/dependent typecheck passes eight tasks
(andromeda /tmp/gtk-text-ref-types-final.log). Recipes and all 12 release notes
validate. The existing broad native batch-observer and docs-site parser
failures are unchanged; this slice adds no mobile OS runtime qualification.

## Portal foundation for overlays

The renderer now implements universal portal target registration and host
attachment. The maintained ui-portal fixture imports the existing shared
native-portal helper directly, retaining Octane providers and component state
through target changes and keyed reordering. It also exercises abort/disposal,
caller-owned GTK children, CSS refresh and Fixed/Grid placement. See
[driver ownership](linux-gtk-renderer.md#universal-portal-target-ownership).

This foundation changes no curated UI root exports: 36 runtime values and
55 types remain qualified. Tooltips/dialogs/other overlays still need their
platform leaves, focus/dismissal/geometry behavior and runtime qualification.
The full parity goal remains open. No recipe workflow changes are introduced;
these widget checks do not establish packaged consumer support.

The combined real-Linux renderer suite passes all 35 tests without skips,
including 48 portal assertions (guest /tmp/gtk-portal-combined-final.log).
The portal fixture uses GTK 4.14.5/GJS 1.80.2 on Ubuntu 24.04 amd64 with real
XplatMason and private Xvfb. It checks native widget properties and controller
dispatch; the existing press/drag, pull, wheel and text-entry fixtures retain
their separate actual X11 input evidence. The expanded renderer/dependent
typecheck passes eight tasks (andromeda /tmp/gtk-portal-types-final.log).
Recipe structure/local links and all 13 release notes validate. No mobile OS,
IME, AT-client, Wayland or pixel evidence is added by this portal fixture.

## Tooltip qualification

The GTK root now adds Tooltip with shared TooltipProps and PopoverPlacement:
37 runtime values and 57 type exports. The .gtk leaf keeps content in its original
universal root through a portal. Renderer-owned GtkPopover/controllers implement
hover delays, immediate child focus, Escape/blur/ancestor-scroll dismissal,
reactive disabling, allocation tracking and cleanup. Shared FormField now imports
the platform-resolved Tooltip basename, allowing its labelTooltip to reach GTK.

The maintained ui-tooltip fixture exercises shared-field integration, primitive
and provider-backed content, updates without remounting, native padding and
surface coordinates, all placements, disabled intent, focus retention, accessible
role/reference storage and cleanup. Real X11 pointer/Tab/Escape phases are separate
from controller-signal checks. No AT-client, IME, Wayland or pixel qualification
is claimed. GTK 4.14+ supplies the boxed reference-list API; older GTK fails with
a direct requirement message. The verified 4.14.5 array-constructor guard and
list-constructor workaround are recorded in the renderer note.

TextInput remains a direct-source fixture until its complete field/state/prop
surface is qualified. TextArea's multiline host and the other input families,
overlays, navigation and theme remain open. The Tooltip addition does not change
recipe workflows or establish packaged consumer support.

The final combined real-Linux renderer suite passes all 36 tests without skips
(guest /tmp/gtk-tooltip-tests-final.log), including 50 Tooltip assertions with
actual X11 pointer hover/leave, Tab and Escape. Runtime: Ubuntu 24.04 amd64,
GJS 1.80.2, GTK 4.14.5, XplatMason and private Xvfb. The retained prior fixtures
also pass their separate actual press/drag, pull, wheel and text-entry checks.
The expanded UI/renderer/dependent typecheck passes 58 tasks
(andromeda /tmp/gtk-tooltip-types-complete.log); packed exports/declarations pass
six tasks (/tmp/gtk-tooltip-pack.log). Recipe structure/local links, all 14 release
notes and UI barrel synchronization validate. GTK source/generated barrels both
contain 37 values and 57 types; native and GTK Tooltip declarations both take
TooltipProps and return unknown. No mobile OS, AT-client, IME, Wayland or pixel
qualification is added. The existing broad native batch-observer and docs-site
parser failures remain outside this slice's passing evidence.

## Input accessibility foundation

The GTK adapter and renderer now preserve simultaneous accessibility state
instead of dropping a collapsed native enum. Shared TextInput forwards resolved
readOnly/required/busy/invalid flags alongside disabled state. Native GtkEditable
and sensitivity continue to control interaction; metadata does not replace them.
The maintained ui-accessibility fixture compares actual stored values through
fixed-signature GTK test bindings, including false/true/mixed, reset behavior,
native switch restoration, field optionality and combined description text.

The curated root stays at 37 values and 57 types. TextInput remains a direct-source
fixture: its remaining field/prop review, standalone width forwarding, return-key
hint behavior and complete common-prop coverage are not established by these
metadata checks. TextArea still needs multiline behavior and row/growth sizing.
No recipe workflow or packaged-consumer support is added by this foundation.

The final combined Linux suite passes 37 tests without skips, including 58 exact
accessibility comparisons (guest /tmp/gtk-a11y-tests-final.log). The focused
fixture also passes independently (/tmp/gtk-a11y-runtime-first.log). Runtime:
Ubuntu 24.04 amd64, GJS 1.80.2, GTK 4.14.5, XplatMason and private Xvfb. Existing
OS pointer/drag/pull/wheel/keyboard/tooltip fixtures remain passing; this new
fixture itself checks metadata rather than OS input or an AT client. The native
facade rebuild passes with the pinned Linux archive and explicit
XPLAT_MASON_CORE_TARGET=x86_64-unknown-linux-gnu
(guest /tmp/gtk-a11y-native-build.log). GTK's installed GIR marks the original
variadic check_state function introspectable=0.

The expanded UI/renderer/dependent typecheck passes 58 tasks
(andromeda /tmp/gtk-a11y-types-final.log); packed exports/declarations pass six
tasks (/tmp/gtk-a11y-pack.log). Recipes and all 15 release notes validate. Public
UI prop types and the curated 37-value/57-type root surface are unchanged.
No mobile OS, IME, AT-client, Wayland or pixel qualification is added. Existing
broad native batch-observer and docs-site parser failures remain outside this
slice's passing evidence.

## Pressable keyboard qualification

Semantic button/link Pressables now have native focus stops and keyboard press
ownership. Disabled maps to native sensitivity. The maintained ui-press-keys
fixture distinguishes controller-signal checks from actual X11 Tab/Return/Space
input; it also covers held-key cancellation, callback replacement, nested entry
input, host role replacement and disposal. Role changes use the universal core's
existing recreation protocol because realized GTK accessible roles are immutable.
See [renderer details](linux-gtk-renderer.md#semantic-pressable-keyboard-ownership).

The curated root stays at 37 values and 57 types. This foundation does not qualify
all common props, other semantic roles, IME, Wayland, AT clients or pixels. No
recipe workflow is changed; TextInput's remaining field/prop work and TextArea's
multiline/sizing support remain pending.

Qualification: the full Linux renderer suite passes 38 tests without skips
(guest /tmp/gtk-press-keys-tests-final.log), including 48 keyboard assertions.
The final focused fixture adds three retained-child/focus-delegate checks and
passes 51 assertions with actual X11 Tab/Return/Space/cancellation input
(/tmp/gtk-press-keys-focused-final.log). Runtime: Ubuntu 24.04 amd64,
GJS 1.80.2, GTK 4.14.5, XplatMason and private Xvfb. This is real Linux evidence,
not the Homebrew stand-in. No screenshots or AT-client/IME/Wayland/pixel evidence
were collected.

UI/renderer/dependent typechecks pass 58 tasks
(andromeda /tmp/gtk-press-keys-types.log); subsequent renderer/fixture changes
pass the expanded eight-task check (/tmp/gtk-press-keys-types-complete.log).
Packed exports and declarations pass six tasks (/tmp/gtk-press-keys-pack.log).
Recipes, all 16 release notes, synchronized UI barrels, formatting and whitespace
checks pass. Final source-only changes after these checks format the TSRX
fixture; behavior is unchanged. Existing broad native batch-observer and
docs-site parser failures remain outside this slice's passing evidence.

## TextInput field width and status qualification

Shared TextInput applies width to its bare shell when no FieldContext owns the
outer width. Its automatic FormField receives statusVariant, read-only, loading
and size. Percentage width is applied by one owner rather than both wrappers.
The clear control and label-help trigger now declare button roles. GTK's status
policy preserves tooltip; the default touch policy keeps the documented detached
fallback. A status tooltip uses a focusable 20-dip glyph and existing Tooltip
ownership. Switching attached/detached/tooltip presentation keeps the control in
the same FieldProvider slot, preserving its native entry and uncontrolled text.

The maintained ui-field-chrome fixture passes 44 assertions on real Ubuntu
24.04 amd64, GJS1.80.2, GTK4.14.5, XplatMason and Xvfb
(guest /tmp/gtk-field-chrome-first.log). It checks native allocated absolute and
percentage widths, wrapper classes, status portal updates/disposal, and actual
X11 Tab/Return/Escape access to clear, label help and validation status. Native
regressions pass 58 Node checks plus 29 selected Vitest assertions across
forms-layout, state-roles and text-input
(andromeda /tmp/gtk-field-chrome-native-tests.log). These native adapter tests
are not iOS/Android device evidence.

This is further direct-source TextInput qualification, not a GTK root export.
Return-key caption hints, remaining common props and inherited size/state
interactions, retention when automatic chrome appears/disappears, IME,
AT-client/Wayland and pixels remain open. TextArea still needs multiline and
row/growth behavior. The curated root remains 37 values and 57 types. No recipe
workflow changes in this slice; the maintained source fixture is the proving
harness.

Final combined evidence: 39 Linux renderer tests pass without skips, including
44 field-chrome assertions and 51 semantic keyboard assertions
(guest /tmp/gtk-field-chrome-tests-final.log). The expanded UI/renderer/dependent
typecheck passes all 58 tasks (andromeda /tmp/gtk-field-chrome-types.log).
Recipes, UI barrel synchronization, all 17 release notes, formatting and
whitespace validate. Only a multiline JSX attribute formatting change followed
the runtime/type checks; behavior and public prop types are unchanged.

Packed export/declaration validation also passes six tasks
(andromeda /tmp/gtk-field-chrome-pack.log). Existing broad native batch-observer
and docs-site parser failures remain outside this slice’s passing evidence.

## Stable native TextInput ownership

Adding or removing an automatic label previously switched TextInputControl
between component branches. A real X11 edit followed by label insertion fails
on the previous source because native entry/public-handle identity changes
(guest /tmp/gtk-entry-lifecycle-before.log). That is an observed remount; the
old branch structure also created a fresh uncontrolled state owner.

Standalone native TextInput now always mounts the same automatic FormField,
even when none of its chrome is visible. Inside an existing FieldContext it
still uses the existing field owner. Width belongs to that outer owner; the
control no longer repeats it on its shell. The automatic wrapper receives
resolved field props, so inherited size and state match the editor. The inner
control receives the original props so description/status hints are resolved
once rather than concatenated twice. The tradeoff is one neutral layout view
for a previously bare standalone input.

The focused real-Linux fixture passes 56 checks after the fix
(/tmp/gtk-entry-lifecycle-after.log), including actual X11 typing followed by
label insertion/removal, exact entry/ref/selection/focus retention, inherited
size updates and explicit size precedence. Existing clear/help/status keyboard
checks remain in that fixture. Native object-driver regression coverage now
queries the editor and clear label instead of assuming a wrapper depth; it adds
an edited-state retention regression. Broad native tests pass 453 Vitest cases
and fail the same previously recorded batch-observer expectation that an
observer exception escapes; its test/config/lockfile/canonical Octane patch
remain unchanged from the task base. The task's prior note records the same
isolated failure. This is not a passing broad-native-suite claim.

TextInput remains direct-source while remaining input-purpose/return-caption
and common-prop qualification proceeds. No GTK root export, recipe workflow,
IME, AT-client, Wayland, mobile-device or pixel qualification is added here.

Final evidence: full real-Linux renderer suite passes all 39 tests without
skips, including the 56-check lifecycle/field fixture
(/tmp/gtk-entry-lifecycle-tests-final.log). The final focused fixture adds
first-validation-message insertion/removal and passes 59 checks with actual
X11 typing and clear/help/status keyboard input
(/tmp/gtk-entry-lifecycle-focused-final.log). Runtime remains Ubuntu24.04 amd64,
GJS1.80.2, GTK4.14.5, XplatMason and private Xvfb. UI/renderer/dependent typechecks
pass 58 tasks (/tmp/gtk-entry-lifecycle-types.log); the final fixture changes
pass the expanded eight-task renderer check
(/tmp/gtk-entry-lifecycle-types-final.log). Packed declarations/exports pass six
tasks (/tmp/gtk-entry-lifecycle-pack.log). Focused native tests pass 58 Node
checks and 30 Vitest cases (/tmp/gtk-entry-lifecycle-native-focused.log).
Recipes, UI barrel synchronization, 17 release notes, formatting and whitespace
pass. Root remains 37 values and 57 types; no new UI dependencies or public prop
types. The broad-native batch-observer failure and docs-site parser failure
remain outside passing evidence.

## GTK TextInput root qualification

The curated root adds TextInput with the native TextInputProps and
TextInputHandle, plus FieldControlProps, FieldControlSize, FieldStatusInfo,
FieldStatusType and FieldStatusVariant. FieldStatusInfo preserves the native
barrel's alias; FieldStatus names a different component and is not added.
Source/generated shape checks compare every current GTK value and all seven
new type exports against the native barrel. Availability is now 38 values
and 64 types; earlier counts above describe their commits.

Maintained text-entry, field-chrome, accessibility and Tooltip fixtures now
import TextInput from the curated root. The focused text-entry fixture passes
89 real-Linux checks (/tmp/gtk-textinput-root-focused.log), including native
computed placeholder colors and resets, all six input purposes, custom classes,
testID/native-id fallback, leading icon/node/removal, controlled/native text
writes, repeated rejected insertions, accepted edits, selection/focus, clear,
Return and lifecycle ownership. Signal dispatch is distinguished from actual
X11 typing/navigation/submission; no IME, OSK, AT-client, Wayland or pixel proof
is implied.

A leading-content change previously remounted the unkeyed textfield while
the imperative handle still referred to the old widget. Comparing only the
handle to a captured handle missed that; comparing container.nodes' mounted
widget reproduces the failure (/tmp/gtk-leading-identity-before.log). The
editor now has a stable host key. This also resolves the misleading placeholder
color failure that read a detached old editor; no CSS-provider workaround is
needed.

Controlled edits now increment an edit revision read by the existing text
write effect. That reconciles the parent's current value even if it rejects
the same invalid text repeatedly without changing props. A single GtkEditable
insertion reproduces the old failure (/tmp/gtk-controlled-insert-before.log).
GTK4.14.5 [set_text](https://github.com/GNOME/gtk/blob/4.14.5/gtk/gtkeditable.c#L567-L579)
composes deletion and insertion; the initial bulk-replacement probe could give
the parent an accepted transition before the invalid insertion. Single insertion
and actual typing provide the rejection evidence.
The corrected probe and actual X11 reject/accept flows pass after reconciliation.
Native object-driver tests now mutate the actual field text before dispatch
instead of assuming a synthetic event had mutated it.

NativeScript core 9.1.3 maps number to iOS NumbersAndPunctuation and Android
signed/decimal numeric flags; decimal uses DecimalPad on iOS and equivalent
numeric flags on Android. GTK NUMBER is therefore retained for both, rather
than inferring DIGITS from web inputMode=numeric. GTK's purpose is a hint,
not text validation. The pinned [iOS source](https://github.com/NativeScript/NativeScript/blob/9.1.3/packages/core/ui/editable-text-base/index.ios.ts#L48-L54) and
[Android source](https://github.com/NativeScript/NativeScript/blob/9.1.3/packages/core/ui/editable-text-base/index.android.ts#L219-L226) were inspected through opensrc; no iOS/Android device input-method proof is added.

GTK4.14.5 Entry/Text GIR and GTK4.24.1 API expose no per-field action-caption
selector. returnKeyType now has a specific once-per-runtime diagnostic instead
of repeated ignored-prop warnings. All five hints preserve one Return callback
and current focus in the maintained fixture; next is not mapped to navigation.
The exact caption boundary remains documented under GTK Entry return-key captions.
Remaining common-renderer/visual/input-method qualification and all other
unqualified UI families remain part of the full goal.

Final GTK TextInput evidence: all 39 Linux renderer tests pass without skips
(guest /tmp/gtk-textinput-root-tests-final.log), including the 89-check entry
fixture, 59 field-chrome checks, 58 native accessibility comparisons and the
existing pointer/keyboard/scroll/portal/tooltip checks. The final focused entry
fixture adds actual X11 typing into a programmatically selected middle range
and passes 92 checks (/tmp/gtk-textinput-root-middle.log): controlled text and
caret remain correct and one native edit reports onChange once. Selection
creation in this case is programmatic; no OS selection-gesture claim is added.
Runtime: Ubuntu24.04 amd64, GJS1.80.2, GTK4.14.5, XplatMason and private Xvfb.

Expanded UI/renderer/dependent typecheck passes 58 tasks
(andromeda /tmp/gtk-textinput-root-types-final.log). All GTK runtime value
signatures and the seven new public type aliases match the native barrel.
Packed exports/declaration graph passes six tasks
(/tmp/gtk-textinput-root-pack.log). Focused native checks pass 58 Node tests
and 31 Vitest cases (/tmp/gtk-controlled-native-focused-second.log). The broad
native suite passes 454 and fails the same recorded batch-observer exception
expectation (/tmp/gtk-textinput-root-native.log); that suite is not reported
as passing. Recipes, all 17 release notes, UI barrel sync, formatting and
whitespace pass. No new UI dependency, IME/OSK/AT-client/Wayland/mobile-device/
pixel or packaged-consumer qualification is added.

Affected recipe coverage: text-entry AC1 has the scoped GTK editing evidence
above; the remaining text-entry criteria retain composition/multiline, public
Field/InputGroup/NumberInput, keyboard/overlay and modal gaps. component-refs
has object-handle and mounted identity evidence; its complete ref-form/cleanup/
composition criteria remain unqualified on GTK. linux-gtk-package keeps its
artifact boundary and has no new packaged-consumer execution. Full criteria
and target lists are retained; GTK assessments belong in gtk_recipe_checks.

## Multiline editor foundation

The renderer registers textview as a real Gtk.TextView backed by Gtk.TextBuffer.
The maintained ui-text-view fixture proves native text/editability/focus,
Unicode active-edge selection and clamping, programmatic echo suppression,
buffer change events, defaults on prop removal, read-only accessibility metadata,
and cleanup. Its X11 keyboard phase distinguishes actual selection replacement,
newline/submit modes and Tab focus from direct buffer insertion. Detailed
ownership and API boundaries are in the [renderer note](linux-gtk-renderer.md#multiline-buffer-foundation).

This advances TextArea's renderer requirement without adding a GTK UI fork or
claiming full TextArea parity. The root surface remains 38 values/64 types.
Placeholder, rows/maxRows/autoGrow, overflow, maxLength, automatic Field wrapper
ownership and full shared API qualification remain the next input work.

Qualification for this slice: the focused Linux fixture passes 59 assertions
on GJS 1.80.2/GTK 4.14.5, including actual X11 keyboard input. The renderer and
its dependents pass all eight Turbo typecheck tasks. Recipe links, release-note
validation and formatting/whitespace checks pass. All 40 maintained renderer tests pass
with no skips (/tmp/gtk-textview-full.log in the guest). These are real Linux guest
checks on andromeda, not Homebrew stand-in evidence. No screenshots were
captured or inspected.

## TextArea row fitting

Shared TextArea now selects a small platform fitting helper. GTK uses native
Pango font metrics and bounded frame refitting after CSS changes; NativeScript
retains iOS/Android line metrics and an owned loaded listener. Obsolete limits
clear when caps, growth, explicit height or authored bounds change.
The renderer's lazy fontChanged ref notification also catches ancestor CSS
font changes; min/max row changes do not create a notification loop.

The maintained ui-text-area fixture records native geometry and cleanup,
separately from OS input. See [sizing evidence and remaining contracts](linux-gtk-renderer.md#textarea-row-sizing-on-gtk).
TextArea stays unexported; root availability remains 38 values/64 types.

Verification for this slice: all 41 maintained renderer tests pass on the
andromeda Linux guest with no skips; the sizing fixture has 24 native-geometry
assertions. All 58 affected/dependent Turbo typecheck tasks, the 58 Node native
regressions plus six selected Vitest cases, and six UI package-integrity tasks
pass. Recipe, barrel, release-note, formatting and whitespace checks pass.
The full broad native Vitest suite was not rerun; its previously recorded
batch-observer failure remains separate. No phone, OS scrolling, IME, AT-client,
Wayland, HiDPI or image evidence is claimed by the sizing fixture.
Logs: /tmp/gtk-textarea-rows-full.log in the guest, and
/tmp/gtk-textarea-rows-types-final.log, /tmp/gtk-textarea-rows-native-final.log
and /tmp/gtk-textarea-rows-pack-final.log on andromeda.

## Multiline scrolling host

The textview intrinsic now mounts and measures a private native scrolling
host while preserving its public Gtk.TextView reference. This advances actual
wheel/keyboard scrolling beyond the earlier adjustment-range proof. Read-only
and disabled input ownership and nested app scrolling have dedicated X11 cases.
Physical host placement, styling and lifecycle have native container cases;
see the [renderer record](linux-gtk-renderer.md#native-multiline-scrolling-and-physical-hosts).
TextArea remains outside the curated root pending its remaining field/input
contracts; root availability stays 38 values/64 types.

Verification for the scrolling-host slice: all 41 Linux renderer tests pass
with no skips; ui-text-area has 106 assertions and ui-text-view retains 59.
Ctrl+End/Home and wheel phases use actual X11 input; the native host matrix,
role changes and buffer insertions are programmatic checks, not OS-input proof.
All eight renderer/dependent Turbo typecheck tasks pass. Recipes, barrel shape,
release-note validation, formatting and whitespace checks pass. No UI source
or public GTK barrel export changes; no new dependency, native facade rebuild,
phone, touchpad, Wayland, HiDPI, AT-client or image claim.
Logs: guest /tmp/gtk-textarea-scroll-full.log and andromeda
/tmp/gtk-textarea-scroll-types-final.log. Earlier failure logs remain historical
evidence, including the stale viewport diagnosis.

### TextArea placeholder foundation

The renderer now supplies native hint overlays for textview without changing
the editor ref or preferred size. The direct-source TextArea fixture covers
visibility, color, native placeholder metadata, padded origin and X11 click
through. This remains a renderer foundation: maximum length, text alignment,
custom line spacing and stable field/controlled ownership still gate the
TextArea GTK root export. See the
[placeholder evidence](linux-gtk-renderer.md#multiline-placeholder-overlays);
Silo retains per-export qualification state.

### Explicit multiline sizing in native hosts

Long content exposed a gap in the private scrolling host's size policy:
GTK size requests are minima, so propagated natural content height could
override an explicit height in Box. The adapter now disables natural-size
propagation on explicit numeric axes and restores it when dimensions clear.
The long-content and dimension-transition cases stay in the maintained host
matrix. See the [native sizing evidence](linux-gtk-renderer.md#explicit-multiline-dimensions-in-native-hosts).
This adds no GTK root exports.

### Controlled multiline editing

GTK TextBuffer actions now report one completed change for selected-range
replacement. Direct-source TextArea runtime checks exercise repeated parent
rejection and acceptance with the native caret retained. TextArea and
SearchInput native leaves reconcile even when the controlled value stays
unchanged; the latter currently has object-driver evidence only. See the
[edit transaction evidence](linux-gtk-renderer.md#controlled-multiline-edit-transactions).
Neither component is promoted to the GTK root by this fix.

### Multiline length limits

GTK textview now caps insertion in UTF-16 units, preserving emoji pairs,
native caret and native undo for bounded clipboard replacement. The shared
native TextArea leaf forwards maxLength and explicitly removes old limits.
NativeScript's paste and programmatic-value behavior differs on iOS/Android;
the [length-limit evidence](linux-gtk-renderer.md#multiline-length-limits)
records the exact release source and the source-cache mismatch.
No GTK root exports are added; stable automatic field/width/handle ownership,
text alignment, custom line spacing and complete shared props remain.


### Stable TextArea field ownership and label focus

The automatic field now stays mounted while chrome changes, preserving the
native editor and uncontrolled state. Nested fields inherit defaults without
duplicate chrome, widths or hints. Native labels request focus through a
scoped logical id lookup; automatic TextInput/TextArea fields preserve explicit
control ids separately from automation names.

Linux runtime checks pass TextArea195/field chrome61 and all42 renderer tests.
All58 affected/dependent typecheck tasks, six packaging tasks and selected
native58 Node/7 Vitest tests pass. TextArea remains unexported pending text
alignment, custom line spacing and remaining shared props; curated root
availability stays38 values/64 types. See the
[renderer evidence](linux-gtk-renderer.md#stable-multiline-fields-and-native-label-activation).


### Multiline alignment and pixel row spacing

GTK textview now applies text alignment to its native editor and private hint.
TextArea fitting uses resolved numeric/pixel lineHeight instead of a font-only
metric when spacing is authored, including ancestor CSS and removal. The
baseline48px native line/32px font metric mismatch is preserved in the
[renderer evidence](linux-gtk-renderer.md#multiline-alignment-and-resolved-pixel-rows).
Relative line-height row fitting and full bidirectional text remain unqualified.
No TextArea root export is added by this slice.


Final verification passes all42 real-Linux renderer tests without skips,
including TextArea232;58 affected/dependent typechecks and six package
validation tasks pass. Root availability remains38 values/64 types.


### Public-root TextArea qualification

The curated root adds TextArea and TextAreaProps, bringing availability to39
values/65 types. The shared native leaf retains a keyed editor while leading
registered icons or renderable nodes change. The public-root Linux fixture
passes260 checks, including native callbacks, keyboard-purpose/reset and
actual done/send/ordinary Return behavior. Secure multiline input is explicitly
unsupported: the shared iOS/Android/GTK component rejects it before rendering
and GTK preflights low-level batches before mutation. See
[the component and upstream evidence](linux-gtk-renderer.md#public-gtk-textarea).

Composition, OSK/AT, complete bidirectional text, relative line-height row
fitting, Wayland, touchpad, HiDPI, pixels and packaged-consumer qualification
remain open. Other input families, standalone Field/InputGroup, overlays,
navigation, theme and service exports remain part of the full goal.


Final public-root qualification passes all42 maintained Linux renderer tests
with no skips, including TextArea260. All58 affected/dependent typecheck tasks,
58 Node checks plus8 selected native Vitest tests, six UI package validation
tasks, recipes, barrel checks, 24 release notes, formatting and whitespace
pass. The declaration export uses the same TextAreaProps as the native barrel.
Final logs: guest /tmp/gtk-textarea-root-full.log; andromeda
/tmp/gtk-textarea-root-types.log, /tmp/gtk-textarea-root-pack.log and
/tmp/gtk-textarea-props-native-final.log. The full GTK UI parity goal remains
active; this is one qualified component addition.


### Public-root SearchInput qualification

The curated root adds SearchInput and SearchInputProps, bringing availability
to40 values/66 types. The native leaf reuses stable Field ownership and its
shared resolver, targets identity/accessibility/escape props at the keyed
editor and uses an accessible Pressable clear action. The public-root Linux
fixture passes76 checks with real keyboard/click input and native metadata,
including nested defaults and exact row-growth geometry. The existing native
PowerSearch caller keeps its grow class on an explicit field owner; full GTK
PowerSearch remains unqualified.

Selected native tests pass58 Node checks and13 Vitest tests; all58 affected/
dependent typecheck tasks pass. See
[the renderer evidence](linux-gtk-renderer.md#public-gtk-searchinput) for the
baseline ID/name gap, corrected native cursor measurement and retained limits.
The full UI parity goal remains active across the remaining inputs, standalone
Field/InputGroup, overlays, Image, navigation, theme and services.


Final SearchInput qualification passes all 43 maintained Linux renderer tests
with no skips, including the public-root 76 checks. All 58 affected/dependent
typecheck tasks, 58 Node checks plus 13 selected native Vitest tests, six UI
package validation tasks, recipes, barrel checks, 26 release notes, formatting
and whitespace pass. The TypeScript checker resolves SearchInput and
SearchInputProps from generated GTK/native barrels to the exact same
declarations; the GTK root has 106 total exports (40 values/66 types).
Logs: guest /tmp/gtk-search-full.log; andromeda /tmp/gtk-search-types.log,
/tmp/gtk-search-pack.log, /tmp/gtk-search-declarations.log and
/tmp/gtk-search-native-final.log. No phone, AT-client, IME or pixel
qualification, and no full PowerSearch GTK claim.


### Public GTK field ownership and related groups

Field, FormLayout, InputGroup/InputGroupText, FieldGroup and useFieldControl
are curated through the shared native leaves. Form direction, joined-group
width/state and changing group labels preserve existing editors. See the
[form](linux-gtk-renderer.md#gtk-field-and-form-layout-qualification),
[joined-group](linux-gtk-renderer.md#gtk-joined-input-groups) and
[related-group evidence](linux-gtk-renderer.md#public-gtk-related-field-groups-and-custom-control-defaults)
for the individual baseline failures, fixes and qualified scope.

The final related-group run passes all 46 maintained Linux renderer tests with
no skips, including 34 new group/context checks. All 75 affected/dependent
typecheck tasks pass; the fixture configuration now includes every maintained
UI .gtk.tsrx case instead of an incomplete manual list. All three new aliases
resolve to the same generated GTK/native declarations. Availability is now
46 values and 75 types. Other inputs and field parts, Image, overlays,
navigation, theme and services remain under the full parity goal.


### Public GTK selection indicators

CheckboxIndicator, RadioIndicator, CheckIndicator, defaultIndicators,
getIndicator, registerIndicator, registerIndicators, indicatorScope and
useIndicator reuse the existing native implementations. Eleven indicator types
retain the same declarations as the native barrel. Availability is now
55 values and 86 types.

The maintained direct-source and public-root Linux cases each pass 38
geometry/state/registry/lifecycle assertions without skips. All 58 affected
typecheck tasks pass. See [the indicator evidence](linux-gtk-renderer.md#gtk-decorative-selection-indicators)
for the exact checks and limits. The previous full renderer run passed 46 tests;
the added case has a focused runtime pass. Owning CheckboxInput/Switch controls,
other inputs, Image, overlays, navigation, theme and services remain pending.


### Custom toggle keyboard foundation

GTK's custom Mason checkbox/switch roles now accept focus and Space activation.
Native Checkbox's mixed checked metadata reaches GTK without claiming false;
the narrower NativeScript enum retains its existing textual fallback. The new
fixture passes 34 checks with actual X11 Tab/Space/Return. The full maintained
renderer run passes all 48 cases with no skips; 58 affected/dependent typecheck
tasks, 58 Node checks, 38 selected native Vitest tests and six package validation
tasks pass. See [the exact scope](linux-gtk-renderer.md#gtk-custom-toggle-keyboard-foundation)
for the test-helper correction and upstream state limitation.

This establishes the renderer input foundation. CheckboxInput/Switch remain
outside the curated root until their field and async-action contracts are
qualified. Root availability remains 55 values and 86 types; the full parity
goal and later PR remain in progress.


### Public GTK checkbox and switch fields

CheckboxInput, Switch and their three native prop types are now curated.
Availability is57 values/89 types. A private shared native field frame owns
width/status/defaults without replacing the control when chrome changes;
Switch label, track and keyboard input share one action owner. Mixed state,
async success/rejection, synchronous action throws, required/optional defaults,
read-only/disabled/busy metadata, native sensitivity, label layout and cleanup
have maintained runtime checks.

The public-root Linux run passes50 tests with no skips. The corrected field
case passes86 actual X11 pointer/geometry/state/lifecycle assertions, alongside
the keyboard foundation's34 actual Tab/Space/Return checks. All62 affected/
dependent typecheck tasks,58 Node tests,464 native object-driver tests,6 package
validation tasks and docs build/test28 tasks pass. The declaration fixture
compares all GTK runtime values and the three new types to the native surface.
See [the toggle evidence](linux-gtk-renderer.md#public-gtk-checkbox-and-switch-fields)
for baseline failures, source changes, logs and limits. Text-entry's GTK recipe
gains AC3 evidence while retaining partial coverage and an unexecuted complete
criterion. Other inputs/parts, Image, overlays, navigation, theme and services
remain in the full parity goal. No PR has been opened for this partial surface.


### Public GTK radio fields

RadioList/RadioListItem and four existing radio types are curated through the
shared native leaves. Availability is59 values/93 types. The private field
owner now supplies group width, label, status and defaults; each option carries
radio semantics and checked/name/help state. GTK provides one Tab entry per
group, logical arrow navigation and separate pointer focus, on Mason and the
Gtk.Box fallback.

The public-root Linux suite passes52 cases without skips, including107 Mason
and59 fallback radio checks with actual X11 keys/pointer input. All62 affected/
dependent typecheck tasks,58 Node checks,464 native object-driver tests and62
focused web tests pass. See [the radio evidence](linux-gtk-renderer.md#public-gtk-radio-fields)
for the baseline, fixes, contracts and explicit limits. Text-entry AC3 gains
radio evidence while retaining partial coverage and its unexecuted complete
criterion. Remaining inputs/parts, Image, overlays, navigation, theme and
services stay under the full parity goal; no partial-surface PR is opened.


### Public GTK numeric fields

NumberInput and both existing number prop types reuse the shared native leaf.
Availability is60 values/95 types. One persistent field frame owns the label,
status, defaults and width; optional actions retain the editor. Numeric drafts
preserve signed decimals/exponents while accepted, restore rejected controlled
owners, and show formatted values after blur.

The public-root case passes102 checks with real X11 keyboard/pointer input.
All53 Linux renderer tests pass without skips;62 affected/dependent typecheck
tasks,58 Node checks,464 native object-driver tests,50 selected web tests,
6 package validation and28 docs build/test tasks pass. See
[the numeric-field evidence](linux-gtk-renderer.md#public-gtk-numeric-fields)
for the baselines, fixes and exact limits. Text-entry AC8 now has complete
coverage and runtime proof; the other partial/missing criteria are preserved.
CheckboxList/Item and remaining inputs/parts, Image, overlays, navigation,
theme and services remain under the full parity goal. No partial-surface PR
has been opened.


### Public GTK checkbox lists

CheckboxList and CheckboxListItem, plus three existing prop types, reuse the
shared native group/part leaves. Options and children share one field owner
and checked-set provider; standalone mixed state remains controlled.
Availability is62 values/98 types. GTK now focuses custom checkbox/switch rows
on primary pointer press, independently of selection, while respecting native
focus-on-click opt-out and disabled sensitivity.

The group probe also found a nested Mason border omission. The renderer now
counts resolved GTK borders in nested sizing and separates border-box measure
results from GTK content-box allocation. Independent raw checks cover
asymmetric borders, removal, automatic sizing and fixed sizing/measurement.

The public-root case passes122 actual X11/native metadata/layout/lifecycle
checks. All54 Linux renderer tests pass without skips;62 affected/dependent
typecheck tasks,58 Node checks,464 native object-driver tests,48 selected web
tests,6 package validation and28 docs build/test tasks pass. See
[the checkbox-list evidence](linux-gtk-renderer.md#gtk-checkbox-list-investigation)
for baseline failures, fixes and limits. Text-entry AC3 remains partial; AC8
keeps its earlier complete/runtime-tested assessment. Remaining inputs/parts,
Image, overlays, navigation, theme and services stay under the full goal.
No partial-surface PR has been opened.


### Public GTK segmented controls

SegmentedControl and SegmentedControlItem, plus both existing prop types, reuse
the shared native leaves and GTK radio-group input path. Options and child
parts share one field/selection owner; an ownerless part stays presentational.
Availability is 64 values and 100 types.

The public case passes 120 checks with actual X11 input, including local and
controlled selection, grouped focus, disabled/read-only behavior, icon-only
names, hug/fill sizing, width/name/size/style resets, keyed updates, parent Field
authority and RTL. All 55 Linux renderer tests pass without skips; 62 affected
typecheck tasks, 58 Node checks, 464 native object-driver tests, 48 selected web
tests, six package tasks and 28 docs build/test tasks pass. See
[the segmented-control evidence](linux-gtk-renderer.md#gtk-segmented-control-qualification)
for the baseline and limits. Text-entry AC3 remains partial and AC8 remains
complete/runtime-tested. Remaining inputs/parts, Image, overlays, navigation,
theme and services stay under the full goal. No partial-surface PR is opened.


### Public GTK PIN input

PinInput and its existing prop type reuse the shared native TextInput path.
One persistent field owns the label, width and group state; editors keep
numbered names and ids under an authored group id. Availability is 65 values
and 101 types. The editing state machine is unchanged.

The public-root case passes 103 checks with actual X11 input, covering
contiguous entry/focus, controlled acceptance/repeated rejection, suffix
clearing, completion, secure entry, disabled/read-only behavior, length
transitions, metadata/layout resets and cleanup. The existing full sweep
passes 55 tests without skips; the newly registered PinInput test passes
separately, for 56 exercised maintained tests. All 62 affected typecheck tasks,
a subsequent 12-task focused type/native/package run, 62 selected web tests
and 28 docs build/test tasks pass. See
[the PIN evidence](linux-gtk-renderer.md#gtk-pin-input-qualification) for the
baseline, exact logs and qualification limits. Text-entry AC3 remains partial
and AC8 remains complete/runtime-tested. Remaining inputs/parts, Image,
overlays, navigation, theme and services stay under the full goal.


### Public GTK sliders

Slider and its existing prop/mark types use the shared native field and
scalar/range owner. The renderer supplies adjustable focus/ref events and
typed numeric metadata. A private helper separates NativeScript value text
from GTK bounds/current/text metadata; no dependency was added.
Availability is 66 values and 103 types.

The 57-case Linux sweep passes without skips, including public-root Slider.
A subsequent public case passes 141 actual X11/native metadata/geometry/
lifecycle checks, including range keys and lazy tooltip disposal/reuse.
All 62 affected typecheck tasks, a subsequent 12-task focused type/native/
package run, 77 selected web tests and 28 docs build/test tasks pass. See
[the slider evidence](linux-gtk-renderer.md#gtk-slider-qualification) for
baselines, typed-facade build, exact logs and limits.

Keyboard range input currently adjusts the upper endpoint, matching web;
lower-endpoint keyboard access is a shared UI gap. The internal GTK
use-tooltip leaf is not a public root export until its other options have
independent proof. Text-entry AC3 remains partial and AC8 remains
complete/runtime-tested. Remaining inputs/parts, Image, overlays, navigation,
theme, services and View contracts stay under the full goal.

### Public GTK ratings

InputRating and its existing prop type reuse the shared native field and
radio-group input. The native and web leaves keep exactly one checked score,
a filled prefix, local/controlled ownership, numbered names and text or
registered glyphs. Availability is 67 values and 104 types.

The 58-case registered Linux sweep passes without skips, including 108 actual
X11/native metadata/geometry/lifecycle rating checks. All 62 affected typecheck
tasks, a subsequent 12-task focused type/native/package run, 84 selected web
tests and 28 docs build/test tasks pass. See
[the rating evidence](linux-gtk-renderer.md#gtk-rating-qualification) for
baselines, the corrected RTL fixture assumption, exact logs and limits.

Text-entry AC3 remains partial/not-run for its full assistive-client criterion;
AC8 remains complete/runtime-tested. Selection controls depend on the still
unqualified Popover layer; their standalone SelectorOption part can be
qualified independently. Remaining inputs/parts, Image, overlays, navigation,
theme, services and View contracts stay under the full goal.

### Public GTK option presentation

SelectorOption and its existing prop type reuse the shared native presentation
leaf, with web's disabled modifier class and decorative icon exclusion.
Availability is 68 values and 105 types. This part owns no selection or action.

All 60 registered Linux tests pass without skips, including 51 public-root
part checks and 54 box-model checks. A subsequent 66-check accessibility run
passes with the final typed remap fixture. All 62 affected typecheck tasks,
a subsequent 12-task focused type/native/package run and 28 docs build/test
tasks pass. See [the renderer evidence](linux-gtk-renderer.md#gtk-selection-part-and-box-model-qualification)
for baseline failures, the margin/direction and first-map corrections, native
facade build, exact logs and qualification limits.

The search/token recipe now distinguishes WebKitGTK from GJS/GTK; its selection
workflows remain unavailable. Text-entry AC3 remains partial/not-run and AC8
remains complete/runtime-tested. View remains running for other style
contracts. Popover/finite-list selection, remaining inputs/parts, Image,
overlays, navigation, theme and services stay under the full goal.
