# Compose motion patterns

ID: motion-patterns
Targets: web, ios, android, macos
Related APIs: @octane-xplat/motion, Presence, motion.View, MotionConfig, useReducedMotion, useMotionValue, useMotionValueEvent, layout, layoutDependency, layoutId, LayoutGroup, layoutRoot, layoutAnchor, drag, SegmentedControl, Switch

## Starting point

An Octane Xplat app with the motion package installed and a working screen.
The live reference is the Motion patterns showcase in the harness app —
`bun run dev:web`, `bun run dev:ios`, or `bun run dev:android`, then
Apps → Motion patterns → Activity overview.
The experimental macOS layout fixture is `packages/motion/tests/layout.macos.tsx`.

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

- AC6: Animate resizing and keyed reordering from the last presented position, preserve nested child size during parent scaling, retarget without jumps, and avoid treating scrolling as a layout change. Reduced motion settles directly.

- AC7: Hand off a shared element between components, crossfade retained content, reverse during animation without a position jump, isolate identical shared IDs in independent groups, and settle directly under reduced motion.

- AC8: Expand a rounded card inside a scrolled container, preserve numeric corners under uniform scale, transfer shared geometry after scrolling, and keep root-relative child movement anchored.
- AC9: Start dragging during a layout animation, move the host or an ancestor during the drag, continue pointer movement without a position jump, and release or dispose without retaining the layout block.

## Documentation

- AC1: [Switch views with a wait-style swap](../../../docs/app/animation-gestures.md#switch-views-with-a-wait-style-swap) and the [maintained showcase](../../../packages/demos/src/MotionPatterns.tsrx); exiting content leaves input and the accessibility tree through [retained presence](../../../docs/app/animation-gestures.md#retain-content-through-exit).
- AC2: [Reveal a bounded group](../../../docs/app/animation-gestures.md#reveal-a-bounded-group) and the showcase's Reveal results focused view.
- AC3: [Update a total](../../../docs/app/animation-gestures.md#update-a-total) and [reduced-motion lifecycle](../../../docs/app/animation-gestures.md#reduced-motion-and-lifecycle).
- AC4: [Rotate supporting copy](../../../docs/app/animation-gestures.md#rotate-supporting-copy).
- AC5: [Reduced motion and lifecycle](../../../docs/app/animation-gestures.md#reduced-motion-and-lifecycle) plus the [motion leaf limits](../../../docs/testing/known-limits.md#motion-leaf).

- AC6: [Animate size and position changes](../../../docs/app/animation-gestures.md#layout-animations) and the [maintained mobile layout probe](../../../examples/probes/motion-layout.mobile.tsrx); browser geometry coverage lives in `tools/visual/src/motion-layout.test.web.ts`.

- AC7: [Move an element between components](../../../docs/app/animation-gestures.md#move-an-element-between-components), the [shared-element probe](../../../examples/probes/motion-shared.tsrx), and the maintained browser/AppKit geometry tests.

- AC8: [Steady corners](../../../docs/app/animation-gestures.md#keep-corners-steady-while-a-card-expands), the root/anchor examples in the layout guide, and `tools/visual/src/motion-containers.test.web.ts`, `packages/motion/tests/containers.mobile.tsrx`, and AppKit runtime geometry tests. Native nonuniform corner and blur limits remain explicit.
- AC9: [Keep dragging through layout changes](../../../docs/app/animation-gestures.md#keep-dragging-through-layout-changes), the browser pointer-dispatch test, the native container probe, AppKit callback/geometry checks, and host-neutral drag/projection tests. Handler dispatch is not OS input evidence.
