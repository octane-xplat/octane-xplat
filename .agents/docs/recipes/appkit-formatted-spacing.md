# Space formatted text on AppKit

ID: appkit-formatted-spacing
Targets: macos
Related APIs: formattedstring, span

## Starting point

A caption mixes spaced text and a span using its font's default spacing.

## Acceptance criteria

- AC1: Finite numeric spacing inherits through logical runs, accepts negative values and permits zero/normal resets. Reject invalid authored values.
- AC2: Rich hosts pass computed spacing or inline fallback into composition. Removed overrides and reparented runs use the current ancestor.
- AC3: Nonzero spacing reaches native attributed runs; resets omit an explicit kern attribute. Distinguish source cases from CSS delivery, native shaping, measurement and pixel evidence.
- AC4: Rich paragraphs receive host computed line height with inline fallback; normal/removal clears fixed paragraph metrics. Source evidence does not prove native multiline measurement.

## Documentation

- AC1: [Renderer contract and example](../../../packages/macos-renderer/README.md#apply-stylesheets) and [authored source cases](../../../packages/macos-renderer/test/formatted-text.test.ts). Tests unrun.
- AC2: The same source cases cover host defaults, removal and reparenting.
- AC3: [Target note](../exploration.md#operational-evidence) records the native attribute policy and exact deferred checks. No native glyph or layout result is claimed.

- AC4: [Renderer line-height contract](../../../packages/macos-renderer/README.md#apply-stylesheets), authored host/paragraph source cases and [deferred-check note](../exploration.md#operational-evidence). Tests unrun.
