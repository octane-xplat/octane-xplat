# Settle a dragged value with a spring

ID: gesture-motion
Targets: web, ios, android
Related APIs: @octane-xplat/motion, useMotionValue, useTransform, useSpring, onPan, usePanGesture$, usePinchGesture$, useInteractionScope$, compete, drag, dragConstraints, dragElastic, dragMomentum, onDragEnd

## Starting point

A shared motion host, or a shared view accepting normalized pan events.

## Requirements

Drive motion directly while dragging and settle after release without writing
platform-specific transforms in the screen.

## Acceptance criteria

- AC1: Stop prior playback on begin and update bounded displacement during movement without per-frame screen state writes.
- AC2: Distinguish release from cancellation and use normalized velocity to settle; honor reduced motion.
- AC3: Dispose owned animation work and understand the limits of native drag/scroll arbitration.
- AC4: Configure declarative axis drag with numeric constraints, elasticity, momentum, and callbacks; use the shared input owner without installing a separate Motion handler peer. On web, preserve nested taps and keyboard activation while suppressing only the active drag's trailing pointer click.

## Documentation

- AC1: [Declarative drag](../../../docs/app/animation-gestures.md#drag-a-component), [Gesture values](../../../docs/app/animation-gestures.md#bind-values-and-gestures), [MotionDemo](../../../packages/motion/examples/MotionDemo.tsrx).
- AC2: [Declarative drag](../../../docs/app/animation-gestures.md#drag-a-component), [Release velocity and cancellation](../../../docs/app/animation-gestures.md#bind-values-and-gestures), [reduced motion](../../../docs/app/animation-gestures.md#reduced-motion-and-lifecycle), [MotionDemo](../../../packages/motion/examples/MotionDemo.tsrx).
- AC3: [Lifecycle](../../../docs/app/animation-gestures.md#bind-values-and-gestures), [compatibility](../../../packages/motion/UPSTREAM.md#verification-limits).

- AC4: [Gesture ownership](../../../docs/app/gestures.md), [Declarative drag](../../../docs/app/animation-gestures.md#drag-a-component), [maintained probe](../../../examples/probes/motion.tsrx), and [drag limits](../../../packages/motion/UPSTREAM.md#bounded-declarative-drag).
