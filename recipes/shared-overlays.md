# Own shared temporary surfaces

ID: shared-overlays
Targets: web, ios, android, macos
Related APIs: Dialog, AlertDialog, BottomSheet, HoverCard, Lightbox, Carousel, ScrollableArea, Toast, ToastViewport, useToast, Overlay, Popover

## Starting point

A working app with a Screen and state for showing temporary content. Shared
in-window surfaces are distinct from the optional platform-native sheet leaf.
Use `Dialog` for modal content, `AlertDialog` for required decisions, and
`BottomSheet` for bottom-anchored content. `ToastViewport` owns toast routing;
`showToast(options)` and `useToast()` send notifications to a mounted viewport
or the fallback viewport. `HoverCard`, `Lightbox`, and `Carousel` provide
pointer/touch content patterns, while `ScrollableArea` replaces the older
`ScrollView` and `ScrollBox` names.

## Requirements

- Choose Dialog, AlertDialog, BottomSheet, Overlay, or Popover for modal,
  bottom, floating, or anchored content.
- Control visibility and distinguish user dismissal from programmatic removal.
- Own temporary content and its bindings through the declaring component.
- Pass data across native root boundaries and retain the app's theme.
- Use HoverCard for revealed content, Lightbox or Carousel for media, and
  ToastViewport for transient notifications; use ScrollableArea for scrolling.
- On macOS, account for inline-only Dialog/BottomSheet/Lightbox surfaces and
  the absence of a timed ToastViewport stack.

## Acceptance criteria

- AC1: The reader can render a shared surface inside a Screen and choose its presentation without importing a platform widget.
- AC2: Outside user dismissal updates app state through onOpenChange; setting isOpen to false or removing the declaring component does not report a user dismissal.
- AC3: Removing an open declaration releases its content and bindings; a pending open completion cannot revive it, and content updates do not accumulate host theme subscriptions.
- AC4: The reader can supply data to native content without relying on presenter context and knows that web portals retain context.
- AC5: The reader can choose the public shared component names and anatomy for modal surfaces, hover cards, media, scrolling, and toasts, including the platform-native sheet boundary and macOS implementation limits.

## Documentation

- AC1: [Surface selection](../docs/primitives.md#when-a-screen-needs-more), [conditional BottomSheet example](../docs/primitives.md#own-temporary-surfaces), and maintained [Overlay demo](../packages/demos/src/OverlayDemo.tsrx).
- AC2: [Visibility and dismissal](../docs/primitives.md#own-temporary-surfaces) and maintained [Overlay demo](../packages/demos/src/OverlayDemo.tsrx).
- AC3: [Ownership and cleanup](../docs/primitives.md#own-temporary-surfaces); renderer lifecycle examples in `packages/ui/src/overlay-lifecycle.mobile.test.ts` cover pending opens, closes, failures, and theme subscriptions.
- AC4: [Root boundaries](../docs/primitives.md#own-temporary-surfaces).
- AC5: [Shared component catalog](../docs/components.md#overlays) and maintained examples in [OverlayDemo](../packages/demos/src/OverlayDemo.tsrx), [ModalDemo](../packages/demos/src/ModalDemo.tsrx), and [ScrollBoxDemo](../packages/demos/src/ScrollBoxDemo.tsrx).
