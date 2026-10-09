# Compose motion patterns

ID: motion-patterns
Targets: web, ios, android
Related APIs: @octane-xplat/motion, Presence, motion.View, MotionConfig, useReducedMotion, useMotionValue, useMotionValueEvent, SegmentedControl, Switch

## Starting point

An Octane Xplat app with the motion package installed and a working screen.
The live reference is the Motion patterns showcase in the harness app —
`pnpm dev:web`, `pnpm dev:ios`, or `pnpm dev:android`, then
Apps → Motion patterns → Activity overview.

## Requirements

Compose everyday product interactions — switching views, revealing a bounded
group, settling a total, rotating supporting copy — from the existing
declarative motion hosts, while honoring the system reduced-motion preference
before any app-level preview.

## Acceptance criteria

- AC1: Switch between distinct views so the outgoing content exits before the incoming enters, repeated selections converge on the latest, and only one view is interactive or exposed to assistive technology at a time, including an empty-content state.
- AC2: Reveal a bounded ordered group with a restrained stagger on first entry and on explicit replay, preserving item identity and reading order, covering zero- and one-item sets, without restarts on unrelated renders.
- AC3: Update a formatted total that interpolates then settles to the exact target, retargets mid-flight to the latest value, stays readable for zero, negative, and wide values without shifting controls, and announces only the settled value.
- AC4: Rotate short whole phrases on explicit Play with a readable dwell, Pause/Resume/Next controls, no autonomous cycling under reduced motion or while the view is hidden or backgrounded, and no repeated announcements.
- AC5: Treat the system reduced-motion preference as the authority — a preview may request reduced motion but never force full motion — and settle panels, groups, totals, and loops directly when it applies.

## Documentation

- AC1: [Switch views with a wait-style swap](../docs/app/animation-gestures.md#switch-views-with-a-wait-style-swap) and the [maintained showcase](../packages/demos/src/MotionPatterns.tsrx); exiting content leaves input and the accessibility tree through [retained presence](../docs/app/animation-gestures.md#retain-content-through-exit).
- AC2: [Reveal a bounded group](../docs/app/animation-gestures.md#reveal-a-bounded-group) and the showcase's Reveal results focused view.
- AC3: [Update a total](../docs/app/animation-gestures.md#update-a-total) and [reduced-motion lifecycle](../docs/app/animation-gestures.md#reduced-motion-and-lifecycle).
- AC4: [Rotate supporting copy](../docs/app/animation-gestures.md#rotate-supporting-copy).
- AC5: [Reduced motion and lifecycle](../docs/app/animation-gestures.md#reduced-motion-and-lifecycle) plus the [motion leaf limits](../docs/verify/known-limits.md#motion-leaf).
