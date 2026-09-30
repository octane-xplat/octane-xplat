# Motion and gestures

> Animate shared UI destinations and gesture values without platform animation code.

## Animate a component

Install `@octane-xplat/motion` alongside `@octane-xplat/ui` with pnpm. Import
`motion` and wrap content in `motion.View`, `motion.Row`, or `motion.Pressable`.
They preserve the corresponding UI primitive's layout, accessibility, and input
props. Supply `initial` and `animate` numeric targets and a `transition`.
`initial={false}` starts at the destination without an entry animation.

Supported channels are `opacity`, `x`, `y`, `scale`, `scaleX`, `scaleY`, and
`rotate`. Translation uses DIP on native and CSS pixels on web; rotation uses
degrees. Transition duration and delay use **seconds**. Choose a tween with
`duration`/`ease`, or `type: 'spring'` with stiffness, damping, mass, velocity,
and rest thresholds. Springs preserve velocity on retarget. The default is a
0.3-second easeInOut tween.

[MotionDemo](../packages/motion/examples/MotionDemo.tsrx) is the maintained
example for changing destinations and gesture settling. A signal read in the
component's `animate` expression subscribes that component normally; equal
numeric destinations do not restart when unrelated state renders. In the demo,
Toggle motion should move the destination 80 units; dragging is bounded to
±120 units and release settles at zero. When adapting its relative source
import to an app, import from `@octane-xplat/motion`.

Motion owns its transform and opacity channels. Put existing CSS transforms on
an outer container. Do not bind a MotionValue and an animate target to the same
channel or write it using setTranslate at the same time. Invalid targets and
conflicting inline styles throw instead of silently failing on native.

## Bind values and gestures

`useMotionValue(number)` returns an owned numeric value. Bind it through the
motion host's `style`, then call `set`, `jump`, `stop`, or
`animate(destination, transition)`. Animations return a `finished` promise with
`finished`, `cancelled`, or `replaced`; only successful declarative animations
call `onAnimationComplete`. Component disposal stops owned values and removes
subscriptions.

`useTransform` maps numeric ranges or applies a single/multiple-input numeric
transformer. `useSpring` follows a value or creates a settable spring: `set`
animates and `jump` snaps. `useMotionValueEvent` subscribes without a render.
MotionValue get reads are imperative, not Octane signal subscriptions.

Use shared `onPan` events to stop playback on begin, set displacement during
movement, and spring with release velocity on end. Treat cancellation separately
and commit product state once the interaction outcome is known. Native velocity
is DIP/second; web velocity is CSS pixels/second. Web pointer-up carries the
last movement sample for up to 100 ms, so a pointer-up at the same coordinates
as the final move retains its velocity; older samples resolve to zero. Full
declarative drag and scroll-gesture arbitration are outside this release.

## Reduced motion and lifecycle

`MotionConfig` supplies inherited transition defaults and a `reducedMotion`
policy: `never` (default), `always`, or `user`. Reduced motion settles transforms
immediately while allowing opacity fades. `useReducedMotion` observes the system
preference independently of config. Imperative gesture settling should use it
to choose immediate playback when appropriate. Pass configuration separately
into overlays with their own Octane root.

The [compatibility record](../packages/motion/UPSTREAM.md) states the bounded
upstream API, defaults, and platform evidence. Physical-device gesture behavior
and frame pacing are pending; native compilation is not a performance claim.

## Retain content through exit

Keep `Presence` mounted and change its `present` prop. Render children
unconditionally inside it; putting the conditional around the child removes it
before an exit can run. Set `exit` on motion hosts inside the boundary. The
[PresenceDemo](../packages/motion/examples/PresenceDemo.tsrx) demonstrates a
counter that survives a reversed exit.

Presence renders a View wrapper and accepts its layout props. It waits for all
registered motion hosts to finish before removing the live subtree. During exit,
component state and subscriptions remain active, but the wrapper blocks input
and hides its descendants from accessibility. Focus inside the subtree is
released; reappearance does not automatically steal focus back.

Setting `present` back to true during exit retains the same hosts and state,
cancels pending removal, and animates toward current destinations. A completed
exit unmounts children; a later appearance creates fresh component state.
`onExitComplete` fires once after the exits finish, not after reversal or boundary
disposal. Entry/update completion uses the motion host's `onAnimationComplete`.

Removing Presence or an ancestor disposes immediately. Nested boundaries are
independent: removing an outer boundary disposes inner boundaries, rather than
starting a second exit sequence. Each motion host belongs to its nearest boundary.
An `exit` prop outside Presence is an error.

This is deliberately different from upstream Octane motion, which unmounts the
original component and animates a DOM clone. Xplat retains the live subtree on
both web and native; it does not export `AnimatePresence` as a compatibility alias.

## Existing imperative animation

`useAnimation` and `setTranslate` from UI remain available. The older
`useAnimation.to` duration is in milliseconds, unlike the new motion package.
[Reorder](../packages/demos/src/Reorder.tsrx) demonstrates the existing pan path.
See [animation notes](animation-notes.md) for its platform research and limitations.
