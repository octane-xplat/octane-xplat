# Animation and gesture notes

> Detailed record of the animation and gesture surface. Shared surface = intent-level API (`animateTo`, `spring`, gestures as event
> streams). Implementation = per-platform drivers. The JS-on-UI-thread model of
> NativeScript means this can be _simpler_ than the RN equivalent — no worklet
> boundary.
>
> **Owns:** #5 animation/gesture facade · **Status:** v1 implemented; physical-device validation is partial · **Blocks on:**
> physical iOS reduced-motion evidence and physical Android gesture/cancellation/
> Presence checks · **Decisions:** #10 · **Validation goal:** a dragged element
> that settles without per-frame renders. These probes do not establish a 60fps
> guarantee or physical-device frame pacing.

## Current implementation

`@octane-xplat/motion` is the leaf for declarative hosts and numeric values.
See the [guide](animation-gestures.md) and [pinned compatibility record](../packages/motion/UPSTREAM.md).
It reuses Motion 12.42.2 numeric generators with platform frame scheduling.
The older UI `useAnimation` below remains unchanged; its fixed-step spring is
not the new leaf's engine. This matrix separates simulator and emulator runs
from physical handset observations; older `useAnimation` results do not
validate the new leaf.

## Motion v1 validation record — 2026-09-29

The iOS simulator and Android emulator rows exercise NativeScript's platform
drivers, but do not stand in for physical-device input or frame pacing.

| Case | Web and host-neutral evidence | iOS simulator and device | Android emulator and device |
| --- | --- | --- | --- |
| Build and launch | Motion tests: 23 standard and 3 native-config tests passed; UI package build and native UI tests passed. | iOS 26.5 simulator: the normal mobile entry builds, installs, launches, and mounts Home. The auth-session presentation delegate uses NativeScript's `NSObject.extend()` API. The physical iPhone motion suite still used a temporary direct `MotionProbe` entry and Xcode UI-test host; the phone re-locked before the latest rerun. | Android API 35 emulator: temporary direct `MotionProbe` entry built, installed, and launched. The full mobile app also builds for Android; the iOS delegate remains behind the runtime's `NSObject` availability guard. Physical CPH2551 / Android 16: build, install, and launch passed in an earlier run; ADB now sees the handset, but its keyguard is locked, so no physical test ran this round. |
| Tween, spring, retarget | `engine.test.ts` checks tween endpoints, irregular-time spring samples, and velocity-preserving retarget. Host tests check final numeric values and completion. | iOS 26.5 simulator previously reached `100` and `-40`, including a tween interrupted by a spring. On the physical iPhone, a tween to `100` was interrupted by a spring retarget to `40` and completed at `40`. | CPH2551 previously reached `100`, then `-40`. The API 35 emulator completed a tween at `100` and a mid-flight spring retarget at `-40`. |
| Cancellation and disposal | Engine tests verify one cancellation result, no completion callback after cancellation, and channel cleanup on disposal. | Earlier iOS 26.5 simulator run: MotionValue cancellation resolved `cancelled`; unmount disposal resolved `job cancelled`. The physical iPhone confirmed explicit `MotionValue.stop()` cancellation; component-disposal confirmation remains simulator/object-driver evidence. | API 35 emulator: MotionValue cancellation resolved `cancelled`; unmount disposal resolved `job cancelled`. Physical handset checks remain pending. |
| Pan and release velocity | Headless Chromium smoke: pointer begin/move/end reports nonzero CSS px/s release velocity and spring-settles at `x=0`; pointer cancellation settles at `x=0`. It exposed a web hook that dropped active gestures when a re-render replaced the callback and zeroed release velocity at unchanged pointer-up coordinates; the hook now keeps its listener across callback changes and retains fresh velocity samples. This validates DOM pointer plumbing, not OS recognizer delivery or frame pacing. | The iOS 26.5 simulator reported `began → moved → ended`, settled at `x=0`, and release velocity `396`. Sending Home during a held swipe produced `began → moved → cancelled`. On the physical iPhone, an XCUITest swipe delivered `began → moved → ended`, reported nonzero release velocity, and spring-settled at `x=0`; physical cancellation remains open. | The API 35 emulator reported `began → moved → ended` and settled at `x=0`; ADB-injected swipes reported release velocity `0`, so they do not establish natural release velocity. A native UI regression test now distinguishes Android `ACTION_CANCEL` from NativeScript's `ended` state and verifies zero cancellation velocity plus tracker cleanup; physical gesture cancellation and natural release velocity remain open. |
| Presence identity, input, and removal | Web and native object-driver tests cover retained child identity, input blocking, reversal, and exactly-once cleanup. | The iOS 26.5 simulator retained a counter at `1` through a focused exit and reversal, released focus, allowed refocus after re-entry, and reported one removal. On the physical iPhone, a focus-triggered exit/reversal retained the counter at `1` and blurred the field; after re-entry the field accepted a new focus and typed text, then exit dismissed the keyboard and reported `removals=1`. A temporary test incorrectly expected the keyboard to remain open immediately after the focus-triggered reversal; that assertion failed while the later refocus and removal checks passed. | The API 35 emulator cleared focus on a completed Presence exit and reported `removals=1`. A later reversal attempt did not produce a stable accessibility snapshot (`uiautomator` could not reach idle), so reversal remains unverified. |
| Live reduced motion | The web test changes `matchMedia` while mounted and verifies immediate transform settlement and listener cleanup. | On iOS 26.5 simulator, toggling system Reduce Motion while mounted changed `useReducedMotion` from false to true and back. With it enabled, a target change immediately moved the accessibility frame by the full `x=-100` offset while the opacity tween was still completing; the system setting was restored to false. On the physical iPhone, a temporary test opened Settings and tapped Reduce Motion, then returned to an app label reading false; because it did not capture the switch's before/after values and its assertion failed, the physical preference transition is inconclusive. | On the API 35 emulator, setting global `animator_duration_scale` from its absent/default value to `0` changed the mounted probe label from false to true; a Tween tap then showed `completed at -100` and a translated accessibility bound in the next idle snapshot. Deleting the setting restored the default and the label returned to false. The idle snapshot does not establish frame-accurate settlement time. |

