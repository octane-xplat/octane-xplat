# Animate a changing text label

ID: rolling-text
Targets: web, ios, android, macos
Related APIs: @octane-xplat/rolling-text, RollingText, RollingTextProps

## Starting point

An existing Xplat app has a formatted counter or status value. The label is
one line; this workflow does not format numbers or add a text input.

## Requirements

Animate changed text while preserving the current accessible name, latest
updates, reduced-motion preferences, and cleanup. Distinguish package and
property checks from actual OS preference and visual qualification.

## Acceptance criteria

- AC1: Render an initially settled formatted value; use grapheme/word units, direction, timing, interrupt/latest policies, and empty/equal values without corrupting text.
- AC2: Expose the latest accessible name during queued playback, hide outgoing glyphs, settle the latest value when reduced motion becomes active, and stop owned work on disposal.
- AC4: Native segmentation initializes inside the leaf without app-owned polyfills; web retains its built-in implementation.
- AC3: Configure one-line text styles and recognize platform support and qualification limits, including the real live OS preference gate on macOS.

## Documentation

- AC1: [Basic example and options](../../../packages/rolling-text/README.md#options), [maintained counter](../../../packages/rolling-text/examples/RollingTextDemo.tsrx).
- AC2: [Accessible name](../../../packages/rolling-text/README.md#what-screen-readers-hear), [options](../../../packages/rolling-text/README.md#options), [macOS qualification](../../../packages/rolling-text/UPSTREAM.md#macos-qualification).
- AC3: [Limits](../../../packages/rolling-text/README.md#limits), [macOS text styles](../../../packages/rolling-text/README.md#macos-text-styles), [macOS qualification](../../../packages/rolling-text/UPSTREAM.md#macos-qualification).

- AC4: [Native segmentation](../../../packages/rolling-text/README.md#native-text-segmentation), [isolated bundle check](../../../packages/rolling-text/tests/intl.mjs).
