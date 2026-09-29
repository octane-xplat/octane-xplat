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
numeric destinations do not restart when unrelated state renders.

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
is DIP/second; web velocity is CSS pixels/second. Full declarative drag and
scroll-gesture arbitration are outside this release.

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

## Existing imperative animation

`useAnimation` and `setTranslate` from UI remain available. The older
`useAnimation.to` duration is in milliseconds, unlike the new motion package.
[Reorder](../packages/demos/src/Reorder.tsrx) demonstrates the existing pan path.
See [animation notes](animation-notes.md) for its platform research and limitations.