The motion-specific simulator, emulator, and physical iPhone checks used a
temporary direct `MotionProbe` entry to avoid loading unrelated app routes;
that entry was removed afterward. Separately, the normal mobile entry built
and mounted on the iOS simulator with the auth-session delegate implemented via
NativeScript's `NSObject.extend()` API. The
physical iPhone checks used the direct entry under an Xcode UI-test host. A
corrected live reduced-motion check needs to record the Settings switch before
and after the toggle. The Android phone is ADB-visible but currently
keyguard-locked, so natural pan velocity and cancellation remain open there.
On Android, injected taps on blank or label chrome left the input focused,
although Presence exit cleared it. Do not infer Android tap-to-blur or reversal
parity from the successful exit case. Web and object-driver tests do not close
the remaining physical-device gaps.

## The load-bearing fact

On NativeScript your JS **runs on the UI thread**: a `touch` move event can
mutate `view.style`/native props synchronously in the same frame. RN needed
Reanimated worklets + a serialized channel for exactly this; we don't. On web,
pointer events → DOM style is equally synchronous. So:

- Gesture-driven, interruptible animation is achievable with **plain JS** on
  both targets — no worklet runtime, no "native driver" flag semantics.
- The primitive contract is: animations and gestures write _imperatively_ to
  the leaf view (via ref/style), while Octane state stays declarative. Rule:
  **animation writes imperative, app state writes declarative** — don't route
  per-frame values through `useState` (it's correct but wasteful; compiled
  renders still cost more than a style write).

## Original layered design (historical)

```
packages/ui/anim (shared API)
├── useAnimation() → controller { to(), spring(), stop(), value }
├── useGesture('pan' | 'pinch' | 'tap'…) → normalized event stream
└── curves: named easings + cubic-bezier + spring params
        │                    │
   .web impl            unsuffixed native default
   WAAPI / @octanejs/   view.animate() /
   motion               view.style per-frame in touch handlers
```

The following sketch predates the shipped API. In particular, `useGesture`
and style-binding the old `useAnimation` return value are not current usage
instructions. Use [motion and gestures](animation-gestures.md) and its
maintained examples for the current binding and lifecycle contract.

### Shared API shape (Flutter-flavored)

```ts
const x = useAnimation(0);                    // animated value, ref-backed
x.to(100, { duration: 250, curve: 'easeOut' });
x.spring(0, { damping: 14 });
<View style={{ translateX: x }} />            // binding, not re-render
```

- `useAnimation` returns a value usable inside `style` objects — leaf impl
  subscribes and writes to the underlying view each tick.
- `interpolate(value, [in], [out])`, `Sequence`/`Stagger` later — keep v1 to
  `to`/`spring`/`interpolate`.

### Per-target drivers

|                          | Web                                                              | Native                                                                                                                                                                                                      |
| ------------------------ | ---------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Tweened props            | WAAPI `el.animate()` (compositor-friendly) or `@octanejs/motion` | `view.animate({…})` → UIView/ViewPropertyAnimator; `Animation` class for multi-view                                                                                                                         |
| Per-frame/gesture-linked | `requestAnimationFrame` + direct style                           | `touch` handler + direct style — synchronous                                                                                                                                                                |
| Declarative loops        | CSS `@keyframes`                                                 | NS CSS `@keyframes` — **verified set is ~12 props** (opacity, translate/scale/rotate, width/height, background-color, perspective, transform); unsupported props silently dropped                           |
| Curves                   | easing strings/cubic-bezier                                      | `curve` param — **normalize to named/cubic-bezier only**; `spring` maps to UIKit spring on iOS vs BounceInterpolator on Android (divergent — facade must implement springs itself or accept the divergence) |

