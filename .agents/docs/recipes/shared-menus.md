# Add shared action menus and breadcrumb overflow

ID: shared-menus
Targets: web, ios, android, macos
Related APIs: DropdownMenu, ContextMenu, Breadcrumbs, DropdownMenuCheckboxItem, DropdownMenuRadioGroup, DropdownMenuSubMenu, BreadcrumbMenuItem

## Starting point

An Octane Xplat app that imports shared UI components and can hold a selected
value with `useState`. This recipe covers shared menus; the optional OS-native
context-menu leaf has its own recipe.

## Requirements

- Use explicit action, link, section, separator, checkbox, radio-group, and
  submenu row kinds in data menus while supporting compound menu content.
- Offer independent checkbox choices, a named single-choice radio group,
  dividers, and nested actions with explicit disabled and close behavior.
- Preserve caller-owned state and shared layer dismissal/positioning.
- Keep essential actions available on touch targets and in breadcrumb overflow.

## Acceptance criteria

- AC1: Discriminated action, link, section, and separator rows, plus compound menu parts, preserve explicit selection, disabled, and navigation contracts across the menu families.
- AC2: Checkbox and radio choices report requested values without replacing controlled state; checkbox stays open and radio closes by default, with configurable close behavior. Action rows can stay open with `hasCloseOnSelect={false}`.
- AC3: On web, each submenu owns its keyboard navigation, ignores composing input, closes before its parent on Escape, and returns focus only after accepted closure. Controlled close requests retain the surface until accepted.
- AC4: Touch users have a visible context trigger and a named submenu Back action; hidden breadcrumb ancestors retain their actions in an accessible overflow menu. Native hardware input and OS accessibility limits are explicit.
- AC5: Shared props and menu part exports resolve on web, mobile, and macOS without adding UI dependencies or separate layer dismissal/positioning logic.

- AC6: AppKit disabled rows remove native activation and radio group state applies to hosts. Disabled dropdown/context/submenu surfaces suppress controlled open requests and report close intent; dropdowns include button/group disablement. Button refs/IDs and destructive tone survive host updates. Keep keyboard/secondary-click/AX implementation gaps and actual popup evidence explicit.

## Documentation

- AC1: [Start with actions](../../../docs/app/menus.md#start-with-actions), [Add choices and submenus](../../../docs/app/menus.md#add-choices-and-submenus), [UI API migrations](../../../docs/app/ui-api-migrations.md#selection-and-menu-rows), [Context actions on touch and keyboard](../../../docs/app/menus.md#context-actions-on-touch-and-keyboard), and [component demo](../../../packages/demos/src/ComponentsDemo.tsrx).
- AC2: [Add choices and submenus](../../../docs/app/menus.md#add-choices-and-submenus), [Own open state](../../../docs/app/menus.md#own-open-state), and [UI API migrations](../../../docs/app/ui-api-migrations.md#selection-and-menu-rows).
- AC3: [Own open state](../../../docs/app/menus.md#own-open-state) and [Context actions on touch and keyboard](../../../docs/app/menus.md#context-actions-on-touch-and-keyboard).
- AC4: [Context actions on touch and keyboard](../../../docs/app/menus.md#context-actions-on-touch-and-keyboard) and [Keep a long breadcrumb trail usable](../../../docs/app/menus.md#keep-a-long-breadcrumb-trail-usable).
- AC5: [Add choices and submenus](../../../docs/app/menus.md#add-choices-and-submenus) and [Own open state](../../../docs/app/menus.md#own-open-state).

- AC6: [AppKit menu host guide](../../../docs/app/menus.md#appkit-menu-host-state), [authored AppKit inline-popup cases](../../../packages/ui/src/menu-family.macos.mobile.test.tsrx) and [target note](../parity/appkit-progress.md#appkit-menu-host-prerequisites). Cases remain unrun; native input/ref/popup/AX qualification is deferred.
