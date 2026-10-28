# Seek AppKit content from its logical start

ID: appkit-logical-scroll
Targets: macos
Related APIs: ScrollableArea, useScrollableArea, InternationalizationProvider

## Starting point

An LTR or RTL viewport with inline scrolling and caller-owned direction.

## Acceptance criteria

- AC1: Public inline seek/state count from logical start; RTL mirrors physical clip x across the scrollable range. Clamp valid seeks, ignore invalid/missing axes and preserve the other axis. Internal physical callers retain their coordinate contract.
- AC2: Direction changes remeasure start/end state without requiring a scroll event or replacing the handle. Inline-start/end padding maps to the appropriate physical edges.
- AC3: Keep source/fake geometry separate from actual RTL layout, initial clip position, OS scrolling/elasticity, animation and packaging qualification.

## Documentation

- AC1: [Logical scroll guide](../../../docs/app/primitives.md#logical-scroll-offsets-on-appkit), [conversion helper](../../../packages/ui/src/scrollable-area-logical.macos.ts) and [authored cases](../../../packages/ui/src/scrollable-area-appkit.mobile.test.tsrx). Tests unrun.
- AC2: The same guide/tests cover direction changes, stable handles and padding.
- AC3: The guide and [target note](../parity/appkit-progress.md#logical-appkit-inline-scroll-offsets) record scope, exact deferred commands and remaining native gates.
