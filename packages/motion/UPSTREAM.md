# Motion compatibility

The behavioral reference is `@octanejs/motion` source package version 0.1.56,
inspected from Octane main on 2026-09-29. Its UPSTREAM.md pins Motion 12.42.2
(commit `40e8756c63b258c9dd07de9501cb788410eefb02`). This package pins
`motion-dom@14.7.1` and bundles its pure numeric generators and interpolation.
The adapter is original code; it does not copy upstream's DOM host factory.

| Contract                                         | Upstream reference under packages/motion                          | Xplat implementation / evidence                                                                                                                                      |
| ------------------------------------------------ | ----------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Initial and changing targets, equal destinations | src/index.ts; tests/conformance/rerender.test.ts, effects.test.ts | Compiled wrappers over UI; components.web.test.tsrx                                                                                                                  |
| Numeric spring/tween samples                     | Motion's motion-dom animation/generators                          | Reused generators; engine.test.ts compares irregular-time samples                                                                                                    |
| Stable value, subscriptions, style replacement   | src/useMotionValue.ts; tests/conformance/motionValue.test.ts      | Numeric adapter with native clock; components.web.test.tsrx                                                                                                          |
| Spring set versus jump; follow source            | src/useSpring.ts; tests/conformance/useSpring.test.ts             | Owned spring interception and cleanup; hook tests                                                                                                                    |
| Derived numeric values                           | src/useTransform.ts; tests/conformance/useTransform.test.ts       | Upstream interpolation, direct subscriptions; hook tests                                                                                                             |
| Config and reduced motion                        | src/context.ts; tests/conformance/reducedMotionConfig.test.ts     | Context inheritance; spring transforms settle immediately on live preference changes while opacity can keep animating (`components.web.test.tsrx`, `engine.test.ts`) |
| Exit lifecycle                                   | src/index.ts; tests/conformance/exit.test.ts                      | Deliberate live-subtree retention on both leaves; presence.web.test.tsrx and native presence test                                                                    |
| Retained hosts on native                         | Not a DOM binding concern                                         | components.mobile.test.tsrx uses the universal object driver                                                                                                         |
| Bounded drag                                     | src/index.ts pointer-drag binding; upstream/src/gestures/drag     | Numeric constraints, scalar elasticity, callbacks, JS velocity spring; drag.test.ts and web/native handler tests                                                     |
| Interaction targets                              | whileTap/whileFocus gesture bindings                              | Host-level gesture seam (PointerEvents/touch/focus); snapshot + restore; components.web.test.tsrx, motion probe                                                      |
| Variant labels and bounded orchestration         | src/context.ts; src/index.ts variant inheritance/stagger          | variants.test.ts, web/native compiled host tests; numeric resolution before Controller                                                                               |
| Scoped imperative runs                           | useAnimate                                                        | Controller registry keyed on host nodes; `ref` accepts callback refs and `{current}` scopes                                                                          |
| Inertia                                           | `type: 'inertia'` imperative transition (drag release); motion-dom's `inertia` generator | `type: 'inertia'` on `MotionValue.animate`/`runAnimation` — target ignored; `power`/`timeConstant`/`min`/`max`/`bounceStiffness`/`bounceDamping`; engine.test.ts        |
| Custom host components                           | motion.create / motion.<tag>                                      | `motion.create(Component)` wraps shared-UI leaves; DOM tag proxy excluded                                                                                            |

