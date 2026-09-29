# Settle a dragged value with a spring

ID: gesture-motion
Targets: web, ios, android
Related APIs: @octane-xplat/motion, useMotionValue, useTransform, useSpring, onPan

## Starting point

A shared view accepting normalized pan events.

## Requirements

Drive motion directly while dragging and settle after release without writing
platform-specific transforms in the screen.

## Acceptance criteria

- AC1: Stop prior playback on begin and update bounded displacement during movement without per-frame screen state writes.
- AC2: Distinguish release from cancellation and use normalized velocity to settle; honor reduced motion.
- AC3: Dispose owned animation work and understand the absence of full drag/scroll arbitration guarantees.

## Documentation

- AC1: [Gesture values](../docs/animation-gestures.md#bind-values-and-gestures), [MotionDemo](../packages/motion/examples/MotionDemo.tsrx).
- AC2: [Reduced motion](../docs/animation-gestures.md#reduced-motion-and-lifecycle), [MotionDemo](../packages/motion/examples/MotionDemo.tsrx).
- AC3: [Lifecycle](../docs/animation-gestures.md#bind-values-and-gestures), [compatibility](../packages/motion/UPSTREAM.md#verification-limits).
