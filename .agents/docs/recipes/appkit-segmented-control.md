# Switch views with AppKit segments

ID: appkit-segmented-control
Targets: macos
Related APIs: SegmentedControl, SegmentedControlItem

## Starting point

An experimental native AppKit app using `@octane-xplat/ui` and its stylesheet.
This recipe does not qualify motion transitions or claim presentation parity.

## Requirements

Choose one of a short set of inbox filters or views using the same selection
contract as other targets. Distinguish implemented handlers from actual OS input.

## Acceptance criteria

- AC1: Options and child items support controlled and uncontrolled selection, disabled options, read-only groups and fill layout. Icon-only segments retain accessible labels.
- AC2: Physical keyboard navigation stays in the focused control's window, skips disabled/read-only items, follows live native subview order, supports Home/End and reverses horizontal arrows in RTL. Enter/Space use the renderer activation path. Unrelated responders and shortcuts remain untouched.
- AC3: Radio-button/group accessibility roles and checked values reach AppKit; actual VoiceOver navigation, selection announcement and disabled behavior are qualified separately from bridge readback.

## Documentation

- AC1: [AppKit segments](../../../docs/app/components.md#appkit-segmented-control), [maintained probe](../../../examples/probes/segmented-control.macos.tsrx) and the sandbox's [child-item example](../../../apps/astryx-sandbox/src/examples/segmented/SegmentedControlItemBasic.tsrx). Gap: actual AppKit control rendering and selection require execution evidence.
- AC2: [AppKit segments](../../../docs/app/components.md#appkit-segmented-control) and [key adapter regressions](../../../packages/ui/src/components/actions/segmented-control-keys.macos.test.ts). Gap: OS keys, Tab entry, focus visibility and repeated mount/unmount require runtime qualification.
- AC3: [AppKit segments](../../../docs/app/components.md#appkit-segmented-control) and [renderer accessibility regressions](../../../packages/macos-renderer/test/checkbox-accessibility.test.ts). Gap: VoiceOver and real accessibility delivery require execution evidence.
