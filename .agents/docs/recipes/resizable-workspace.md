ID: resizable-workspace
Targets: web, ios, android, macos
Related APIs: Toolbar, OverflowList, useResizable, ResizeHandle, ResizableConfig, pixel, percent

# Build a responsive resizable workspace

## Starting point

An Octane-xplat app with `@octane-xplat/ui` installed. The page has a toolbar, actions that may not fit in a narrow row, and one or more panels whose sizes users can adjust.

## Requirements

The reader can preserve useful actions during overflow, resize or collapse panels, and understand which persistence behavior applies to each target.

## Acceptance criteria

- AC1: The reader can place controls in toolbar slots, label the toolbar, and choose the keyboard orientation.
- AC2: The reader can render overflow items, tune the visible count and collapse direction, and handle membership changes.
- AC3: The reader can use `useResizable` with dip (CSS pixel on web) numeric sizes, explicit `Npx`/`N%` strings, bounded percentages, snapping, collapse, and a matching `ResizeHandle` direction. Stack spacing tokens remain 4-dip steps.
- AC4: The reader can save and restore sizes and identify the AppKit in-memory limitation separately from web, iOS, and Android persistence.

- AC5: AppKit Toolbar forwards its current label and toolbar role to the retained host, and the renderer maps it to AXToolbar without making the container an action or Tab target. Preserve slots, ordinary child actions and layout orientation. Keep discrete-action focus source, mixed/stock-control roving gaps, current AX orientation metadata and actual native input/VoiceOver/installed evidence separate.

- AC6: AppKit Toolbar preserves slot/control/local state across axis changes and owns manual discrete-action focus in native child order: axis arrows and Home/End, no activation, current hidden/disabled/order/window refresh, one action entry and guarded native focus. Preserve modified/composing/prevented events, editor/adjustable/nested-composite input and natural stops. Capture observer/remover and Tab leases, retire before effects, release late handles and attempt remaining cleanup after failures. Record missing capability behavior, mixed/stock-control implementation gaps, current AX orientation metadata and actual native qualification separately.

## Documentation

- AC1: [Add toolbar actions and responsive overflow](../../../docs/app/navigation-ui.md#add-toolbar-actions-and-responsive-overflow) documents toolbar slots and focus behavior.
- AC2: [Add toolbar actions and responsive overflow](../../../docs/app/navigation-ui.md#add-toolbar-actions-and-responsive-overflow) covers item measurement and overflow callbacks.
- AC3: [Resize a region](../../../docs/app/navigation-ui.md#resize-a-region) includes a complete example and region controls, and [UI API migrations](../../../docs/app/ui-api-migrations.md#explicit-units) summarizes layout and token units.
- AC4: [Resize a region](../../../docs/app/navigation-ui.md#resize-a-region) records platform persistence and desktop implementation coverage.

- AC5: [Toolbar guide](../../../docs/app/navigation-ui.md#add-toolbar-actions-and-responsive-overflow), [renderer contract](../../../packages/macos-renderer/README.md#named-toolbar-hosts), one new [renderer VM case](../../../packages/macos-renderer/test/common-control-accessibility.test.ts), one new [leaf source case](../../../packages/ui/src/components/layout/toolbar.macos.mobile.test.tsrx), [manual fixture](../../../examples/probes/toolbar.macos.tsrx), Octane reference and [target note](../../../tools/platform-qualification/evidence/appkit-progress-2026-10-30.md#appkit-toolbar-role-prerequisite). All cases/fixture remain unrun; native keyboard support is not inferred from the role.

- AC6: [Current toolbar guide](../../../docs/app/navigation-ui.md#add-toolbar-actions-and-responsive-overflow), [private owner](../../../packages/ui/src/components/layout/toolbar-focus.macos.ts), nine new [authored policy cases](../../../packages/ui/src/components/layout/toolbar-focus.macos.mobile.test.ts), two new [leaf wiring/state cases](../../../packages/ui/src/components/layout/toolbar.macos.mobile.test.tsrx), [manual fixture](../../../examples/probes/toolbar.macos.tsrx), [Octane reference](../../skills/octane-xplat/references/primitives.md#appkit-toolbar-action-focus) and [target note](../../../tools/platform-qualification/evidence/appkit-progress-2026-10-30.md#appkit-toolbar-discrete-action-focus-and-stable-slots). All eleven new cases and native/installed checks remain unrun; the fixture hook only records mounting.
