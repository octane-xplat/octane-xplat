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
| Construction, batches and roots | `nodes.ts`, `driver.ts`, `layout-batch.ts`, `roots.ts` |
| Attachment, projection and layout | `tree.ts`, `projection.ts`, `layout.ts` |
| CSS matching, state and environment | `css-cascade.ts`, `css-animations.ts`, `css-pseudo-state.ts`, `style-environment.ts` |
| Stateless style reads and normalization | `style-values.ts` |
| Native styling and painting | `native-style.ts`, `pointer-style.ts`, `native-colors.ts`, `outlines.ts`, `box-paint.ts`, `box-paint-state.ts`, `box-geometry.ts`, `background-paint.ts`, `border-paint.ts`, `shadow-paint.ts`, `transform-paint.ts` |
| Element creation, props and disposal | `container-elements.ts`, `controls.ts`, `picker-elements.ts`, `input-elements.ts`, `text-elements.ts`, `image-elements.ts`, `hosted-elements.ts` |
| Generic prop merging and removal | `element-props.ts` |
| Actions, subscriptions and accessibility | `actions.ts`, `subscriptions.ts`, `hover.ts`, `accessible-host.ts`, `accessibility.ts` |
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
out of them is preferable to adding another lazy dependency. Mutations such as
allocating an action ID reach the owner's live state; copying a counter into
a dependency object would lose that connection.

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

The element modules group creation, prop handlers and disposal, but generic
dispatch and cleanup ordering still live in `nodes.ts` and `element-props.ts`.
Preserve those phases when changing the dispatch model: text layout retires
before destruction hooks, nested content detaches before native hosts disappear,
and every cleanup path must tolerate partially constructed nodes.

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
still means that OS resource may remain unreleased. Live plugin nodes currently
re-query the registration for cleanup; the acquired-definition migration must
deliberately replace that behavior ([#118](https://github.com/octane-xplat/octane-xplat/issues/118)).
Root creation also admits a second root on the same host, and font records
survive unmount ([#119](https://github.com/octane-xplat/octane-xplat/issues/119)).
The direct root test characterizes that existing policy; it is not the desired
single-owner contract. Keep identity-safe old-root retirement and nested font
inheritance when enforcing the new policy.

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