Source links: [Octane motion](https://github.com/octanejs/octane/tree/main/packages/motion),
[upstream ledger](https://github.com/octanejs/octane/blob/main/packages/motion/UPSTREAM.md),
[Motion pin](https://github.com/motiondivision/motion/tree/40e8756c63b258c9dd07de9501cb788410eefb02).

## Deliberate boundaries

- Numeric values only. No CSS strings, keyframe arrays, `whileHover`/`whileInView`, or broad framework-neutral re-export.
  `layout` projection itself is supported; see the section below. Bounded drag,
  variants, `whileTap`, `whileFocus`, lifecycle callbacks
  (`onAnimationStart`/`onAnimationComplete`/`onUpdate`), `motion.create`, and
  `useAnimate` match the upstream prop names.
- Host APIs use shared UI names rather than DOM tags. Existing UI props remain
  available; motion owns transform channels and opacity. Put pre-existing CSS
  transforms on an outer container. Conflicting writers are errors.
- `set` on a plain value stops its current animation, making gesture takeover
  explicit and immediate. A spring value intercepts `set`; `jump` stops and snaps.
- MotionConfig defaults to `reducedMotion="never"`, matching the reference;
  choose `user` for system preferences. Config does not cross separate roots and
  does not alter imperative value.animate calls: consult useReducedMotion there.
- Timing uses a monotonic platform clock (`System.nanoTime`/`CADisplayLink`-derived
  on native, `performance.now` on web) with NativeScript's vsync scheduler.
- The same generator runs on web/native. Declarative tweens delegate to the
  platform animator (`UIViewPropertyAnimator` on iOS, `ViewPropertyAnimator`
  on Android, WAAPI `element.animate` on web) with per-frame presentation
  tracking so interruption hands off value and velocity to the JS engine;
  springs, reduced-motion runs, and gesture-driven values always run on the
  JS engine. The web driver animates a matched function-list transform
  keyframe plus `opacity`; sampled matrices decompose back to channels with
  rotate read modulo ±180° and scale signs folded per the matrix.
- Springs accept both the physical spec (stiffness/damping/mass/velocity) and
  upstream's duration/bounce spec. Transitions support `repeat`/`repeatType`
  (`loop`/`reverse`/`mirror`)/`repeatDelay` and per-channel overrides in the
  `{x: {…}, default: {…}}` form. Default declarative transition is a 0.3-second
  easeInOut tween. Targets are absolute; scale multiplies scaleX/scaleY.
  Opacity is clamped to 0–1 at the host. Reduced transforms have no delay.
  Non-bezier eases, springs, repeats, and per-key transitions refuse platform
  delegation and run on the JS engine on all targets.

## Bounded declarative drag

Decision #94 widens the exclusions recorded in #92. `drag={true}` moves both
axes; `drag="x"`/`"y"` owns one axis. Numeric `dragConstraints` edges are
absolute translation limits in CSS pixels/DIP; omitted edges are unbounded.
Measured-ref constraints are rejected explicitly. `dragElastic` is a scalar
0–1 (default 0.35; false = 0, true = 0.35), with linear resistance outside
bounds. Per-edge elasticity objects are excluded.

```tsx
import { motion } from '@octane-xplat/motion'

export function DraggableCard() {
	return <motion.View drag="x" dragConstraints={{ left: 0, right: 120 }} dragElastic={0.2} />
}
```

`onDragStart`, `onDrag`, and `onDragEnd` receive `(event, info)`, where info has
`point`, `delta`, `offset`, `velocity` (units/second), and `cancelled`. Point is
viewport/screen coordinates. Offset and delta describe pointer movement before
constraints. Start fires on activation after an 8-unit threshold, rather than
on pointer-down; unsuccessful pre-activation gestures emit no drag callbacks.
Cancellation emits one end callback and suppresses momentum. Disposal removes
input handlers and stops settlement without emitting an end callback.

```tsx
// motion is imported above; callbacks report gesture movement before constraints.
export function DragEvents() {
	return (
		<motion.View
			drag
			onDragStart={(_event, info) => console.log(info.point)}
			onDrag={(_event, info) => console.log(info.delta, info.offset)}
			onDragEnd={(_event, info) => console.log(info.velocity, info.cancelled)}
		/>
	)
}
```

Release projects `current + velocity * 0.2`, clamps the destination, and uses a
JS spring (stiffness 200, damping 30). `dragMomentum={false}` keeps the current
position if in bounds, or springs back from elastic overflow. This is a bounded
spring settle, **not upstream's inertia/decay algorithm**. Hard constraints
(`dragElastic={false}`) clamp every spring sample before host/value notification.
Reduced motion snaps release settlement; pointer tracking remains live.

```tsx
export function BoundedCard() {
	return (
		<motion.View
			drag="x"
			dragConstraints={{ left: 0, right: 120 }}
			dragElastic={false}
			dragMomentum={false}
		/>
	)
}
```

A plain or spring-backed `style.x`/`style.y` MotionValue can receive drag writes;
live writes use `jump` so passive spring following cannot lag the pointer.
Drag axes reject competing `animate`, `whileTap`, or `whileFocus` targets;
`initial` seeds the position and `exit` can own it after interaction ends.
No ref measurement, dragControls, dragListener, direction lock, propagation,
snap-to-origin, dragTransition, or onDragTransitionEnd is implemented. `drag` axis selection is not `dragDirectionLock`.

```tsx
import { motion, useMotionValue } from '@octane-xplat/motion'

export function LivePosition() {
	const x = useMotionValue(0)
	return <motion.View drag="x" style={{ x }} initial={{ x: 0 }} exit={{ x: -100 }} />
}
```

Web uses host PointerEvents/capture and `touch-action: pan-y` for horizontal
drag, `pan-x` for vertical drag, or `none` for both. Native imports the optional
peer `@nativescript-community/gesturehandler` (pinned to 2.0.45); native consumers
must install it even when using only other motion APIs because the native
entry imports its adapter. Web consumers do not need it. Apps call `install()`
before creating their Page/Frame/root; **do not call `install(true)`**, which
would replace existing NS gesture observers. There is no raw-pan fallback.
Motion reserves handler tags from 700000000 upward within its single module
instance. Native axis activation/failure uses 8 DIP; 2.0.45's Android config
setters need explicit DIP→pixel conversion while payloads already return DIP.
On Android single-axis handlers disable the default radial slop trigger so
only the selected axis can activate. The plugin's Manager owns view-init/dispose attachment; motion removes its
state/touch listeners and detaches on cleanup.

```ts
// Native bootstrap .mobile.ts, before creating Page/Frame/root hosts.
import { install } from '@nativescript-community/gesturehandler'

install() // Preserve existing NativeScript gesture observers.
```

NativeViewGestureHandler is not needed for the bounded surface: motion attaches
PanGestureHandler directly to its host, with no simultaneous/waitFor graph.
Nested native control ownership and complex competing drags are deferred.
Threshold configuration is source/test evidence of arbitration policy; only
real OS input inside a ScrollView can establish runtime arbitration.

## Variants (decision #93)

`variants` maps labels to numeric targets with an optional `transition`, or to
`(custom) => target` resolvers. The host's `custom` is passed to its own resolver;
current values and velocities are not resolver arguments. `initial`, `animate`,
`exit`, `whileTap`, and `whileFocus` accept targets, labels, or label arrays.
Arrays merge targets left to right; later channels win. Missing labels are
ignored. The last defined variant transition replaces the host/config transition
for that run; otherwise the normal default applies. Per-key transitions remain
supported. Resolvers should be pure; they may be evaluated during validation.

```tsx
export function LabelledMotion() {
	return (
		<motion.View
			custom={80}
			initial="hidden"
			animate={['shown', 'offset']}
			variants={{
				hidden: { opacity: 0 },
				shown: { opacity: 1 },
				offset: (custom: number) => ({ x: custom, transition: { duration: 0.2 } }),
			}}
		/>
	)
}
```

Initial labels (including `initial={false}`) inherit through a root-local
context. Animate labels propagate to descendant motion hosts without their own
`animate`; each host resolves its own map and `custom`. Ordinary UI wrappers do
not break propagation. An explicit `animate` makes that host an independent
animation subtree. Direct target objects are not inherited. Both shared motion
hosts and `motion.create` provide the context.

```tsx
import { View } from '@octane-xplat/ui'
import { motion } from '@octane-xplat/motion'

const CustomMotionView = motion.create(View)
export function InheritedMotion() {
	return (
		<CustomMotionView initial="hidden" animate="shown">
			<motion.View variants={{ hidden: { opacity: 0 }, shown: { opacity: 1 } }} />
		</CustomMotionView>
	)
}
```

On label-driven **animate** runs, the parent's resolved transition supports
numeric non-negative `delayChildren` and `staggerChildren` in seconds, applied
in child registration order and added to the child's own channel delays.
`when: 'beforeChildren'` waits for successful parent completion;
`'afterChildren'` waits for all inherited children; omitting `when` runs both
concurrently. Nested runs wait for their own descendants. Replacement and
unmount invalidate queued phases. A child mounted after a run starts joins
once that run completes, with fresh child delay; it does not extend that run's
completion barrier. Changing a retained child's resolved target/custom starts
its own inherited run. Registration order does not track keyed visual reorders.

```tsx
export function StaggeredCards() {
	return (
		<motion.View
			animate="shown"
			variants={{
				shown: {
					opacity: 1,
					transition: { delayChildren: 0.1, staggerChildren: 0.05, when: 'beforeChildren' },
				},
			}}
		>
			<motion.View variants={{ shown: { x: 40 } }} />
			<motion.View variants={{ shown: { x: 80 } }} />
		</motion.View>
	)
}
```

Exit and interaction labels resolve locally: they do not propagate activation
or child timing. Presence continues waiting for each registered host's explicit
exit; specify `exit` on children that need one. Callback completion remains
per-host playback, rather than a tree completion event. Unsupported upstream
semantics include `inherit={false}`, dynamic delay functions, `staggerDirection`,
`stagger()` helpers, gesture priority blending, `transitionEnd`, resolver chains,
and inheritance across separate renderer roots. Resolved targets and ordinary
transitions enter Controller unchanged, retaining existing delegation gates.

```tsx
import { Presence, motion } from '@octane-xplat/motion'

export function ExitingCards({ present }: { present: boolean }) {
	return (
		<Presence present={present}>
			<motion.View
				exit="hidden"
				variants={{ hidden: { opacity: 0 } }}
				onAnimationComplete={() => console.log('This host completed')}
			/>
		</Presence>
	)
}
```

## Presence divergence

`Presence present={...}` retains actual components and their state/subscriptions
until all registered exits finish. Upstream's `AnimatePresence` is a passthrough
and exiting DOM hosts clone themselves during cleanup. We deliberately do not
reuse that path or claim its cleanup timing. Presence renders an explicit View
wrapper, blocks interaction during exit, and restores interaction on reversal.
An ancestor unmount always disposes immediately. Nested boundaries are independent.

```tsx
import { useState } from 'octane'
import { Presence, motion } from '@octane-xplat/motion'
import { Button, Text } from '@octane-xplat/ui'

export function RetainedCard() {
	const [present, setPresent] = useState(true)
	return (
		<>
			<Button clickAction={() => setPresent(!present)}>Toggle card</Button>
			<Presence present={present}>
				<motion.View exit={{ opacity: 0 }}>
					<Text>Trip card</Text>
				</motion.View>
			</Presence>
		</>
	)
}
```

## Verification limits

Web WAAPI delegation (2026-10-02): unit tests drive a fake `Animation` through
the real web adapter for keyframe shape, matrix/matrix3d decomposition with
translation independent of transform-origin, sampling before cancellation, mid-flight
value/velocity handoff, and bezier-only gating; the retained probe passes on
headless Chromium with delegation counters engaged (14 starts, 10 finishes, 4
cancellations, 0 fallbacks). DOM dispatch evidence only — compositor pacing is
not asserted. The nonvisual [cancellation geometry regression](../../tools/visual/src/motion-cancellation.test.web.ts)
verified centered-scale cancellation and restart continuity in real Chromium
on 2026-10-22; it does not capture images or qualify OS input.

Bounded drag (2026-10-02): the maintained probe passes 14 assertions on web
Chromium and 14 on the requested iOS simulator, including live writes, bounded
momentum, callbacks, and cancellation. Native input is plugin handler dispatch;
it does not prove OS hit-testing or drag-versus-scroll arbitration. Android drag
runtime remains unverified. Package unit/build/packed-consumer checks cover the
public types and shared numeric behavior.
The variants expansion passes 60 standard tests and 5 native object-driver
tests. The maintained probe passes 11 assertions on web Chromium and the iOS
simulator (2026-10-02), including inherited custom destinations and
parent-before-children stagger completion order; iOS platform delegation engages.
No Android runtime was available for this expansion.

Unit and DOM tests establish bounded behavior, not full Framer Motion parity.
Universal object-driver tests establish retention and lifecycle without an OS.
Partial device observations are recorded in the
[motion v1 validation matrix](../../.agents/docs/notes/animation-notes.md). An isolated iOS
26.5 MotionProbe run verified pan completion/cancellation, Presence
focus/reversal/removal, and live Reduce Motion, including immediate transform
settlement. The API 35 Android emulator verified tween/spring completion,
cancellation, disposal, pan phase delivery, focus release on Presence exit, and
live reduced-motion observation. Changing `animator_duration_scale` to `0`
while mounted changed the probe state to reduced, and a subsequent idle snapshot
showed the `-100` tween destination; deleting the setting restored the default
and the state returned to normal. The idle snapshot does not establish
frame-accurate settlement time. Its injected pan release reported zero velocity,
and the accessibility runner did not reach idle during reversal, so those
checks remain open.

A physical iPhone 13 Pro Max running iOS 27.0.1 launched the temporary direct
MotionProbe under an Xcode UI-test host. The test verified tween-to-spring
retargeting, explicit `MotionValue.stop()` cancellation, native pan begin/move/end
with nonzero release velocity and settling, and Presence child retention through
a focus-triggered exit/reversal. Presence dismissed the keyboard; after
re-entry the retained field accepted focus and typed input, and a later exit
dismissed the keyboard and reported one removal. The failed check expected the
keyboard to remain open immediately after the focus-triggered reversal; that
expectation conflicts with Presence releasing focus on exit. The physical
Reduce Motion change remains inconclusive: the test did not record the system
switch value before and after its Settings tap. A corrected rerun was blocked
when the phone re-locked.

Physical Android CPH2551 evidence covers app launch and target retarget only;
ADB sees the handset, but its keyguard is currently locked. The regular mobile app now builds and
mounts on the iOS 26.5 simulator using NativeScript's `NSObject.extend()` API
for the auth-session presentation delegate. The Android build also passes with
the iOS delegate behind the `NSObject` runtime guard. The maintained
`examples/probes/motion.tsrx` case replaces the earlier temporary direct
MotionProbe entry (web Chromium and iOS simulator passes, 2026-10-02).
Physical input suppression during exit, Android gesture
cancellation/natural velocity, background/resume, and frame pacing remain
uncharacterized. On iOS the preference is observed through
`UIAccessibilityReduceMotionStatusDidChangeNotification`; Android still polls
`animator_duration_scale` at 500 ms while subscribed (plus
`ValueAnimator.areAnimatorsEnabled()` on API 26+) and refreshes on resume.

## macOS package boundary

Motion and RollingText have a separate macOS package build. This is package
acceptance only; gestures, retained presence, clipping, cell movement, and
live accessibility preferences require separate host checks. Motion numeric
channels have an additional focused AppKit runtime check below.
No AppKit runtime or OS input is exercised by the packed-consumer checks.

| Package                      | Workspace `macos` export | Published `macos` export | Type conditions                             |
| ---------------------------- | ------------------------ | ------------------------ | ------------------------------------------- |
| `@octane-xplat/motion`       | `src/index.ts`           | `dist/macos/index.js`    | `macos`, `native`; suffixes `.macos`, empty |
| `@octane-xplat/rolling-text` | `src/index.ts`           | `dist/macos/index.js`    | `macos`, `native`; suffixes `.macos`, empty |

Both keep the shared `types/index.d.ts` contract. Runtime consumers select
`macos` before `native`; library builds resolve `.macos` leaves and compile
components for the macOS renderer. Run these commands from the repository root:

```sh
pnpm --filter @octane-xplat/motion test:packed
pnpm --filter @octane-xplat/rolling-text test:packed
```

Each check packs the package, checks both export maps in Bundler and NodeNext
mode, verifies the selected runtime entry, imports all public runtime exports
without startup timers or the mobile gesture plugin, and mounts/unmounts initial
hosts with the universal object driver. It uses the production AppKit core shim
unchanged, substituting the renderer driver and supplying explicit NSView/CALayer
property doubles for Motion. These doubles are not native-host evidence.

The separate nonvisual runtime fixture checks actual NSView/CALayer values for
all seven numeric channels on View, Row and Pressable, including intermediate
samples, retargeting, scale composition, units and restoration. It passed on
macOS 27.0.1 arm64 using the AppKit/JSC host. From the repository root, run:

```sh
pnpm --filter @octane-xplat/motion test:macos-runtime
```

The fixture opens no window and changes no system preference. Success prints
`MOTION_CHANNELS_OK`; this focused check does not complete N2's live preference
and broader lifecycle acceptance or qualify RollingText.

Motion's macOS preference leaf reads [AppKit's Reduce Motion setting](https://developer.apple.com/documentation/appkit/nsworkspace/accessibilitydisplayshouldreducemotion) and subscribes
to accessibility-display changes on the workspace notification center. Cleanup
removes the subscription and suppresses callbacks queued after disposal. Without
an AppKit workspace, the preference reads false and observation is inert; this
fallback is not OS evidence. Enable system policy explicitly:

```tsx
import { MotionConfig, motion } from '@octane-xplat/motion'

export function SystemMotion() {
	return (
		<MotionConfig reducedMotion="user">
			<motion.View initial={{ x: 0 }} animate={{ x: 40 }} />
		</MotionConfig>
	)
}
```

Deterministic preference and observer tests establish source behavior only.
Real OS preference changes and the remaining N2 host/lifecycle acceptance still
require independent nonvisual runtime qualification. RollingText retains its
separate conservative preference baseline; this Motion fix does not qualify it.

Motion's macOS drag leaf throws `motion: macOS drag backend is not implemented`
when drag is requested. The mobile gesture backend is never loaded on macOS;
adding its exports to compatibility shims would not provide an AppKit backend.
The following request remains unsupported at this boundary:

```tsx
import { motion } from '@octane-xplat/motion'

export function UnsupportedDrag() {
	return <motion.View drag="x" />
}
```

## Layout projection

`layout`, `layoutDependency`, `onLayoutAnimationStart`/`onLayoutAnimationComplete`,
and `transition={{ layout: {...} }}` are supported on `motion.View`,
`motion.Row`, `motion.Pressable`, and `motion.create` hosts across web, iOS and
Android, and the experimental macOS host.

The projection node is modeled on upstream `create-projection-node.ts`
(measure → calc delta → mix → render) over motion-dom's pure geometry helpers;
`node.test.ts`'s three conformance cases are ported in `conformance.test.ts`.
The box math (`createBox`, `calcBoxDelta`, `applyTreeDeltas`,
`buildProjectionTransform`, relative targets, tree-scale propagation) is
motion-dom unchanged; the host adapter, scheduling barrier and measurement
walk are ours per platform.

**Divergence from upstream:** upstream snapshots only on rerender. Ours
measures after every commit, so a keyed reorder of unchanged-prop children
animates on native where Octane skips rerendering them. Upstream would leave
a memoized, non-rerendering component's box change unanimated.
`layoutDependency` gates starting an animation, never measuring.

**Triggering per platform:** web uses MutationObserver plus layout-effect
invalidation, measured in a microtask before paint. iOS uses the
`observeBatches` driver's `didApply` → microtask → `layoutIfNeeded()` on the
app windows → the pass runs in the same CATransaction. Android uses `didApply`
→ one-shot globalLayout/preDraw listener pairs on every pending root VTO plus
the decor view, with `postInvalidateOnAnimation()` forcing a traversal so the
pass lands before the draw. Native batch observation depends on the local
`observeBatches()` patch to `@nativescript-community/octane@0.2.5`
(`packages/cli/patches/`), needed because neither `layoutChanged` nor rerender
signals see reorders of unchanged children.

**Measurement** walks untransformed layout only: UIKit `center - bounds/2` up
the superview chain (transforms and scroll offsets excluded); Android
`getLeft`/`getTop` to the first non-View parent, divided by density.
Web adds ancestor scroll offsets to viewport measurements automatically;
unlike Motion React, this does not require `layoutScroll`. macOS observes
renderer layout commits, forces pending AppKit layout in a microtask, and
walks view frames in y-down content coordinates. Layer transforms do not
participate in measurement. Projection writes compensate for the layer's
anchor without changing AppKit's anchor or position.

Numeric corner radii and shadows are scale-corrected. Web reuses motion-dom's
`correctBorderRadius` and `correctBoxShadow`; NativeScript core views correct resolved style lengths and parsed shadow lists.
Mason core 1.0.0-beta.5 instead owns native CSS paint strings: its Core corner
longhands can read zero despite an authored radius, and `boxShadow` is a string.
For Mason views the adapter reads/writes `_styleHelper`'s radius/shadow strings,
leaving Core stylesheet state untouched. This is a local integration with a
private upstream seam, not a general NativeScript API. Replace the feature
detection when Mason exposes a stable paint-projection API. The iOS/Android
container probe verifies actual native geometry and the engine's paint values.
The string shadow path shares Motion's multiple-shadow fallback. AppKit uses renderer-owned paint scale
compensation, preserving stylesheet values and mask/shadow ownership. Native
radii use the geometric mean of the two scale axes. Scalar blur/spread and native
corners are exact only under uniform scale; nonuniform scale is approximate.
Motion's web corrector leaves multiple shadows unchanged. Correction resets on
measurement, completion and detach. Authored paint updates during projection
replace the baseline.

Measurements retain callbacks over scroll ancestor identities. Shared stack snapshots
read current offsets at promotion/unmount, so scrolling since the last measurement
cannot reuse a stale viewport origin. The source is not remeasured after removal.
Ordinary layout comparisons remain in content coordinates, so scroll alone does
not start an animation. An explicit `layoutScroll` opt-in adds no needed control
for these cases and remains unexposed.
Web measurement stops collecting outside scroll at fixed-position ancestors. Fixed descendants of transformed containers remain unqualified. On native, `rotate` combined with a non-uniform
parent treeScale is approximate (scale divides translate per axis but not the
rotation). Reduced motion snaps instead of animating; shared crossfades own opacity
until completion; `project(null)` rewrites merged channel values. Pre-existing CSS
transforms stay on an outer container.

## Shared layout elements

`layoutId` enables projection and registers a host in a shared lead/follow
stack. `LayoutGroup` composes ID namespaces; `inherit={false}` starts from an
empty namespace. `inherit="id"` and `true` are equivalent here: all registered
layout hosts already observe commits, rather than relying on a React group to
force unchanged children to render. Hosts without an explicit group ID use the
inherited/global namespace, matching Motion's ID behavior.

```tsx
import { LayoutGroup, motion } from '@octane-xplat/motion'

export function GroupNamespace() {
	return <LayoutGroup id="tabs" inherit={false}>
		<motion.View layoutId="underline" />
	</LayoutGroup>
}
```

The shared stack is modeled on Motion's `projection/shared/stack.ts`. It promotes
an incoming or re-entering member, transfers the previous lead's presented box
through viewport coordinates, and drives followers from the lead's animated
box. Same-commit unmounts retain only a snapshot until the next measurement pass;
unused empty stacks are discarded. No host measurement runs during unmount.
Native measurement now distinguishes content coordinates from scroll-adjusted
viewport coordinates for handoffs between containers.

Crossfade curves come from motion-dom's `mixValues`. They own only opacity;
normal channel values continue updating and regain opacity ownership on
completion. `layoutCrossfade={false}` hides followers immediately. Retaining
`Presence` exits wait for both their channel exit and the shared transition;
re-entry cancels removal and promotes from the current presented box.

```tsx
import { Presence, motion } from '@octane-xplat/motion'

export function SharedPresence({ present }: { present: boolean }) {
	return <Presence present={present}>
		<motion.View layoutId="card" layoutCrossfade={false} />
	</Presence>
}
```


## Drag with layout projection

Drag blocks new layout animations on its node and stops any running layout
animation at its presented position, rebasing the selected translation channels.
Every measurement rebases the drag origin and current channels by the viewport
layout shift before projection writes. This follows Motion's `isAnimationBlocked`
and `didUpdate` drag-origin adjustment, adapted to our post-commit measurements.
Projected ancestors keep animating: the dragged node resolves an absolute target
and cancels their transform through the usual tree correction. After release,
that absolute target is retained until existing ancestor layout animations finish,
so releasing early cannot jump into the parent's relative target. A subsequent
layout change can start an ordinary layout animation again. Detach, disabled drag,
and cancellation release the block.

Numeric constraints retain their translation-coordinate contract. Measured ref
constraints, drag-to-reorder and `Reorder` remain outside this work.
