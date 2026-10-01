ID: navigation-shell
Targets: web, ios, android, macos
Related APIs: AppShell, TopNav, SideNav, MobileNav, MobileNavToggle, NavIcon, NavHeadingMenu, NavHeadingMenuItem, TabList, Tab, TabMenu, NavigationMenu

# Build a responsive navigation shell

## Starting point

An Octane-xplat app with `@octane-xplat/ui` installed and routes configured. This recipe covers the navigation frame and its menus; route registration and stack behavior are in the [navigation guide](../docs/navigation.md).

## Requirements

The app has top-level navigation, a collapsible side rail, a mobile drawer, and a tab strip that can represent links or control page panels.

## Acceptance criteria

- AC1: The reader can compose `AppShell`, `TopNav`, and `SideNav` with a banner, page content, selected links, and an accessible label.
- AC2: The reader can configure the breakpoint and controlled or uncontrolled drawer state, and can replace the automatic drawer with `MobileNav`.
- AC3: The reader can build a heading menu and choose between navigation `TabList` links and a controlled `role="tablist"` with caller-owned panels.
- AC4: The reader can verify link activation, selected state, disabled items, and keyboard menu behavior on web, with native route activation and accessibility state described separately.

## Documentation

- AC1: [Compose the application frame](../docs/navigation-ui.md#compose-the-application-frame) and the maintained [component harness](../packages/demos/src/ComponentsDemo.tsrx).
- AC2: [Compose the application frame](../docs/navigation-ui.md#compose-the-application-frame) documents automatic and custom mobile navigation.
- AC3: [Choose navigation tabs or page tabs](../docs/navigation-ui.md#choose-navigation-tabs-or-page-tabs) shows both patterns and panel ownership.
- AC4: [Portable boundaries](../docs/navigation-ui.md#portable-boundaries) and the maintained [component harness](../packages/demos/src/ComponentsDemo.tsrx) identify web and native behavior.
