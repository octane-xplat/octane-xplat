# AppKit renderer internals

Use this map when changing `packages/macos-appkit`. The public entry is
[`src/index.ts`](../../packages/macos-appkit/src/index.ts); its declaration
contract remains in `src/index.d.ts`.

## Find the owner

Paths below are relative to `packages/macos-appkit/src/`.

| Responsibility | Modules |
| --- | --- |
| Composition and host adapters | `runtime.ts`, `host-bridge.ts` |
| Node contracts, element capabilities and identities | `model.ts`, `registry.ts` |
| Construction, batches and roots | `nodes.ts`, `driver.ts`, `layout-batch.ts`, `roots.ts`, `root-directory.ts` |
| Attachment, projection and layout | `tree.ts`, `projection.ts`, `layout.ts`, `layout-projection.ts` |
| CSS matching, state and environment | `css-cascade.ts`, `css-animations.ts`, `css-pseudo-state.ts`, `style-environment.ts` |
| Stateless style reads and normalization | `style-values.ts` |
| Native styling and painting | `native-style.ts`, `pointer-style.ts`, `native-colors.ts`, `outlines.ts`, `box-paint.ts`, `box-paint-state.ts`, `box-geometry.ts`, `background-paint.ts`, `border-paint.ts`, `shadow-paint.ts`, `transform-paint.ts` |
| Element creation, props and disposal | `container-elements.ts`, `controls.ts`, `picker-elements.ts`, `input-elements.ts`, `text-elements.ts`, `image-elements.ts`, `hosted-elements.ts` |
| Generic prop merging and removal | `element-props.ts` |
| Actions, subscriptions and accessibility | `action-store.ts`, `actions.ts`, `subscriptions.ts`, `hover.ts`, `accessible-host.ts`, `accessibility-state.ts`, `accessibility.ts` |
| Native surfaces | `popover.ts`, `context-menu.ts`, `picker-bridge.ts`, `sheet-bridge.ts`; existing `presentation.ts` and `layer.ts` own their surface engines |
| Inspection and measurement | `automation.ts`, `measurements.ts`, `parity.ts` |

## Keep lifecycle and initialization explicit

Each subsystem factory owns its retained maps, observers, native classes and
cleanup. Put a builtin element's factory, native prop handler and disposal in
its element module. `nodes.ts` coordinates construction and teardown order;
`element-props.ts` merges the next prop bag, applies common fields and dispatches
individual native props. Keep synchronization that reads several props after
the whole bag has been merged.

The registry owns element support and containment queries as well as identity
maps. It has no service dependencies and is constructed first. Node creation,
batch validation and projection consult that same registry, including live
plugin registrations; metadata queries must not depend on node construction.

Import stateless style queries from `style-values.ts` directly. Reading computed
styles, class membership or collapsed state must not require the native style
writer, the CSS cascade or the diagnostics service. Stateful services retain
their own maps, timers and native resources.

Cross-subsystem contracts import named result types and use `Pick` to name the
required operations or state. `runtime.ts` passes already-constructed services
directly and uses getters for forward references. Read a forward dependency at
operation time, not during construction. These remaining cycles coordinate
style application, tree mutation and element lifecycle; moving a pure query
out of them is preferable to adding another lazy dependency. Action allocation is a private store operation that returns a registration
lease; consumers never copy a counter or mutate backing maps.

Construct all services before installing compatibility, Mason, tab content and
host bridges. Native classes must be registered before Mason subclasses the
accessible host. Preserve per-process services and per-root state when moving
code; a module split must not create a second renderer registry or timer.

Native class registration is itself a constructor effect. A native service
registers its own target: `context-menu.ts` owns the menu action target, and
`hover.ts` owns tracking targets. A getter does not defer a dependency read made
inside the factory; never initialize another service by writing through one.
Check native class availability through the required methods, such as `alloc`,
instead of `typeof === 'function'`: the macOS NAPI host exposes `NSMenu` and
`NSMenuItem` as object handles.

`withLayoutBatch` is the owner of temporary `RootContainer.layoutDirty` state.
Host commands and standalone CSS restyles enter that same scope; nested work
joins its owner. It resets ownership in `finally` before running the caller's
commit, so a failed native style write cannot leave subsequent work waiting on
a batch that will never finish. The finalizer receives an explicit update
outcome. CSS still flushes inside the open batch after command failure; both
errors remain identifiable. Tabs and layout require a complete command/CSS pass;
a tab failure stops layout, and a layout failure stops success notification.
No incomplete commit emits a layout observation. This is batching, not rollback:
successful native writes before a failure remain applied; no automatic retry
of an incomplete native write is promised.

The composition is one process runtime with many roots, not a factory for
independent renderers. Native class registration, Mason and compatibility
adapters, font registrations and image caches also have module/process scope.
Per-root `nodes`, portal registrations and pending work live on `RootContainer`.
Do not infer whole-renderer isolation from tests that construct one service
twice with stand-ins.

