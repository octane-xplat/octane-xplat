# Recreate fancy components

ID: fancy-components
Targets: web, ios, android
Related APIs: @octane-xplat/motion, motion.Row, useMotionValue, useMotionValueEvent, useMeasure, MotionConfig, useReducedMotion, SegmentedControl, Switch

## Starting point

An Octane Xplat app with the motion package installed and a working screen.
The live reference is the Fancy components showcase in the harness app —
`pnpm dev:web`, `pnpm dev:ios`, or `pnpm dev:android`, then
Apps → Fancy components.

## Requirements

Recreate the familiar "fancy components" text and motion effects — an endless
marquee, a typewriter, a scramble-in reveal, and a number ticker — on the
shared primitives and the motion leaf, honoring the system reduced-motion
preference before any app-level preview.

## Acceptance criteria

- AC1: Loop arbitrary content horizontally through a clipped viewport at a steady speed, driven by a measured content segment and a repeating translate value, with Play/Pause and direction controls that keep the loop's phase instead of jumping, duplicate copies hidden from assistive technology, and autonomous playback paused while the app is backgrounded.
- AC2: Type phrases character by character with a blinking caret, dwell on each complete phrase, delete, and advance to the next phrase, with a Replay control that restarts from the first phrase.
- AC3: Reveal a string left to right with a bounded window of noise glyphs trailing the edge, settle on the exact real text, keep the real string on the accessibility label throughout, and report completion.
- AC4: Count a value toward a target through a MotionValue, render every change, settle on the exact formatted target, announce only the settled value, and report completion, with a Replay control.
- AC5: Treat the system reduced-motion preference as the authority — a preview may request reduced motion but never force full motion — and settle all four effects directly when it applies: the marquee parks at rest, the typewriter prints whole with a steady caret, the scramble resolves instantly, and the ticker jumps to its target.

## Documentation

- AC1: [Loop a marquee](../docs/app/animation-gestures.md#loop-a-marquee) and the [maintained showcase](../packages/demos/src/FancyComponents.tsrx).
- AC2: [Type phrases with a caret](../docs/app/animation-gestures.md#type-phrases-with-a-caret).
- AC3: [Reveal text through a scramble](../docs/app/animation-gestures.md#reveal-text-through-a-scramble).
- AC4: [Count up a value](../docs/app/animation-gestures.md#count-up-a-value).
- AC5: [Reduced motion and lifecycle](../docs/app/animation-gestures.md#reduced-motion-and-lifecycle) plus the [motion leaf limits](../docs/verify/known-limits.md#motion-leaf).
