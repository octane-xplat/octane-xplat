# Native Pressable contact ownership

Android Pressable validates tap and double-tap activation against the same
contact's raw screen movement using `ViewConfiguration.getScaledTouchSlop()`.
A contact remains rejected after exceeding slop, cancellation, multiple
pointers, disabling, or removal of its pan/pinch owner. A new ACTION_DOWN
starts a fresh contact. Callback identity changes alone preserve ownership.
No event is intercepted or consumed; native scrolling and pan delivery keep
their existing owners. Keyboard/accessibility activation without an Android
MotionEvent and iOS recognizer arbitration retain their existing paths.

Mason Core 1.0.0-beta.7 retains Mason's string `tap` → native `click` alias.
That event's wrapper carries a target but no MotionEvent. Pressable binds the
NativeScript gesture channel through the base View listener API, avoiding
the alias while retaining NativeScript accessibility dispatch. The alias and
wrapper originate in [Mason's shared event implementation](https://github.com/octane-xplat/nativescript-mason/blob/1a4da0614d78db5dd008847a70ac921a6d3ca945/packages/nativescript-masonkit/common.ts),
from which the core runtime is generated. No Mason native dependency rewrite is
needed. Do not switch these listeners back to string event names.

The screen-coordinate check also compensates for NativeScript core 9.1.3's
independent Android recognizers:
[`CustomPanGestureDetector`](https://github.com/NativeScript/NativeScript/blob/45b3b99afd89f19e799da84203aa19d673f7b20a/packages/core/ui/gestures/index.android.ts)
starts on the first MOVE and computes raw-screen translation, while the separate
`GestureDetectorCompat` sees view-local coordinates. A view following the finger
can keep local movement within tap slop despite substantial screen travel.
Rejecting every pan-began would also reject valid taps with tiny finger jitter.
The workaround can be reconsidered when upstream recognizers arbitrate moving
hosts using screen movement. Tracking issue: [#230](https://github.com/octane-xplat/octane-xplat/issues/230).

The compiled `pressable.mobile.test.tsrx` regression exercises the trailing tap,
small jitter, cancellation, contact takeover, callbacks, disabled/gesture
changes, independent control ownership and non-touch activation. It establishes
component dispatch behavior, not OS scrolling or accessibility services. Actual
Android OS evidence belongs in local qualification reports; it does not qualify
iOS input, nested-scroll arbitration or Motion compositor behavior.
