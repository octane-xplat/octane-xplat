# Animation & gestures

> Shared surface = intent-level API (`animateTo`, `spring`, gestures as event
> streams). Implementation = per-platform drivers. The JS-on-UI-thread model of
> NativeScript means this can be *simpler* than the RN equivalent — no worklet
> boundary.
>
> **Owns:** #5 animation/gesture facade · **Status:** mapped · **Blocks on:**
> Q8, Q7 · **Decisions:** #10 · **Validated by:** a `useGesture('pan')`-driven
> draggable element on both targets, 60fps, no re-renders during the gesture.

## The load-bearing fact

On NativeScript your JS **runs on the UI thread**: a `touch` move event can
mutate `view.style`/native props synchronously in the same frame. RN needed
Reanimated worklets + a serialized channel for exactly this; we don't. On web,
pointer events → DOM style is equally synchronous. So:

- Gesture-driven, interruptible animation is achievable with **plain JS** on
  both targets — no worklet runtime, no "native driver" flag semantics.
- The primitive contract is: animations and gestures write *imperatively* to
  the leaf view (via ref/style), while Octane state stays declarative. Rule:
  **animation writes imperative, app state writes declarative** — don't route
  per-frame values through `useState` (it's correct but wasteful; compiled
  renders still cost more than a style write).

## Layered design

```
packages/ui/anim (shared API)
├── useAnimation() → controller { to(), spring(), stop(), value }
├── useGesture('pan' | 'pinch' | 'tap'…) → normalized event stream
└── curves: named easings + cubic-bezier + spring params
        │                    │
   .web impl            .native impl
   WAAPI / @octanejs/   view.animate() /
   motion               view.style per-frame in touch handlers
```

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

| | Web | Native |
|---|---|---|
| Tweened props | WAAPI `el.animate()` (compositor-friendly) or `@octanejs/motion` | `view.animate({…})` → UIView/ViewPropertyAnimator; `Animation` class for multi-view |
| Per-frame/gesture-linked | `requestAnimationFrame` + direct style | `touch` handler + direct style — synchronous |
| Declarative loops | CSS `@keyframes` | NS CSS `@keyframes` — **verified set is ~12 props** (opacity, translate/scale/rotate, width/height, background-color, perspective, transform); unsupported props silently dropped |
| Curves | easing strings/cubic-bezier | `curve` param — **normalize to named/cubic-bezier only**; `spring` maps to UIKit spring on iOS vs BounceInterpolator on Android (divergent — facade must implement springs itself or accept the divergence) |

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
component elements) and writes `view.translateX` per rAF frame — no re-render.
`to(80,{300ms})` hit exactly 80; JS spring integrator settled to |−1.4|.

## Gesture normalization

| Shared | Web | Native |
|---|---|---|
| `onPress` | click/pointerup w/ press geometry | `tap` (already aliased by driver) |
| `useGesture('pan')` | pointerdown/move/up + setPointerCapture | `touch`/`pan` events (`getX/getY` in dip — convert to same units) |
| long-press | timer over pointerdown | `longPress` |
| `hover`/`focus` states | real CSS | N/A — omit or no-op; NS pseudo-states limited (`:highlighted` — verify) |

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

**Verified:** payload normalization landed in the View leaf — NS
`{deltaX,deltaY,state:int}` → `{x,y,dx,dy,vx,vy,state:'began'|...'}`; enum
map is `cancelled=0,began=1,changed→moved=2,ended=3`. Web leaf attaches raw
pointer listeners via the `bind` ref — **`pointermove` is not in octane's
delegated-event set**, so declarative `onPointerMove` props can't drive a
drag; the leaf owns the listeners. Velocity: computed on web from pointer
samples; native leaves it 0 (the recognizer's `velocityInView` is a later
seam).

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
