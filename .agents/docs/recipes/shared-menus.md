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

- AC7: AppKit menu surfaces register current rows per popup and use native order for wrapping arrows, Home/End and prefix/manual activation, with RTL submenu intents and current disabled/detached guards. Initial focus waits for attachment; release row/Tab/window ownership. Preserve nested editor/IME/modified keys and existing Escape/accepted-close ownership. Keep trigger-opening source intent, owned Tab-return intent and native evidence distinct.

- AC8: Closed AppKit dropdown Down/Up requests first/last-row opening on the existing Button host, retaining controlled pending intent and rejecting current blocked/open/descendant/IME/modified/prevented keys. Owned subscriptions compose with prop handlers on the shared monitor, enter discrete scope and release on ref/node destruction. Preserve Button ref/ID/layout and ordinary activation; report native evidence separately.

- AC9: Owned AppKit dropdown/submenu Tab resolves a current same-window trigger neighbor, requests close without eager focus, and consumes the key while controlled owners decide. Nested return refs follow accepted ancestor visibility. AppKit layer restoration uses explicit live target windows, stable field owners and detached/hidden/moved-fallback guards. Keep originless/unowned fallback and actual native evidence explicit.

- AC10: AppKit ContextMenu Shift+F10 or plain Context Menu key opens from a valid owned focused host, preserving disabled/open/IME/modifier/prevention guards and controlled state. Keyboard/visible-trigger invokers drive ordinary and Tab return; reject moved/hidden/detached origins, preserve primitive trigger content and current label/state metadata, and document originless/native fallback plus pointer and hardware-key qualification limits.

- AC11: AppKit secondary-click and plain Control-primary-click request shared context opening through the nearest live owned scope; pointer modality is observed before consumption, current native invoker return and disabled/teardown guards are explicit, and source evidence stays separate from native mouse/focus/AX qualification.

- AC12: AppKit menu surfaces/rows map to native menu roles and current text row titles; selected/expanded protocol getters follow current parent state. Link text labels reach the host on updates/removal. Keep query metadata distinct from checked marks, state announcements/relationships and native AX/VoiceOver qualification.

- AC13: AppKit menu surfaces capture focused-row/window ownership, repair removed/disabled/hidden rows to the previous position or retained container, and keep selection manual. Preserve unrelated/nested-editor/other-window responders, cancel stale scope/teardown intent, coalesce row changes and release claims/observers. Distinguish policy/object-driver evidence from native ref/responder/fallback/notification/IME/layer/AX qualification.

- AC14: AppKit dropdown trigger, arrow and dismissal requests share current props, local open intent, attachment and reentry ownership. Preserve controlled rejection and original local state across mode changes; apply current own/button/group disablement and loading/interruptible opening policy without hiding an existing menu for loading. Retain the claim across callback-driven button-ref replacement, release it after errors without local rollback, and reject detached callbacks. Keep existing Button error, menu focus, keyboard, accepted-close and Tab-return paths, and distinguish source cases from native evidence.

## Documentation

