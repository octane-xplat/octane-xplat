# AppKit renderer internals

Use this map when changing `packages/macos-appkit`. The public entry is
[`src/index.ts`](../../packages/macos-appkit/src/index.ts); its declaration
contract remains in `src/index.d.ts`.

## Find the owner

Paths below are relative to `packages/macos-appkit/src/`.

| Responsibility | Modules |
| --- | --- |
| Composition and host adapters | `runtime.ts`, `runtime-activation.ts`, `host-bridge.ts` |
| Node contracts, element capabilities and identities | `model.ts`, `element-adapter.ts`, `registry.ts` |
| Node construction and phased release | `nodes.ts`, `failures.ts`; acquired adapters own feature releases |
| Host/CSS batch scope and commit stages | `layout-batch.ts`, `driver.ts`, `css-cascade.ts` |
| Root creation/retirement and read-only membership | `roots.ts` receives the `root-directory.ts` writer; other services receive its reader |
| Attachment, projection and layout | `tree.ts`, `projection.ts`, `layout.ts`, `layout-projection.ts` |
| CSS matching, state and environment | `css-cascade.ts`, `css-animations.ts`, `css-pseudo-state.ts`, `style-environment.ts` |
| Stateless style reads and normalization | `style-values.ts` |
| Native styling and painting | `native-style.ts`, `pointer-style.ts`, `native-colors.ts`, `outlines.ts`, `box-paint.ts`, `box-paint-state.ts`, `box-geometry.ts`, `background-paint.ts`, `border-paint.ts`, `shadow-paint.ts`, `transform-paint.ts` |
| Element creation, props and disposal | `adapter-assembly.ts`, `pilot-adapters.ts`, `control-adapters.ts`, `text-adapters.ts`, `picker-adapters.ts`, `container-adapters.ts`, `surface-adapters.ts`, `scroll-adapter.ts`; native owners remain in their element/engine modules |
| Generic prop merging and removal | `element-props.ts` |
| Actions, subscriptions and accessibility | `action-store.ts`, `actions.ts`, `subscriptions.ts`, `hover.ts`, `accessible-host.ts`, `accessibility-state.ts`, `accessibility.ts` |
| Native surfaces | `popover.ts`, `context-menu.ts`, `picker-bridge.ts`, `sheet-bridge.ts`; existing `presentation.ts` and `layer.ts` own their surface engines |
| Inspection and measurement | `automation.ts`, `measurements.ts`, `parity.ts` |

## Keep lifecycle and initialization explicit

Each feature owner retains and releases its own resources. Canonical adapters
connect element creation, native prop effects and phased disposal to those
owners. `nodes.ts` coordinates common construction and teardown;
`element-props.ts` merges the next prop bag, applies common fields and dispatches
through the acquired adapter. Synchronization that reads several props runs
after the whole bag has been merged. New element support belongs in adapter
definition/assembly and its feature owner, not a generic lifecycle switch.

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
directly. Required forward operations are named callbacks with an activation
check before accessing the later owner. No dependency getter exposes storage
or triggers construction. Input identity storage precedes actions; accessible
host identity precedes subscriptions; roots follow the completed driver.
The layout service does not depend on the ActionBar owner: the acquired
adapter already owns that layout dispatch. Action allocation is a private store
operation that returns a registration lease; consumers never copy a counter or
mutate backing maps.

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

`runtime-activation.ts` is the first runtime import so its guard exists even
during imported native class registration. Activation progresses from
`constructing` to `activating`, then `active` or `failed`. Construction registers
required native classes; adapter installation and required bridge setup finish
before environment and optional diagnostics
observation. Every root factory supplied to lists, tabs, popups, layers and
presentations uses the guarded public facade. Root creation and forward
operations reject before activation; failed activation retains its original
error. A failed module import must never be retried by reconstructing native
classes. Repeated imports reuse the loaded module; this is process activation,
not independent renderer instantiation. Optional hover/menu installation keeps
its explicit unavailable behavior; diagnostics activation failure is reported
without preventing rendering. Required native registration/bridge failures
reject the import.

The remaining operational cycle coordinates these operations; it grants no
new authority to the caller:

| Operation family | Authority, readiness, reentry and retirement |
| --- | --- |
| Input/control/text updates → CSS/native style/font/AX | Feature owners acquire their view/action leases; callbacks run only after activation. Text-value/layout and action guards suppress recursive writes and retired dispatch. Node phases retire text observation before hooks, then detach and release feature state. |
| Actions → text hit tests and pseudo state → subscriptions/accessible hosts | Actions own dispatch, not input storage. Native host file-drop methods call the subscription owner's named operations only after activation; registry identity, sender, active-slot and lifecycle checks reject replaced or retired owners. Subscription hooks release their leases during node teardown. |
| Layout → projection → tree; tree → segmented selection | Layout requests projection through a named operation; projection can request tree detach, and tree synchronizes logical picker children. Per-root batches own dirty work, projection leases own physical placement, and acquired adapters own selection synchronization. Disposal marks the node first, releases placement before feature cleanup, and still permits required live-parent synchronization. |
| CSS → animation → native style → CSS | Cascade owns computed styles; animation owns overlays and its self-quiescing timer; native style owns writes. Per-root batches and style equality prevent redundant work, while animation retirement cancels held work. This is not a general rollback or scheduling guarantee. |

Process-scoped supporting state is intentional:

