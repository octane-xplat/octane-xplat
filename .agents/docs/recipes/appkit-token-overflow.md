# Collapse AppKit token rows using native geometry

ID: appkit-token-overflow
Targets: macos
Related APIs: Tokenizer, tokenOverflowBehavior, renderToken

## Starting point

A compact tag/people field like the sandbox token-entry examples, with long
labels and embedded actions. AppKit support remains experimental.

## Acceptance criteria

- AC1: Use a native-clipped flex viewport with an outside counter. Separate collapsed-row measurement refs from expanded layer token copies. Convert current native rectangles into viewport coordinates, count partial/whole clipping on both edges and preserve RTL/nonzero bounds behavior.
- AC2: Guard missing/foreign/detached/nonfinite/zero-size geometry; keep the last count until layout is ready. Recompute on current keyed selection, focus/overflow-mode changes and native layout. Reclaim the counter if every token fits without it, and wait through stale layout until its space is published. Retired layout work must not mutate after teardown.
- AC3: Record the clipping renderer prerequisite and distinguish source/fake geometry from native drawing/Mason sizing/resize/fonts/RTL/focus/IME/hit-testing/AX/package evidence. Keep existing inline-layer hosting limitations explicit.

## Documentation

- AC1: [Guide](../../../docs/app/search-selection.md#collapse-appkit-token-rows-with-native-geometry), [target leaf](../../../packages/ui/src/components/forms/Tokenizer.macos.tsrx), [native geometry](../../../packages/ui/src/components/forms/tokenizer-overflow.macos.ts), eight [authored geometry cases](../../../packages/ui/src/components/forms/tokenizer-overflow.macos.test.ts), five [object-driver cases](../../../packages/ui/src/components/forms/tokenizer-overflow.macos.mobile.test.tsrx) and [manual fixture](../../../examples/probes/tokenizer-overflow.macos.tsrx).
- AC2: The same source/cases cover current identities, incomplete layout, resizing, counter reclamation/stale notifications and teardown. Fake geometry does not prove actual native layout ordering.
- AC3: [Target note](../exploration.md#operational-evidence) records exact deferred commands, [clipping prerequisite](appkit-overflow-clipping.md), and remaining qualification/inline-layer limits.
