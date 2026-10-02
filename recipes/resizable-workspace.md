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
- AC3: The reader can use `useResizable` with pixel or percentage sizing, bounds, snapping, collapse, and a matching `ResizeHandle` direction.
- AC4: The reader can save and restore sizes and identify the AppKit in-memory limitation separately from web, iOS, and Android persistence.

## Documentation

- AC1: [Add toolbar actions and responsive overflow](../docs/app/navigation-ui.md#add-toolbar-actions-and-responsive-overflow) documents toolbar slots and focus behavior.
- AC2: [Add toolbar actions and responsive overflow](../docs/app/navigation-ui.md#add-toolbar-actions-and-responsive-overflow) covers item measurement and overflow callbacks.
- AC3: [Resize a region](../docs/app/navigation-ui.md#resize-a-region) includes a complete example and region controls.
- AC4: [Resize a region](../docs/app/navigation-ui.md#resize-a-region) records platform persistence and desktop implementation coverage.