`root-directory.ts` owns live container and host/font membership. Its reader
returns snapshots, membership/font queries and scoped observation; it exposes
no registration or retirement operation. Only root lifecycle receives the writer.
CSS, focus, environment, diagnostics and measurements never depend on root
creation. Lists receive create/release operations; tab/popup/layer factories
receive creation and the font reader they need. Keep these operational callbacks
separate from membership readers.

`roots.ts` creates the universal root, registers before the first render, and
retires its exact membership lease before unmounting. Setup failure unwinds
membership and acquired observations; retirement attempts unmount even if debug
cleanup fails. It clears the container's root reference on failure too. Old
retirement cannot remove a reused host's new membership. A root retired during
setup cannot escape as a live result. These are cleanup guarantees, not rollback
of native writes or recovery from an unreleasable OS resource.

Environment observers install once during runtime activation, after services
exist. Environment media seeding and optional automation subscribe to directory
membership, including already-live roots. Each debug seam has an identity-scoped
release; retiring the newest selects the most recently registered remaining live
root, while root-specific debug objects keep their own measurement selection.
Layout-commit observation still visits all already-live hosts immediately and
unsubscribes if that initial visit fails. Projection compensation has its own
thin facade over the registry/box owner and does not depend on root lifecycle.

`element-adapter.ts` defines the private phased protocol and catalog. Runtime
composition uses `adapter-assembly.ts` to assemble definitions from
`pilot-adapters.ts` and `control-adapters.ts`; importing a leaf
registers nothing. A node captures its validated definition before creation and
retains it for props, layout and disposal. Replacement registrations affect
future acquisitions; mutating a registration object cannot redirect a live
node's cleanup. Normal author registration of a migrated type composes its
override against the original builtin definition, rather than stacking prior
overrides. Missing migrated definitions reject before native acquisition.

The unpublished migration explicitly lists remaining builtin types in
`unconvertedElementTypes`; registered Mason/compatibility behaviors remain in
`registry.ts` until their cohort migrates. `button`, `contentview`, `switch`, `slider`, `progress` and
`activityindicator` have no
legacy create/prop/dispose fallback. Adding a canonical adapter requires its
definition, assembly and tests, without a generic lifecycle switch branch.
Common props merge first, feature props follow, then `afterProps` reads the
merged bag. Complete-next-bag removal still enters as explicit undefined clears.

Disposal calls the acquired `retire` before destruction hooks, then
`prepareDispose` while the native host exists, generic detach, and `dispose`.
Button owns its action release through the adapter. Contentview preparation
retires its private typed geometry lease, detaches children and removes host
identity before generic host detach. Late observation tokens acquired during
reentrant retirement are released; held callbacks reject retired/replaced leases.
Legacy text sizing and nested-root phases retain their prior order until P6.

Box painting has one coordinator in `box-paint.ts`. Its private WeakMap holds
one typed record per node/view, including frame observation, layers and image
leases. Nodes call one paint disposer after generic detach; they do not inspect
paint resources. The coordinator is constructed before roots and style services,
so those consumers receive a direct reference.

Border, shadow, transform, background and outline writers receive that typed
record. They share only stateless geometry/color helpers from `box-geometry.ts`;
no writer calls another writer's service. Native style handles the full prop bag
and passes the previous/next paint styles to the coordinator, including the
animation overlay. Geometry delivery orders border, shadow, transform,
background and outline updates. Projection compensation deliberately updates
only border and shadow, preserving an already-applied transform.

Outset shadow siblings use the backing layer's bounds, anchor, position and
transform. A transformed frame is not their local geometry. The coordinator
aligns siblings again after authored transform writes; Motion publishes
projection compensation after writing each projection/restoration transform.
This keeps inverse-corrected shadow values in the actual painting coordinate
space without changing the shadow-path or projection correction algorithms.

Frame acquisition suppresses synchronous setup callbacks until ready. Delivery
checks current node/view/record identity and retirement; reentrant delivery during
paint is inert. Frame delivery also coalesces a cancellable next-turn repaint:
AppKit can overwrite the backing-layer transform after its notification returns,
and bridge microtasks can drain before that native write finishes. Active
transforms retain the lease even when their lengths are points. A replacement
view retires the previous record before acquisition.
Outline geometry still reads bounds, expands by width plus offset, and responds
to frame notifications (including origin-only deliveries); it does not add a
bounds-notification contract. Its geometry callback shares the box frame lease.
Disposal retires the record before independent releases and restores the captured
layer slots even after a release error. An OS release that throws may remain
unreleased; disposal never retries it.

Background image entries own independent cancellation and active guards. Reusing
a URL entry retains its request; replacing its URL releases it. Late completion
checks entry activity and current paint ownership before writing. Percentage
translations may already be normalized by CSS or keyframes; preserve their
fraction/unit pair and their frame dependency rather than reparsing the object.

