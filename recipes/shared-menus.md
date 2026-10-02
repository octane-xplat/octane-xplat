# Add shared action menus and breadcrumb overflow

ID: shared-menus
Targets: web, ios, android, macos
Related APIs: DropdownMenu, ContextMenu, Breadcrumbs, DropdownMenuCheckboxItem, DropdownMenuRadioGroup, DropdownMenuSubMenu, BreadcrumbMenuItem

## Starting point

An Octane Xplat app that imports shared UI components and can hold a selected
value with `useState`. This recipe covers shared menus; the optional OS-native
context-menu leaf has its own recipe.

## Requirements

- Keep existing data-driven actions while supporting compound menu content.
- Offer independent checkbox choices, a named single-choice radio group,
  dividers, and nested actions with explicit disabled and close behavior.
- Preserve caller-owned state and shared layer dismissal/positioning.
- Keep essential actions available on touch targets and in breadcrumb overflow.

## Acceptance criteria

- AC1: Legacy action arrays and compound menu parts use the same selection and disabled contracts across the menu families.
- AC2: Checkbox and radio choices report requested values without replacing controlled state; checkbox stays open and radio closes by default, with configurable close behavior.
- AC3: On web, each submenu owns its keyboard navigation, ignores composing input, closes before its parent on Escape, and returns focus only after accepted closure. Controlled close requests retain the surface until accepted.
- AC4: Touch users have a visible context trigger and a named submenu Back action; hidden breadcrumb ancestors retain their actions in an accessible overflow menu. Native hardware input and OS accessibility limits are explicit.
- AC5: Shared props and menu part exports resolve on web, mobile, and macOS without adding UI dependencies or separate layer dismissal/positioning logic.

## Documentation

- AC1: [Start with actions](../docs/menus.md#start-with-actions), [Context actions on touch and keyboard](../docs/menus.md#context-actions-on-touch-and-keyboard), and [component demo](../packages/demos/src/ComponentsDemo.tsrx).
- AC2: [Add choices and submenus](../docs/menus.md#add-choices-and-submenus) and [Own open state](../docs/menus.md#own-open-state).
- AC3: [Own open state](../docs/menus.md#own-open-state) and [Context actions on touch and keyboard](../docs/menus.md#context-actions-on-touch-and-keyboard).
- AC4: [Context actions on touch and keyboard](../docs/menus.md#context-actions-on-touch-and-keyboard) and [Keep a long breadcrumb trail usable](../docs/menus.md#keep-a-long-breadcrumb-trail-usable).
- AC5: [Add choices and submenus](../docs/menus.md#add-choices-and-submenus) and [Own open state](../docs/menus.md#own-open-state).
