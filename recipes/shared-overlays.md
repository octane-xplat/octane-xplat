# Own shared temporary surfaces

ID: shared-overlays
Targets: web, ios, android
Related APIs: Screen, Sheet, Overlay, Popover, open, onDismiss

## Starting point

A working app with a Screen and state for showing temporary content. Shared
in-window surfaces are distinct from the optional platform-native sheet leaf.

## Requirements

- Choose Sheet, Overlay, or Popover for bottom, floating, or anchored content.
- Control visibility and distinguish user dismissal from programmatic removal.
- Own temporary content and its bindings through the declaring component.
- Pass data across native root boundaries and retain the app's theme.

## Acceptance criteria

- AC1: The reader can render a shared surface inside a Screen and choose its presentation without importing a platform widget.
- AC2: Outside user dismissal updates app state through onDismiss; setting open to false or removing the declaring component does not report a user dismissal.
- AC3: Removing an open declaration releases its content and bindings; a pending open completion cannot revive it, and content updates do not accumulate host theme subscriptions.
- AC4: The reader can supply data to native content without relying on presenter context and knows that web portals retain context.

## Documentation

- AC1: [Surface selection](../docs/primitives.md#when-a-screen-needs-more), [conditional Sheet example](../docs/primitives.md#own-temporary-surfaces), and maintained [Overlay demo](../packages/demos/src/OverlayDemo.tsrx).
- AC2: [Visibility and dismissal](../docs/primitives.md#own-temporary-surfaces) and maintained [Overlay demo](../packages/demos/src/OverlayDemo.tsrx).
- AC3: [Ownership and cleanup](../docs/primitives.md#own-temporary-surfaces); renderer lifecycle examples in `packages/ui/src/overlay-lifecycle.mobile.test.ts` cover pending opens, closes, failures, and theme subscriptions.
- AC4: [Root boundaries](../docs/primitives.md#own-temporary-surfaces).
