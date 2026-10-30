# Animation implementation constraints

The [motion guide](../../../docs/app/animation-gestures.md) owns usage and support
limits; the [service reference](../../skills/octane-xplat/references/services.md)
owns agent implementation choices. This note records driver ownership and
upstream seams. Historical validation lives in Silo/local artifacts.

## Frame and gesture ownership

NativeScript JavaScript executes on the UI thread. Drive per-frame presentation
through imperative handles; declarative application state describes destinations
and durable state, rather than publishing a render update for every frame.
`ui` cannot depend on `motion`, because `motion` depends on `ui`.

Normalize pan coordinates and velocity to DIP and use began/moved/ended/cancelled
states. Native gesture observers and Observable notifications are different
mechanisms. On web, pointer-move handlers need owned raw listeners and cleanup;
they are not supplied by the ordinary delegated event path.

## AppKit imperative animation

AppKit owns alpha through NSView and transforms through Core Animation. Explicit
sampled writes disable implicit layer actions. Controllers belong to their bound
ref and must detach/dispose without retaining a view or overwriting a newer owner.
The main-runloop 16 ms timer is not screen-synchronized and makes no frame-pacing
promise. Linear and damped-spring imperative controllers have their own units and
rest conditions; they are not the Motion engine.

## Decision #130 — layout projection (web, iOS, Android, macOS)

`layout` (`true | 'position' | 'size' | 'preserve-aspect' | 'x' | 'y'`),
`layoutDependency`, `onLayoutAnimationStart`/`onLayoutAnimationComplete`, and
`transition={{ layout: {...} }}` are supported on `motion.View`, `motion.Row`,
`motion.Pressable` and `motion.create` hosts, including experimental macOS. `layoutId`/`LayoutGroup` shared handoffs
and retained crossfades are also supported. `layoutScroll` is excluded. Numeric corner radii and shadows receive paint scale correction. Browser overflow scroll offsets
are detected automatically. The default layout transition is a 0.45 s tween.

Mechanism: a node modeled on motion-dom's `create-projection-node.ts` over its
geometry helpers measures an untransformed window-space box per node, computes
the delta against the presented snapshot, and writes inverse transforms until
the animation catches up; `project(null)` restores merged channel values.
Nested `layout` children get counter-scale correction. Shared crossfades temporarily
own opacity; layout hosts always run the JS engine (no platform animator
delegation). Reduced motion snaps. Unlike upstream's rerender snapshot, we
measure after every commit, so keyed reorders of unchanged-prop children
animate. The divergence is intentional: upstream misses a box change on a
component that did not rerender, and native Octane never rerenders
unchanged-prop children on reorder.

Scheduling per platform: web — MutationObserver + layout-effect invalidation,
measured in a microtask before paint. iOS — `observeBatches` `didApply` →
microtask → `layoutIfNeeded()` on all app windows → pass in the same
CATransaction. Android — `didApply` → one-shot globalLayout/preDraw pairs on
each pending root VTO plus the decor view, with `postInvalidateOnAnimation()`
forcing a traversal so the pass lands before the draw. (The earlier clock-based
2-frame fallback raced the traversal because NS animation-frame callbacks
requested outside a frame resolve faster than vsync; removed.) Native
measurement: UIKit `center - bounds/2` up the superview chain; Android
`getLeft`/`getTop` to the first non-View, divided by density — both exclude
transforms and scroll offsets. macOS observes renderer batches (including existing
roots when subscribing), forces AppKit layout before measuring, and compensates
for layer anchors. AppKit `isFlipped` is called when exposed as a method.


The maintained mobile probe is `examples/probes/motion-layout.mobile.tsrx`; the
`.mobile` suffix marks its iOS/Android-only native imports and elements.

`examples/probes/intl-shim.ts` exists because ui's table module evaluates
`new Intl.Collator` at module scope while NativeScript's JS runtime has no
`Intl`; without the shim the shared barrel's module eval aborts bundle startup.
This is a `packages/ui` native compatibility bug (recorded in Silo
`feedback_observations`), not a motion limitation; delete the shim once ui
stops constructing `Intl` objects at module scope.

### NativeScript upstream gaps this feature depends on

