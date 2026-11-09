# Animate shared components

ID: component-motion
Targets: web, ios, android
Related APIs: @octane-xplat/motion, motion.View, motion.Row, motion.Pressable, MotionConfig, Presence, exit, variants, custom, staggerChildren, delayChildren, when

## Starting point

An Octane Xplat app with UI primitives and reactive screen state.

## Requirements

Add entry/update motion without native animation calls, preserve primitive
behavior, and respect reduced motion and component disposal.

## Acceptance criteria

- AC1: Install the leaf and animate supported numeric channels on mount and prop changes using documented units.
- AC2: Bind numeric values without per-frame renders and stop owned playback/subscriptions on disposal. Lifecycle callbacks may stop, destroy, or replace playback without reviving obsolete work.
- AC3: Configure reduced motion and recognize unsupported capabilities and platform verification limits.

- AC4: Retain live component state during exit, reverse without remounting, disable exiting input, and distinguish boundary disposal from completed exit.

- AC5: Coordinate named parent and child variants, distinguish inherited labels from explicit child targets, and understand child timing and local exit/interaction limits.

- AC6: Compose active focus and press per channel (press wins shared channels), return to the current base in either release order, and preserve independent playback, cancellation, prop removal and disposal under reduced motion.

- AC7: Choose duration/bounce springs with documented completion timing, or physical springs for velocity continuity; understand physical-input precedence and preserve repeats, cancellation and reduced motion.

## Documentation

- AC1: [Component motion](../../../docs/app/animation-gestures.md#animate-a-component), [maintained example](../../../packages/motion/examples/MotionDemo.tsrx), and [Android translation boundary regression](../../../packages/motion/tests/android-translation.android.ts) (native density, cancellation, replacement and spring handoff; no OS input). [Combined-scale interruption](../../../packages/motion/src/delegation.test.ts), [web handoff](../../../packages/motion/src/delegation.web.test.ts), and [native property handoff](../../../packages/motion/src/scale-handoff.mobile.test.ts) preserve independent factors; the [Chromium probe](../../../packages/motion/tests/scale-interruption.web.ts) checks actual WAAPI handoffs without images. Host doubles do not qualify devices.
- AC2: [Value lifecycle](../../../docs/app/animation-gestures.md#bind-values-and-gestures), [maintained value example](../../../packages/motion/examples/MotionDemo.tsrx), and [deterministic lifecycle regressions](../../../packages/motion/src/engine.test.ts) cover callback cancellation, destruction, replacement, promise settlement and repeat cleanup. These tests do not establish device frame pacing.
- AC3: [Reduced motion](../../../docs/app/animation-gestures.md#reduced-motion-and-lifecycle), [known limits](../../../docs/testing/known-limits.md#motion-leaf).

- AC4: [Retained exit lifecycle](../../../docs/app/animation-gestures.md#retain-content-through-exit), [PresenceDemo](../../../packages/motion/examples/PresenceDemo.tsrx), and [nonvisual input qualification](../notes/input-readiness-notes.md#completed-checks).

- AC5: [Coordinate variants](../../../docs/app/animation-gestures.md#coordinate-variants), [compatibility boundaries](../../../packages/motion/UPSTREAM.md#variants-decision-93), and [maintained motion probe](../../../examples/probes/motion.tsrx).

- AC6: [Compose feedback](../../../docs/app/animation-gestures.md#combine-press-and-focus-feedback), [shared conformance](../../../packages/motion/test/gesture-contract.ts), [compiled web](../../../packages/motion/src/gesture-composition.web.test.tsrx), and [compiled native](../../../packages/motion/src/gesture-composition.mobile.test.tsrx). Native object-driver tests establish policy and adapter dispatch, not OS input.

- AC7: [Spring modes](../../../docs/app/animation-gestures.md#animate-a-component), [maintained example](../../../packages/motion/examples/MotionDemo.tsrx), and [timing/trajectory regressions](../../../packages/motion/src/engine.test.ts). Pure clock tests establish generator contracts, not device frame pacing.
