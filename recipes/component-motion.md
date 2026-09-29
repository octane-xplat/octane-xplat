# Animate shared components

ID: component-motion
Targets: web, ios, android
Related APIs: @octane-xplat/motion, motion.View, motion.Row, motion.Pressable, MotionConfig, Presence, exit

## Starting point

An Octane xplat app with UI primitives and reactive screen state.

## Requirements

Add entry/update motion without native animation calls, preserve primitive
behavior, and respect reduced motion and component disposal.

## Acceptance criteria

- AC1: Install the leaf and animate supported numeric channels on mount and prop changes using documented units.
- AC2: Bind numeric values without per-frame renders and stop owned playback/subscriptions on disposal.
- AC3: Configure reduced motion and recognize unsupported capabilities and platform verification limits.

- AC4: Retain live component state during exit, reverse without remounting, disable exiting input, and distinguish boundary disposal from completed exit.

## Documentation

- AC1: [Component motion](../docs/animation-gestures.md#animate-a-component), [maintained example](../packages/motion/examples/MotionDemo.tsrx).
- AC2: [Value lifecycle](../docs/animation-gestures.md#bind-values-and-gestures).
- AC3: [Reduced motion](../docs/animation-gestures.md#reduced-motion-and-lifecycle), [known limits](../docs/known-limits.md#motion-leaf).

- AC4: [Retained exit lifecycle](../docs/animation-gestures.md#retain-content-through-exit), [PresenceDemo](../packages/motion/examples/PresenceDemo.tsrx).
