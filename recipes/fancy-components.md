# Recreate fancy components

ID: fancy-components
Targets: web, ios, android
Related APIs: @octane-xplat/motion, motion.View, motion.Row, useMotionValue, useMotionValueEvent, useTransform, useMeasure, MotionConfig, useReducedMotion, SegmentedControl, Switch, Absolute, descriptorChildren

## Starting point

An Octane Xplat app with the motion package installed and a working screen.
The live reference is the Fancy components showcase in the harness app —
`pnpm dev:web`, `pnpm dev:ios`, or `pnpm dev:android`, then
Apps → Fancy components.

## Requirements

Recreate the familiar "fancy components" text and motion effects — an endless
marquee, a typewriter, a scramble-in reveal, a number ticker, drifting
badges, orbiting chips, and a free-drag board — on the shared primitives and
the motion leaf, honoring the system reduced-motion preference before any
app-level preview.

## Acceptance criteria

- AC1: Loop arbitrary content horizontally through a clipped viewport at a steady speed, driven by a measured content segment and a repeating translate value, with Play/Pause and direction controls that keep the loop's phase instead of jumping, duplicate copies hidden from assistive technology, and autonomous playback paused while the app is backgrounded.
- AC2: Type phrases character by character with a blinking caret, dwell on each complete phrase, delete, and advance to the next phrase, with a Replay control that restarts from the first phrase.
- AC3: Reveal a string left to right with a bounded window of noise glyphs trailing the edge, settle on the exact real text, keep the real string on the accessibility label throughout, and report completion.
- AC4: Count a value toward a target through a MotionValue, render every change, settle on the exact formatted target, announce only the settled value, and report completion, with a Replay control.
- AC5: Treat the system reduced-motion preference as the authority — a preview may request reduced motion but never force full motion — and settle all four effects directly when it applies: the marquee parks at rest, the typewriter prints whole with a steady caret, the scramble resolves instantly, and the ticker jumps to its target.
- AC6: Drift decorative badges continuously — x, y, and z-rotation ride sine waves at whole-number cycle counts over one shared loop phase — with per-sibling phase offsets, Play/Pause that holds phase mid-drift, and a deterministic parked pose under reduced motion.
- AC7: Orbit children evenly spaced around a board center inside an Absolute container, each child's angle derived from a shared loop phase, with Play/Pause that holds the ring mid-turn, a direction control that reverses in place, and a static evenly spaced ring under reduced motion.
- AC8: Drag chips freely inside a bounded board — numeric drag constraints bound the translate, dragElastic resists past the edge, release momentum projects a bounded spring, the grabbed chip re-renders last to ride on top, a Reset control re-scatters to deterministic seed positions, and release settlement jumps to target under reduced motion.

## Documentation

- AC1: [Loop a marquee](../docs/app/animation-gestures.md#loop-a-marquee) and the [maintained showcase](../packages/demos/src/FancyComponents.tsrx).
- AC2: [Type phrases with a caret](../docs/app/animation-gestures.md#type-phrases-with-a-caret).
- AC3: [Reveal text through a scramble](../docs/app/animation-gestures.md#reveal-text-through-a-scramble).
- AC4: [Count up a value](../docs/app/animation-gestures.md#count-up-a-value).
- AC5: [Reduced motion and lifecycle](../docs/app/animation-gestures.md#reduced-motion-and-lifecycle) plus the [motion leaf limits](../docs/verify/known-limits.md#motion-leaf).
- AC6: [Drift a badge](../docs/app/animation-gestures.md#drift-a-badge) and [the shared loop driver](../docs/app/animation-gestures.md#drive-continuous-motion-from-a-shared-loop).
- AC7: [Orbit a ring](../docs/app/animation-gestures.md#orbit-a-ring), including the `descriptorChildren` children-enumeration marker.
- AC8: [Scatter draggable chips](../docs/app/animation-gestures.md#scatter-draggable-chips) and [drag a component](../docs/app/animation-gestures.md#drag-a-component).
