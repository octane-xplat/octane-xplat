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

- AC4: ScrollableArea retains declared test identity, accessible visibility, name precedence, hint and portable value metadata on the current native viewport. Route native prop updates/removal to help/value descriptions without rewriting scroll content, native role/value or clip position. Keep unsupported arbitrary roles/state/live announcements and pull-to-refresh explicit; forwarding/source cases do not qualify native hierarchy/navigation or packaged consumers.

- AC5: Keep geometry observation owned by the current viewport across partial setup, replacement and teardown. Release acquired/late native handles and retire queued callbacks without blocking later owners, preserve retry after failed layout/positioning/notification, reject invalid dimensions before native writes and commit initial-position readiness only after geometry/positioning succeeds. Explain source-vs-native evidence and the separate pull-to-refresh gap.

## Documentation

- AC1: [Logical scroll guide](../../../docs/app/primitives.md#logical-scroll-offsets-on-appkit), [conversion helper](../../../packages/ui/src/components/layout/scrollable-area-logical.macos.ts) and [authored cases](../../../packages/ui/src/components/layout/scrollable-area-appkit.mobile.test.tsrx).
- AC2: The same guide/tests cover direction changes, stable handles and padding.
- AC3: The guide and [target note](../exploration.md#operational-evidence) record scope, exact deferred commands and remaining native gates.

- AC4: [Viewport metadata guide](../../../docs/app/primitives.md#macos-scrolling-and-refresh), [native description mapping](../../../packages/macos-renderer/README.md#scroll-viewport-accessibility-descriptions), one added [UI source case](../../../packages/ui/src/components/layout/scrollable-area-appkit.mobile.test.tsrx), one [real native prop-branch case](../../../packages/macos-renderer/test/scroll-accessibility.test.ts), [manual fixture](../../../examples/probes/scroll-metadata.macos.tsrx) and [target note](../exploration.md#operational-evidence). Native VoiceOver hierarchy/descendant navigation, updates/removal, identity and packing require separate target qualification.

- AC5: [AppKit scrolling](../../../docs/app/primitives.md#macos-scrolling-and-refresh), [renderer ownership](../../../packages/macos-renderer/README.md#own-scroll-geometry-observation), [nine additional source/caller cases](../../../packages/macos-renderer/test/scroll-view.test.ts), [skill](../../skills/octane-xplat/references/primitives/layout.md#appkit-scroll-offsets) and [target note](../exploration.md#operational-evidence). Models, compiler/native notification/attachment/resize/elasticity/memory and installed consumers require separate execution evidence/unqualified; pull-to-refresh is still unsupported.
