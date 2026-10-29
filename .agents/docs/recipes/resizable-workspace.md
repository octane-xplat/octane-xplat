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

- AC5: AppKit Toolbar forwards its current label and toolbar role to the retained host, and the renderer maps it to AXToolbar without making the container an action or Tab target. Preserve slots, ordinary child actions and layout orientation. Keep toolbar roving keys/orientation AX metadata implementation and actual native input/VoiceOver/installed evidence separate.

## Documentation

- AC1: [Add toolbar actions and responsive overflow](../../../docs/app/navigation-ui.md#add-toolbar-actions-and-responsive-overflow) documents toolbar slots and focus behavior.
- AC2: [Add toolbar actions and responsive overflow](../../../docs/app/navigation-ui.md#add-toolbar-actions-and-responsive-overflow) covers item measurement and overflow callbacks.
- AC3: [Resize a region](../../../docs/app/navigation-ui.md#resize-a-region) includes a complete example and region controls, and [UI API migrations](../../../docs/app/ui-api-migrations.md#explicit-units) summarizes layout and token units.
- AC4: [Resize a region](../../../docs/app/navigation-ui.md#resize-a-region) records platform persistence and desktop implementation coverage.

- AC5: [Toolbar guide](../../../docs/app/navigation-ui.md#add-toolbar-actions-and-responsive-overflow), [renderer contract](../../../packages/macos-renderer/README.md#named-toolbar-hosts), one new [renderer VM case](../../../packages/macos-renderer/test/common-control-accessibility.test.ts), one new [leaf source case](../../../packages/ui/src/toolbar.macos.mobile.test.tsrx), [manual fixture](../../../examples/probes/toolbar.macos.tsrx), Octane reference and [target note](../parity/appkit-progress.md#appkit-toolbar-role-prerequisite). All cases/fixture remain unrun; native keyboard support is not inferred from the role.
