# Animate a view through a ref

ID: imperative-animation
Targets: web, ios, android, macos
Related APIs: useAnimation, AnimatedValue, ref, to, spring, stop

## Starting point

An Octane Xplat screen using shared UI views and pressable controls.

## Requirements

Move or fade a view over time without per-frame screen state writes, and stop
playback safely when replacing it or removing the screen.

## Acceptance criteria

- AC1: Attach a stable animation controller to a view ref and use documented properties and units for timed and spring playback.
- AC2: Replace playback from the current sample, freeze it with stop, and cancel owned work on ref detachment or component disposal.
- AC3: Understand reduced-motion behavior on AppKit and distinguish timer/property evidence from OS input or frame-pacing verification.

## Documentation

- AC1: [Imperative animation](../docs/animation-gestures.md#existing-imperative-animation) and [maintained example](../packages/ui/examples/AnimationDemo.tsrx).
- AC2: [Controller lifecycle](../docs/animation-gestures.md#existing-imperative-animation) and [AppKit fixture](../apps/macos/test/animation-fixture.macos.tsx).
- AC3: [AppKit behavior](../docs/animation-gestures.md#existing-imperative-animation) and [verification limits](../docs/animation-notes.md#appkit-imperative-animation).
