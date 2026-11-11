ID: drawer
Targets: web, ios, android, macos
Related APIs: @octane-xplat/ui, Drawer, DrawerProps, onOpenChange

# Add an optional navigation drawer

## Starting point

An Octane Xplat application with its target renderer and UI theme configured.

## Requirements

Add a usable navigation drawer using the common input owner on mobile, without installing a separate drawer
gesture plugin.

## Acceptance criteria

- AC1: The reader imports Drawer from UI and migrates the removed drawer package and platform-specific imports without app-direct plugin declarations.
- AC2: The reader composes accessible open/close controls, owns state through open/onOpenChange or defaultOpen, and receives user dismissal without callback echoes from prop updates.
- AC3: On iOS/Android, edge opening and drag closing work by default, with explicit gesture and reduced-motion configuration and target qualification limits described. Edge admission precedes movement; nested
  buttons retain taps, claimed drags suppress trailing activation, and extra
  pointers cancel without restarting the same contact cohort.
- AC4: On web/desktop, the documented panel subset remains explicit; on web, keyboard focus, Escape dismissal and return focus work.

## Documentation

- AC1: [Setup and migration](../../../docs/app/drawer.md#migrate-existing-drawers).
- AC2: [Add a side drawer](../../../docs/app/drawer.md) and the maintained [device demo](../../../packages/demos/src/DeviceDemo.mobile.tsrx).
- AC3: [Drawer configuration and limits](../../../docs/app/drawer.md), [implementation evidence](../native-drawer.md).
- AC4: [Drawer platform subset](../../../docs/app/drawer.md), [implementation evidence](../native-drawer.md).