Nodes progress through constructing, live, disposing and disposed. Disposal
retires dispatch first and snapshots/removes destruction hooks before invoking
them. The node owner attempts every independent release in the characterized
order, including identity removal after native errors. Reentrant destruction
is inert. Tree detachment still synchronizes a live parent after native failure;
it must not use the child's disposal state to skip parent work.

`failures.ts` preserves a single thrown value, including undefined. Multiple
failures produce `PhaseErrors`, whose `errors` retain the original values and
`failures` pair each value with its phase. Construction remains the first error
when cleanup also fails. Retire each release field/lease before invoking it;
never retry an OS release merely because it threw. A native release failure
still means that OS resource may remain unreleased. Unconverted plugin nodes still
re-query their legacy registration for cleanup; P6 must migrate that remaining
behavior ([#118](https://github.com/octane-xplat/octane-xplat/issues/118)).
Root creation rejects a second live root on the same host; retained-root HMR
must reuse the existing root. Retirement is idempotent and removes font
membership with the host owner ([#119](https://github.com/octane-xplat/octane-xplat/issues/119)).
Nested roots retain their captured inherited family until their own retirement.

## Action and accessibility lifetimes

`action-store.ts` alone allocates numeric IDs, changes handler slots and binds
native views. Its leases replace handlers without changing a native `tag`.
Dispatch validates incoming native IDs. Release retires the slot first and
removes a view association only while that lease owns it; superseded view
leases cannot dispatch or erase a replacement. The store contains no control,
text, gesture or accessibility state.

`actions.ts` keeps the process-owned native delegate target and the node-action
feature's leases. Control/input factories acquire those leases before fallible
subsequent setup; menus and picker attachments retain their own leases and
release them from their attachment disposer. Common node teardown calls the
feature disposer, never a remote map deletion. Acquired menu leases enter the
attachment's release list before native tag writes; popup construction releases
a lease itself if the tag write fails before transfer to a node or attachment.
Pan payloads retain their own typed event path. Gesture release uses the acquired
view and current handler identity, so old cleanup cannot remove a newer pan binding. Native click,
link and pan dispatch also verifies the current recognizer sender; a held old
recognizer cannot dispatch through a reused view. Held submit and
adjustment callbacks check their current slot before entering the event scope.

`accessibility-state.ts` owns typed, immutable semantic snapshots by view;
`accessibility.ts` owns node/view leases. Accessible hosts and diagnostics only
query those snapshots and action availability. Semantic-only hosts need no
click allocation. Replacing or retiring a semantic lease invalidates its
adjustments without changing another view owner's metadata.

Folded text owns its click recognizer and AX custom-action dispatch in
`text-elements.ts`. Each node/view lifetime has distinct slots, including when
several labels have identical link names. A view owner retires the old node
binding before reuse; old cleanup cannot clear its successor. Refolding reuses that owner's native
objects; retirement clears JS dispatch before native cleanup. The existing
macos-node-api 0.4.4-next.2026-08-09-31292056208 bridge workaround still retains
native custom-action objects for the process: prior host evidence found that
finalizing JS handler blocks during a JSC sweep traps. Slots cannot be shared
across retired view lifetimes without redirecting held native callbacks.
This deliberately retains native objects while releasing their JS feature
closures; it is not whole-process leak freedom. Remove this workaround only
after an upstream bridge change passes a native finalization regression.

## Verify a change

The Node suite includes direct factory tests and older VM fixtures. The legacy
adapter in `test/renderer-source.ts` reads declarations from their production
modules; it carries no copied implementation. New tests should exercise the
factory interface with explicit adapters, as `test/root-ownership.test.ts` does.
VM fixtures establish branch behavior, not native input or drawing.
They flatten service references and cannot verify initialization order. Keep
constructor composition coverage alongside them; the native-service test runs
the production hover/menu constructors with only the native platform replaced.

```sh
bun run turbo run test --filter=@octane-xplat/macos-appkit
bun run turbo run typecheck --filter=...@octane-xplat/macos-appkit
bun run turbo run test:packed --filter=@octane-xplat/macos-appkit
```

The packed consumer covers real AppKit lifecycle and retained-root HMR. Follow
[AppKit verification](appkit-verification.md) for its limits and host setup;
reserve build resources before running it. Internal file moves preserve the
package exports and do not introduce a public recipe or API.
Its native menu check also verifies registration, attachment and programmatic
Objective-C selector dispatch; physical right-click/responder behavior remains
a separate qualification.
Raw date/time picker lifecycle checks do not qualify `picker-bridge.ts`'s
separate native attachment path. The packed bridge fixture checks date, time
and combined components, initial selection/bounds, complete bound removal,
programmatic updates without echoes, selector dispatch, disabled dispatch and
retirement (constraints, target, selector and held-target dispatch). Both
`NSDate` and `NSDatePicker` are object handles on this host; check the date
factory method and `alloc` capability respectively. This evidence does not
establish physical picker input, visual appearance or accessibility behavior.
Track the bridge defect through [#117](https://github.com/octane-xplat/octane-xplat/issues/117)
until normal integration.
