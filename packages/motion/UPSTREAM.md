# Motion compatibility

The behavioral reference is `@octanejs/motion` source package version 0.1.56,
inspected from Octane main on 2026-09-29. Its UPSTREAM.md pins Motion 12.42.2
(commit `40e8756c63b258c9dd07de9501cb788410eefb02`). This package pins
`motion-dom@12.42.2` and bundles its pure numeric generators and interpolation.
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
| Custom host components                           | motion.create / motion.<tag>                                      | `motion.create(Component)` wraps shared-UI leaves; DOM tag proxy excluded                                                                                            |

Source links: [Octane motion](https://github.com/octanejs/octane/tree/main/packages/motion),
[upstream ledger](https://github.com/octanejs/octane/blob/main/packages/motion/UPSTREAM.md),
[Motion pin](https://github.com/motiondivision/motion/tree/40e8756c63b258c9dd07de9501cb788410eefb02).

## Deliberate boundaries

- Numeric values only. No CSS strings, keyframe arrays, layout/layoutId,
  `whileHover`/`whileInView`, or broad framework-neutral re-export. Bounded drag,
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
  platform animator on native (`UIViewPropertyAnimator` on iOS,
  `ViewPropertyAnimator` on Android) with per-frame presentation tracking so
  interruption hands off value and velocity to the JS engine; springs,
  reduced-motion runs, and gesture-driven values always run on the JS engine.
  WAAPI delegation on web is deferred.
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

`onDragStart`, `onDrag`, and `onDragEnd` receive `(event, info)`, where info has
`point`, `delta`, `offset`, `velocity` (units/second), and `cancelled`. Point is
viewport/screen coordinates. Offset and delta describe pointer movement before
constraints. Start fires on activation after an 8-unit threshold, rather than
on pointer-down; unsuccessful pre-activation gestures emit no drag callbacks.
Cancellation emits one end callback and suppresses momentum. Disposal removes
input handlers and stops settlement without emitting an end callback.

Release projects `current + velocity * 0.2`, clamps the destination, and uses a
JS spring (stiffness 200, damping 30). `dragMomentum={false}` keeps the current
position if in bounds, or springs back from elastic overflow. This is a bounded
spring settle, **not upstream's inertia/decay algorithm**. Hard constraints
(`dragElastic={false}`) clamp every spring sample before host/value notification.
Reduced motion snaps release settlement; pointer tracking remains live.

A plain or spring-backed `style.x`/`style.y` MotionValue can receive drag writes;
live writes use `jump` so passive spring following cannot lag the pointer.
Drag axes reject competing `animate`, `whileTap`, or `whileFocus` targets;
`initial` seeds the position and `exit` can own it after interaction ends.
No ref measurement, dragControls, dragListener, direction lock, propagation,
snap-to-origin, dragTransition, onDragTransitionEnd, or layout projection is
implemented. `drag` axis selection is not `dragDirectionLock`.

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

Initial labels (including `initial={false}`) inherit through a root-local
context. Animate labels propagate to descendant motion hosts without their own
`animate`; each host resolves its own map and `custom`. Ordinary UI wrappers do
not break propagation. An explicit `animate` makes that host an independent
animation subtree. Direct target objects are not inherited. Both shared motion
hosts and `motion.create` provide the context.

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

Exit and interaction labels resolve locally: they do not propagate activation
or child timing. Presence continues waiting for each registered host's explicit
exit; specify `exit` on children that need one. Callback completion remains
per-host playback, rather than a tree completion event. Unsupported upstream
semantics include `inherit={false}`, dynamic delay functions, `staggerDirection`,
`stagger()` helpers, gesture priority blending, `transitionEnd`, resolver chains,
and inheritance across separate renderer roots. Resolved targets and ordinary
transitions enter Controller unchanged, retaining existing delegation gates.

## Presence divergence

`Presence present={...}` retains actual components and their state/subscriptions
until all registered exits finish. Upstream's `AnimatePresence` is a passthrough
and exiting DOM hosts clone themselves during cleanup. We deliberately do not
reuse that path or claim its cleanup timing. Presence renders an explicit View
wrapper, blocks interaction during exit, and restores interaction on reversal.
An ancestor unmount always disposes immediately. Nested boundaries are independent.

## Verification limits

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
[motion v1 validation matrix](../../docs/animation-notes.md). An isolated iOS
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
