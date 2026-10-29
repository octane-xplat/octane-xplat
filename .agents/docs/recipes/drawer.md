ID: drawer
Targets: web, ios, android, macos
Related APIs: @octane-xplat/drawer, Drawer, DrawerProps, onOpenChange

# Add an optional navigation drawer

## Starting point

An Octane Xplat application with its target renderer and UI theme configured.

## Requirements

Add a usable navigation drawer without requiring drawer plugins in applications
that use unrelated UI widgets.

## Acceptance criteria

- AC1: The reader installs the drawer package and migrates old UI root and platform-specific drawer imports without app-direct plugin declarations.
- AC2: The reader composes accessible open/close controls, owns state through open/onOpenChange or defaultOpen, and receives user dismissal without callback echoes from prop updates.
- AC3: On iOS/Android, edge opening and drag closing work by default, with explicit gesture and reduced-motion configuration and target qualification limits described.
- AC4: On web/desktop, the documented panel subset remains explicit; on web, keyboard focus, Escape dismissal and return focus work.

## Documentation

- AC1: [Setup and migration](../../../docs/app/drawer.md#migrate-existing-drawers).
- AC2: [Add a side drawer](../../../docs/app/drawer.md) and the maintained [device demo](../../../packages/demos/src/DeviceDemo.mobile.tsrx).
- AC3: [Drawer configuration and limits](../../../docs/app/drawer.md), [implementation evidence](../native-drawer.md).
- AC4: [Drawer platform subset](../../../docs/app/drawer.md), [implementation evidence](../native-drawer.md).
