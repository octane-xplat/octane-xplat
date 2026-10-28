# Retain native route controls

ID: native-navigation-retention
Targets: ios, android, macos
Related APIs: router.back, router.refresh, router.dismiss, RouteOutlet, useRouter, ScrollableArea, ScrollableAreaHandle, TextInputHandle

## Starting point

A canonical router and an owned native route outlet, with scrollable content
and an editable field in a screen.

## Requirements

Keep each retained entry's native controls and scroll position, preserve a
modal's presenter and prevent obsolete preparation from changing current focus.

## Acceptance criteria

- AC1: Back restores the retained entry's controls and scroll position rather
  than copying another entry's state. Removed entries release their control refs.
- AC2: A routed modal scrolls independently and preserves the presenter's
  viewport after dismissal. Refresh preserves the current native controls and
  scroll; a superseded loader cannot mount later or steal focus.
- AC3: Application code uses portable scroll and text handles. Native focus
  remains platform/application policy; browser heading/hash behavior, physical
  input and assistive-technology qualification are distinct.

## Documentation

- AC1: [Retained native controls](../../../docs/app/navigation.md#retained-native-controls)
  explains entry ownership; [qualification](../navigation-checks.md)
  distinguishes actual hosts from object-driver contracts.
- AC2: [Retained native controls](../../../docs/app/navigation.md#retained-native-controls)
  and [modal flows](../../../docs/app/navigation.md#present-a-route-modally)
  describe presenter retention. Maintained protocol:
  `packages/ui/tests/route-retention-example.tsrx`.
- AC3: [Move a scroll viewport](../../../docs/app/primitives.md#move-a-scroll-viewport)
  and [retained native controls](../../../docs/app/navigation.md#retained-native-controls)
  show the public handles. Installed-consumer checks compile both examples;
  the qualification record names each executed target and its limits.


AppKit AC3 source follow-up: the [scrolling guide](../../../docs/app/primitives.md#macos-scrolling-and-refresh)
now describes top-down offsets across native coordinate orientations, fitting
content and animator fallback. ScrollableArea, VirtualList and chat share a
native offset helper using the generated NSView.flipped property; measurement
uses the same property. [Geometry regression source](../../../packages/ui/src/appkit-scroll-geometry.mobile.test.ts)
and [viewport object-driver cases](../../../packages/ui/src/scrollable-area-appkit.mobile.test.tsrx)
are authored but unrun. Route retention, actual scroll/animation/focus and
packaging remain separate qualification gates.
