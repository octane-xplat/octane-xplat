# Add actions and choices to a menu

Use `DropdownMenu` for a button that opens actions. Use `ContextMenu` for actions
on an existing piece of content. Both come from `@octane-xplat/ui` and use the
same menu parts on web, iOS, Android, and macOS.

## Start with actions

A menu item calls `onSelect` when chosen and closes the menu. Existing data
arrays still work:

```tsx
<DropdownMenu
	trigger={<Text>Actions</Text>}
	items={[
		{ key: 'rename', label: 'Rename', onSelect: rename },
		{ key: 'remove', label: 'Remove', disabled: true },
	]}
/>
```

`key` identifies a data row. `isDisabled` is the preferred spelling for new
code; legacy `disabled` still works. Disabled items remain discoverable by
keyboard on web, but neither clicks nor keyboard activation run their action.

## Add choices and submenus

Compound content means placing menu components inside the menu instead of
supplying an array. A checkbox represents an independent yes/no choice. A
radio group represents one choice from a named set.

```tsx
import { useState } from 'octane';
import {
  DropdownMenu, DropdownMenuItem, DropdownMenuDivider,
  DropdownMenuCheckboxItem, DropdownMenuRadioGroup,
  DropdownMenuRadioItem, DropdownMenuSubMenu, Text,
} from '@octane-xplat/ui';

function ViewActions() @{
  const [archived, setArchived] = useState(false);
  const [sort, setSort] = useState('newest');

  <DropdownMenu trigger={<Text>View actions</Text>}>
    <DropdownMenuCheckboxItem
      label="Show archived" value={archived} onValueChange={setArchived}
    />
    <DropdownMenuDivider />
    <DropdownMenuRadioGroup label="Sort by" value={sort} onValueChange={setSort}>
      <DropdownMenuRadioItem label="Newest first" value="newest" />
      <DropdownMenuRadioItem label="Oldest first" value="oldest" />
    </DropdownMenuRadioGroup>
    <DropdownMenuSubMenu label="Export">
      <DropdownMenuItem label="Export text" onSelect={() => console.log('export text')} />
      <DropdownMenuItem label="Export table" isDisabled />
    </DropdownMenuSubMenu>
  </DropdownMenu>
}
```

Checkboxes stay open by default so you can change several choices. Ordinary
items and radio choices close by default. Set `hasCloseOnSelect` on an item or
radio group to change that behavior. A radio group can own its state with
`defaultValue`, or receive `value` and report requests through `onValueChange`.
Checkbox state belongs to the caller: its `value` changes only when the caller
updates it. Choosing the already selected radio does not report a value change.

Submenus accept the same children or a nested `items` array. Data rows can also
use `type: 'divider'`, `type: 'checkbox'` with a boolean `value`, or
`type: 'radio-group'` with `label`, string `value`, `onValueChange`, and `items`.
Each radio option uses its string `value`, falling back to its `key`.
`items` and compound children can coexist; data rows come first. Annotate new
data arrays as `MenuOption[]` to check each choice's value and callback types;
the extendable `MenuItem` interface remains available to existing callers.

## Own open state

Use `isOpen` with `onOpenChange` when another part of the app owns visibility.
A close callback is a request. The menu stays mounted until you update
`isOpen`; a rejected submenu close keeps its keyboard focus. Without `isOpen`,
the menu owns visibility and can start open with `defaultOpen`.
Legacy `open` is retained, with `isOpen` taking precedence when both are passed.
A submenu uses `isOpen`, `defaultOpen`, and `onOpenChange` in the same way.

Selecting a nested action requests closure of the whole menu. Escape and
outside dismissal close the top surface first. Menus inherit the shared layer
registry and Popover positioning; they do not install another Escape handler.
`placement` and `alignment` on the root control the inherited Popover.
The inherited macOS Popover does not guarantee custom alignment or offset.

## Context actions on touch and keyboard

`ContextMenu` keeps `children` as the content you act on. Supply actions using
`items`, or compound parts using `menu`. The `ContextMenuItem`,
`ContextMenuDivider`, `ContextMenuCheckboxItem`, `ContextMenuRadioGroup`,
`ContextMenuRadioItem`, and `ContextMenuSubMenu` exports reuse the dropdown
implementations and state ownership.

```tsx
<ContextMenu
	trigger={<Text>Actions</Text>}
	accessibilityLabel="Open file actions"
	items={[{ key: 'rename', label: 'Rename', onSelect: rename }]}
>
	<Text>report.txt</Text>
</ContextMenu>
```

On web, right-click, the Context Menu key, or Shift+F10 opens the menu. On mobile,
long press opens it. Include a visible `trigger` like the Actions control above
so touch and assistive technology users can reach the same actions without a
long press. Native submenus include a named Back action to return to the parent.

On web, Up/Down wrap through menu rows, Home/End jump to the first/last row,
and typing finds a matching label. Enter/Space activates a row. Right opens a
submenu and Left returns to its parent (reversed in right-to-left layouts).
Escape uses shared dismissal and restores focus after accepted closure.
Tab requests closure without trapping focus. Composing input is ignored.

Native hardware arrow navigation, physical Escape/back input, OS hit-testing,
and VoiceOver/TalkBack announcements have not been verified by this task.
Native action/state regression tests use the universal object driver, not a
running device. macOS renderer accessibility support is narrower than web ARIA;
checked indicators are rendered, but OS checked/radio announcements are unverified.
For platform-native OS menus, see [the separate context-menu leaf](platform/context-menu.md).

## Keep a long breadcrumb trail usable

`Breadcrumbs` keeps its existing data-driven trail. Set `maxVisibleItems` to
keep the first ancestor and the last items visible. Middle ancestors move into
a named overflow menu; the limit is at least two visible trail items, plus the
menu trigger. The current page remains visible.

```tsx
<Breadcrumbs
	maxVisibleItems={2}
	items={[
		{ label: 'Home', onSelect: openHome },
		{ label: 'Projects', onSelect: openProjects },
		{ label: 'Reports', onSelect: openReports },
		{ label: 'Current report' },
	]}
/>
```

`overflowLabel` names the overflow trigger (default: More ancestors).
`overflowMenu` adds compound actions after hidden ancestors. The
`BreadcrumbMenuItem`, `BreadcrumbMenuDivider`, `BreadcrumbMenuCheckboxItem`,
`BreadcrumbMenuRadioGroup`, `BreadcrumbMenuRadioItem`, and `BreadcrumbMenuSubMenu`
exports use the same implementations as the other menu families.

The maintained [component demo](../packages/demos/src/ComponentsDemo.tsrx)
shows legacy rows, checkbox/radio choices, submenus, a visible context trigger,
and breadcrumb overflow together.