- AC1: [Start with actions](../../../docs/app/menus.md#start-with-actions), [Add choices and submenus](../../../docs/app/menus.md#add-choices-and-submenus), [UI API migrations](../../../docs/app/ui-api-migrations.md#selection-and-menu-rows), [Context actions on touch and keyboard](../../../docs/app/menus.md#context-actions-on-touch-and-keyboard), and [component demo](../../../packages/demos/src/ComponentsDemo.tsrx).
- AC2: [Add choices and submenus](../../../docs/app/menus.md#add-choices-and-submenus), [Own open state](../../../docs/app/menus.md#own-open-state), and [UI API migrations](../../../docs/app/ui-api-migrations.md#selection-and-menu-rows).
- AC3: [Own open state](../../../docs/app/menus.md#own-open-state) and [Context actions on touch and keyboard](../../../docs/app/menus.md#context-actions-on-touch-and-keyboard).
- AC4: [Context actions on touch and keyboard](../../../docs/app/menus.md#context-actions-on-touch-and-keyboard) and [Keep a long breadcrumb trail usable](../../../docs/app/menus.md#keep-a-long-breadcrumb-trail-usable).
- AC5: [Add choices and submenus](../../../docs/app/menus.md#add-choices-and-submenus) and [Own open state](../../../docs/app/menus.md#own-open-state).

- AC6: [AppKit menu host guide](../../../docs/app/menus.md#appkit-menu-host-state), [authored AppKit inline-popup cases](../../../packages/ui/src/menu-family.macos.mobile.test.tsrx) and [target note](../parity/appkit-progress.md#appkit-menu-host-prerequisites). Cases remain unrun; native input/ref/popup/AX qualification is deferred.

- AC7: [AppKit surface keyboard guide](../../../docs/app/menus.md#navigate-appkit-menu-surfaces), [authored policy cases](../../../packages/ui/src/menu-keyboard.macos.mobile.test.tsrx), appended [fake-window wiring cases](../../../packages/ui/src/menu-family.macos.mobile.test.tsrx), [maintained target fixture](../../../examples/probes/menu-keyboard.macos.tsrx) and [target note](../parity/appkit-progress.md#appkit-menu-surface-keyboard-ownership). All cases/fixture remain unrun.

- AC8: [Trigger arrow guide](../../../docs/app/menus.md#open-an-appkit-dropdown-with-arrows), appended dispatcher/bridge/menu-family source cases, [renderer ownership contract](../../../packages/macos-renderer/README.md#composed-control-key-ownership), maintained menu-keyboard fixture and [target note](../parity/appkit-progress.md#appkit-dropdown-trigger-arrow-ownership). All authored cases and native checks remain deferred.

- AC9: [Owned Tab guide](../../../docs/app/menus.md#leave-an-owned-appkit-dropdown-with-tab), authored layer-focus/menu-return/policy/menu-family cases and [target note](../parity/appkit-progress.md#appkit-owned-menu-tab-return-intent). Cases remain unrun; maintained menu fixture describes the interaction without synthesizing OS keys.

- AC10: [Context keyboard guide](../../../docs/app/menus.md#open-appkit-context-actions-from-the-keyboard), three origin-policy/three appended menu-family source cases, maintained target fixture and [target note](../parity/appkit-progress.md#appkit-context-menu-keyboard-and-invoker-return). Cases and native checks remain deferred. The [dedicated key guide](../../../docs/app/menus.md#use-a-dedicated-context-menu-key-on-appkit), two renderer cases and two additional parameterized menu cases now cover source normalization/intent without hardware proof.

- AC11: [Pointer context guide](../../../docs/app/menus.md#open-appkit-context-actions-with-the-pointer), renderer context-pointer/context-subscriptions cases, appended origin/modality/menu-family cases, maintained menu-keyboard fixture and [target note](../parity/appkit-progress.md#appkit-context-pointer-ownership). All twelve new cases and native verification remain deferred.

- AC12: [Menu accessibility metadata](../../../docs/app/menus.md#appkit-menu-accessibility-metadata), renderer contract, two renderer/one inline-popup source cases and [target note](../parity/appkit-progress.md#appkit-menu-role-and-state-query-metadata). All three cases and native checks remain unrun.

- AC13: [Dynamic menu guide](../../../docs/app/menus.md#keep-focus-owned-when-appkit-menu-rows-change), private menu-focus owner/row notifications, five policy/three surface/one appended TabMenu cases, [extended fixture](../../../examples/probes/menu-keyboard.macos.tsrx), skill and [target note](../parity/appkit-progress.md#appkit-menu-row-focus-repair). All cases/fixture/native qualification remain unrun.

- AC14: [Current dropdown guide](../../../docs/app/menus.md#appkit-menu-host-state), seven new [inline-popup cases](../../../packages/ui/src/menu-family.macos.mobile.test.tsrx), [target fixture](../../../examples/probes/menu-keyboard.macos.tsrx), [AppKit leaf](../../../packages/ui/src/DropdownMenu.macos.tsrx), Octane primitive reference and [target note](../parity/appkit-progress.md#appkit-dropdown-current-open-intent). Cases and fixture remain unrun; the fixture hook directly dispatches only the ordinary trigger and synthesizes no OS input.