| Modules | Process state and narrower resource lifetime |
| --- | --- |
| `gestures.ts`, `tab-view.ts`, `list-view.ts`, `webview.ts`, `video.ts` | Native delegate/class identity is registered once. Weak identity tables refer to acquired feature owners; node/adapter retirement invalidates handlers, observers, requests, timers and nested roots. List/pager portal counters remain monotonic across roots. |
| `mason.ts`, `ns-compat.ts` | One installed adapter set and native Mason host/class. Compatibility queues pre-import registrations and retains class property metadata. Mason's style cache is node-keyed; its native-layout reentry set covers only the active call. Root retirement must not reset the process bridge or registration catalog. Mason's unavailable-engine warning/absence contract remains unchanged. |
| `fonts.ts`, `image.ts`, `image-requests.ts`, `image-byte-cache.ts` | Registered font families, shared request deduplication and memory/URL caches outlive roots. Image requests and event handlers still retire by view/request identity; cache persistence is not permission for stale completion delivery. |
| `pager.ts`, `image-geometry.ts`, `image-drawing.ts`, `text-value.ts`, `text-limit.ts`, `heading-accessibility.ts`, `projection-paint.ts`, `layer.ts` | Module WeakMaps hold view/node leases rather than independent roots. Feature disposal clears subscriptions/writers, restores owned native state and invalidates async work; pager timers/page roots retire with the pager. Warning flags remain process-lived. |
| `layout-observers.ts`, `style-environment.ts`, `appearance.ts`, `css-pseudo-state.ts` | Layout listeners have explicit unsubscribe; environment/modality observers and the runtime's appearance subscription intentionally last for the loaded process. Directory readers limit work to live roots. No per-root recreation or public whole-runtime disposal is promised. |
| `list-template.ts`, vendored list expression helpers | Parsed template/expression caches contain reusable descriptions, not native view/root ownership. They intentionally survive root retirement. |

Paint writers remain leaves below the coordinator, directory readers expose no
registration/retirement authority, and action handler maps/counters remain
private to the action store. Do not merge these owners to reduce graph counts.

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

Only one live root may own a host. A second mount rejects; retained-root HMR
reuses that root instead of mounting again. Unmount before reusing or disposing
the host. Unmount retires membership even when a later cleanup fails; it does
not uninstall process bridges, native classes, fonts or caches.

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
`pilot-adapters.ts`, `control-adapters.ts`, `text-adapters.ts`,
`picker-adapters.ts`, `container-adapters.ts`, `surface-adapters.ts` and
`scroll-adapter.ts`; importing an adapter leaf
registers nothing. A node captures its validated definition before creation and
retains it for props, layout and disposal. Replacement registrations affect
future acquisitions; mutating a registration object cannot redirect a live
node's cleanup. Normal author registration of a migrated type composes its
override against the original builtin definition, rather than stacking prior
overrides. Missing definitions reject before native acquisition.

Every supported builtin, viewless record and registered engine uses this
catalog. `entries()` supplies an inventory snapshot; capability readers use the
acquired definition for live nodes and the catalog for prospective types.
Mason installs `masonview` and composes the `scrollview`/`liquidglass` definitions
after the accessible native base class exists. Compatibility registration uses
the same create/prop/layout/retirement phases, including queued registrations.
There is no parallel behavior map, builtin factory switch or blanket feature
disposer list in nodes. Compiler-owned portal/root records retain their separate
creation and ownership path; the broad public `ElementNode` contract remains.

The adapter validates before native creation. `beforeProps` preserves feature
admission that must precede merging the prop bag, such as ActionBar title-view
ownership checks. Common fields merge next, feature prop effects follow, and
`afterProps` reads the complete merged bag. `didAttach` handles attachment-bound
work such as Placeholder's one-time native-content event. These are generic
phases, not type-specific coordinator hooks. Attached child props, style
validation, native-view availability, containment, and logical public instances
are definition metadata. Raw `#text` still has no public instance; the existing
logical tab/segment/span/formatted/proxy records retain their node handles.

Disposal calls acquired `retire` before destruction hooks, `prepareDispose`
while the host exists, generic detach, then `dispose`. Text definitions retire
sizing before hooks and own input/link cleanup. Container preparation retires
geometry/identity before independent observer and child releases. Late geometry
tokens acquired during reentrant retirement are released; held callbacks reject
retired or replaced owners. RootLayout and ActionBar own their child layout;
viewless proxies forward style/class updates before projection layout.

`surface-adapters.ts` owns hosted-element definitions and prop dispatch; the
former forwarding-only hosted service is removed. Lists/tabs/pager/web/video
and image engines retain their separate resource state. Image, list and pager
factories publish an acquired host before fallible resource setup. Pager retires
state before independent timer/observer/page releases and releases late observer
tokens. Page hosts must join the document before activating clip-relative
constraints; AppKit aborts when their anchors have no common ancestor
([#141](https://github.com/octane-xplat/octane-xplat/issues/141)). Scroll observer,
geometry and axis constraints belong to its definition.
A manual container is also a child: style application must queue both its own
layout and its physical parent's layout, including styles forwarded by proxies.

Video binds observed player/item identities to its owner, spells the exposed
KVO selector exactly, and retires dispatch before independent native releases.
Its half-second periodic interval needs a scale that represents it as a positive
`CMTime`; scale 1 quantizes that interval to zero. WebView invokes the native
`NSURL.isFileURL()` predicate; testing the method object as a boolean routes
non-file URLs into WebKit's file-only loader. These defects are tracked by
[#137](https://github.com/octane-xplat/octane-xplat/issues/137),
[#138](https://github.com/octane-xplat/octane-xplat/issues/138) and
[#139](https://github.com/octane-xplat/octane-xplat/issues/139) until normal integration.

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
still means that OS resource may remain unreleased. Registration replacement cannot redirect an existing node's cleanup or containment; batch preflight uses the same acquired capabilities
([#118](https://github.com/octane-xplat/octane-xplat/issues/118)).
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