`@octanejs/motion` exists but is DOM-only — treat it as the web driver's
implementation detail, not a shared dependency.

**`view.animate` contract traps** (verified via ns-view-animations):
transforms are **absolute destinations** (scale:0.5 then scale:1 is "to 1",
not "double") — the facade must track current values itself; cancel resolves
on Android but leaves the promise **pending forever on iOS** — never `await`
a cancellable animation; `iterations: 0` diverges (iOS=none, Android
degenerate) — facade exposes `iterations: 'infinite'` explicitly.

**Verified on iOS:** `useAnimation()` → `{ value, to, spring, stop, bind }`
works as a plain exported function in a `.tsrx` file — hooks called inside an
active component render resolve via implicit slots
(`implicit:${owner.implicitSlot++}`), so custom hooks don't need `@{ }`
bodies; they just need stable call order. The value attaches through a `bind`
prop on the leaf (→ intrinsic `ref`; `ref` itself is runtime-reserved on
component elements) and writes `view[prop]` per rAF frame — no re-render.
`to(80,{300ms})` hit exactly 80; JS spring integrator settled to |−1.4|.

## Gesture normalization

| Shared                 | Web                                     | Native                                                                  |
| ---------------------- | --------------------------------------- | ----------------------------------------------------------------------- |
| `onPress`              | click/pointerup w/ press geometry       | `tap` (already aliased by driver)                                       |
| `useGesture('pan')`    | pointerdown/move/up + setPointerCapture | `touch`/`pan` events (`getX/getY` in dip — convert to same units)       |
| long-press             | timer over pointerdown                  | `longPress`                                                             |
| `hover`/`focus` states | real CSS                                | N/A — omit or no-op; NS pseudo-states limited (`:highlighted` — verify) |

Normalize to: `{ x, y, dx, dy, vx, vy, state: 'began'|'moved'|'ended'|'cancelled', target }`.
Velocity is essential for interruptible gestures (drawer, swipe-to-dismiss).

**Verified on iOS:** `onPan`/`onSwipe` props on a `<flexboxlayout>` map
through the driver's generic `onX` → event-name rule and deliver full
payloads (`deltaX/deltaY/state`, `direction`) — one observer per gesture,
verified via `getGestureObservers()`. **Seam:** gesture events are NOT on
the plain event list — `view.on('tap')` routes to `GesturesObserver`, so
`view.notify({eventName:'tap'})` never reaches handlers (unlike `textChange`
which is a real event). Programmatic probing must call
`observer.callback(args)`; real-recognizer delivery was verified manually
(taps + typing).

**Verified:** payload normalization landed in the shared pan plumbing
(`pan`/`pan.web`)  — View, Row, and Pressable all take
`onPan`/`onSwipe`/`bind`. NS `{deltaX,deltaY,state:int}` →
`{x,y,dx,dy,vx,vy,state:'began'|...'}`; enum map is
`cancelled=0,began=1,changed→moved=2,ended=3`. Web leaves attach raw
pointer listeners via the `bind` ref — **`pointermove` is not in octane's
delegated-event set**, so declarative `onPointerMove` props can't drive a
drag; the leaf owns the listeners. Velocity is computed from web pointer
samples; native iOS reads `velocityInView`, and native Android uses
`VelocityTracker` over the MotionEvents and converts px/sec to dip/sec.
The demosweep exercises pan programmatically (observer callbacks on iOS
sim — the Reorder step); real-recognizer delivery stays manual.

## Choreography patterns proven in ns-octane

- **Interruptible drawer**: `@nativescript-community/ui-drawer` +
  `translationFunction` — gesture progress drives the whole tree of
  transforms (parallax, backdrop dim) synchronously. Model for all
  gesture-linked animation.
- **Keyboard-synced composer**: input-accessory plugin drives frame-aligned
  movement; the pattern is "listen to native channel, write styles
  per-frame." Web analog: `visualViewport` + rAF.
- **Mount-swap via `visibility`**: all states mounted, `collapse` toggles —
  reliable where layout re-measure is fragile.

## What we deliberately don't build (v1)

- Shared-element transitions / hero animations — platform extras later.
- A physics sim library — `spring` semantics need JS anyway (native `spring`
  curve diverges iOS/Android), so a small JS integrator for `x.spring()` is
  the portable path; keyframe/`view.animate` springs stay platform quirks we
  don't expose.
- CSS `transition`-style implicit animation — **verified absent on NS**; the
  facade owns state→state animation explicitly (`x.to(...)`) or via keyframe
  classes.