- `@nativescript-community/octane@0.2.5` exposes no batch/commit signal.
  Phase 0 evidence (P3: `layoutChanged` fired zero times on iOS for keyed
  reorder and parent move; Android edge-children only — P5: unchanged-prop
  children render 0 times on reorder — P7: one `didApply` per commit across
  app/modal/programmatic roots) requires a driver-level hook. Local patch:
  `packages/cli/patches/@nativescript-community__octane@0.2.5.patch` plus the
  synced copy under `packages/patches/`; exports `observeBatches()` returning
  an unsubscribe with `willApply`/`didApply(container, commands, depth)`.
  Scope: batch observation only; no command mutation; a throwing observer is
  logged and cannot abort the batch. Upstream:
  [nativescript-community/octane#17](https://github.com/nativescript-community/octane/pull/17)
  proposes the same API and semantics (upstream proposal). Drop the local hunk when a release ships it.
- NativeScript `layoutChanged` does not fire on keyed reorder or parent moves
  (P3, verified on iOS 27.0 sim + Android 15 emulator), so it can't drive
  commit detection.
- `<listview>` crashes at mount under the Mason driver:
  `Cannot create property 'gridRow' on number '0'` in `Style.set` via
  `CssState.onLoaded`. Observed in a probe on iOS; not investigated further;
  a programmatic `createNativeScriptRoot` subtree was used for cell-root
  evidence instead.


### Shared elements

Shared stacks are keyed by serialized namespace segments plus the layout ID.
A stack owns its lead, one outgoing member, a presented snapshot, and pending
exit promises. Handoffs transfer content boxes through viewport coordinates;
iOS, Android, and AppKit measurements distinguish those spaces by subtracting
ancestor scroll offsets only for the viewport box. Same-commit unmounts retain
a cloned snapshot until the next measurement pass, without measuring a detached
host. Empty stacks are then removed.

The lead drives follower geometry and the crossfade curves from motion-dom.
Re-entry preserves the incoming member's current opacity; older followers stay
hidden when a transition is interrupted again. Opacity writes happen after
projection writes and restore the latest controller opacity at completion.
Presence joins channel-exit and shared-exit promises; re-entry cancels pending
removal and promotes from the currently presented box. Group inheritance only
controls namespaces because every registered layout host already observes commits.


### Paint correction

Projection uses Motion's numeric corner and single-shadow correction on web.
NativeScript corrects resolved radius lengths and parsed shadow objects;
AppKit's `setLayoutProjectionScale(view, scale | null)` compensates renderer-owned
radii, masks, and shadow paths without changing authored styles or layout.
Scalar native radii and blur/spread are exact only under uniform scale. Web
multiple shadows retain Motion's fallback; percentage radii retain proportional
behavior on web and NativeScript.


### Scroll containers

Measurements retain ancestor scroll readers through source removal. Shared stack
snapshots and coordinate transfer read current offsets instead of the source's
last measured offset. Web fixed-position trees omit outside scroll. An explicit
`layoutScroll` API is unnecessary for these automatic cases; fixed descendants
inside transformed containers remain unqualified.

Chromium's maintained `motion-containers.test.web.ts` checks nested projecting
scrollers, corrected numeric corners, no scroll-only animation, and a removed
source handoff after scrolling. Source-offset unit tests cover UIKit, Android
pixel-to-DIP conversion, and flipped AppKit ancestors. The test exposed and fixed
an adapter reset gap: returning transform ownership with no channel values must
clear the last projection transform.


### Drag and layout

Projection blocks new layout animation while dragging, transfers a running
animation to the selected channels at its presentation, and compensates viewport
layout shifts before drawing. Ancestors can continue animating; absolute target
projection holds the card at the pointer, including release before the ancestor
settles. Cleanup and cancellation clear the block. Numeric constraints retain
their translation-coordinate meaning; this does not implement `Reorder`.


### Mason core paint integration

The first iOS device probe disproved the assumption that Core corner longhands
and parsed shadow arrays reflect Mason paint: `style.borderRadius` was 20 while
`style.borderTopLeftRadius` was 0, and `style.boxShadow` was a CSS string. Mason's
native style helper reported the actual radius/shadow strings. The adapter now
compensates those engine values directly for Mason views, preserving Core cascade
state. Standard NativeScript views retain the length/array path. This private
`_styleHelper` seam is scoped and versioned in motion's UPSTREAM.md.


## Verification and evidence lookup

Maintained mobile projection cases live in `examples/probes/motion-layout.mobile.tsrx`,
`motion-shared.tsrx`, and `packages/motion/tests/containers.mobile.tsrx`; check their current
filenames and runner requirements before execution. Browser container cases live
in `tools/visual/src/`; AppKit runtime cases live with the Motion package.
Geometry, paint-engine values, synthetic pointer events, and handler dispatch
qualify their respective mechanisms. They do not establish painted pixels,
physical input, OS hit-testing, or assistive-technology behavior.

Use Silo `local_artifacts` key `.agents/docs/notes/animation-notes.md` for the
preserved validation records. Follow [operational evidence](../exploration.md#operational-evidence);
keep current target results outside tracked guidance.
