# Add actions and choices to a menu

> Give someone a menu of actions and choices for the current task.

Use `DropdownMenu` for a button that opens actions. Use `ContextMenu` for actions
on an existing piece of content. Both come from `@octane-xplat/ui` and use the
same menu parts on web, iOS, Android, and macOS.

## Start with actions

A menu item calls `onSelect` when chosen and closes the menu. Data-driven rows
now include an explicit kind; mark command rows as `action`:

```tsx
<DropdownMenu
	button={{ label: 'Actions' }}
	items={[
		{ type: 'action', key: 'rename', label: 'Rename', onSelect: rename },
		{ type: 'action', key: 'remove', label: 'Remove', isDisabled: true },
	]}
/>
```

`key` identifies a data row and `isDisabled` disables it. Disabled items
remain discoverable by keyboard on web, but neither clicks nor keyboard
activation run their action.

## Add choices and submenus

Compound content means placing menu components inside the menu instead of
supplying an array. A checkbox represents an independent yes/no choice. A
radio group represents one choice from a named set.

```tsrx
import { useState } from 'octane';
import {
  DropdownMenu, DropdownMenuItem, DropdownMenuSeparator,
  DropdownMenuCheckboxItem, DropdownMenuRadioGroup,
  DropdownMenuRadioItem, DropdownMenuSubMenu, Text,
} from '@octane-xplat/ui';

function ViewActions() @{
  const [archived, setArchived] = useState(false);
  const [sort, setSort] = useState('newest');

  <DropdownMenu button={{ label: 'View actions' }}>
    <DropdownMenuCheckboxItem
      label="Show archived" value={archived} onValueChange={setArchived}
    />
    <DropdownMenuSeparator />
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

Submenus accept the same children or a nested `items` array. Data rows use an
explicit `type`: `action` runs a command, `link` navigates, `section` groups
nested rows, and `separator` divides them. `checkbox` rows take a boolean
`value`; `radio-group` rows take a string `value`, `onValueChange`, and `items`.
Each radio option uses its string `value`, falling back to its `key`.
`items` and compound children can coexist; data rows come first. Annotate new
arrays as `MenuOption[]` to check each row kind and its callback types. The old
`MenuItem` type remains as a deprecated alias for the discriminated union.

## Own open state

Open state is `isOpen`/`defaultOpen`/`onOpenChange` and disabled is
`isDisabled` — the older `open`/`disabled` spellings are removed, so rename
them when upgrading. Use `isOpen` with `onOpenChange` when another part of
the app owns visibility.
A close callback is a request. The menu stays mounted until you update
`isOpen`; a rejected submenu close keeps its keyboard focus. Without `isOpen`,
the menu owns visibility and can start open with `defaultOpen`.
A submenu uses `isOpen`, `defaultOpen`, and `onOpenChange` in the same way.

Selecting a nested action closes the whole menu by default; setting
`hasCloseOnSelect={false}` keeps that menu open. Escape and outside dismissal
close the top surface first. Menus inherit the shared layer
registry and Popover positioning; they do not install another Escape handler.
`placement` and `alignment` on the root control the inherited Popover.
The inherited macOS Popover does not guarantee custom alignment or offset.

```tsx
<DropdownMenu button={{ label: 'Actions' }}>
	<DropdownMenuItem label="Save draft" onSelect={saveDraft} hasCloseOnSelect={false} />
</DropdownMenu>
```

## Context actions on touch and keyboard

`ContextMenu` keeps `children` as the content you act on. Supply actions using
`items`, or compound parts using `menu`. The `ContextMenuItem`,
`ContextMenuSeparator`, `ContextMenuCheckboxItem`, `ContextMenuRadioGroup`,
`ContextMenuRadioItem`, and `ContextMenuSubMenu` exports reuse the dropdown
implementations and state ownership.

```tsx
<ContextMenu
	trigger={<Text>Actions</Text>}
	accessibilityLabel="Open file actions"
	items={[{ type: 'action', key: 'rename', label: 'Rename', onSelect: rename }]}
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
For platform-native OS menus, see [the separate context-menu leaf](../platform/context-menu.md).

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
`BreadcrumbMenuItem`, `BreadcrumbMenuSeparator`, `BreadcrumbMenuCheckboxItem`,
`BreadcrumbMenuRadioGroup`, `BreadcrumbMenuRadioItem`, and `BreadcrumbMenuSubMenu`
exports use the same implementations as the other menu families.

The maintained [component demo](../../packages/demos/src/ComponentsDemo.tsrx)
shows legacy rows, checkbox/radio choices, submenus, a visible context trigger,
and breadcrumb overflow together.


## AppKit menu host state

On experimental AppKit, disabled action, checkbox, radio and submenu rows now
remove native activation along with disabled metadata. A disabled radio group
also disables its rows. DropdownMenu preserves the button ref and uses button.id
unless the menu supplies its own id. Destructive rows forward the shared tone
class; this does not qualify native paint.

```tsx
import { DropdownMenu, DropdownMenuItem } from '@octane-xplat/ui'

export function Actions({ disabled }: { disabled: boolean }) {
	return <DropdownMenu isDisabled={disabled} button={{ id: 'actions', label: 'Actions' }}>
		<DropdownMenuItem label="Remove" variant="destructive" isDisabled={disabled} />
	</DropdownMenu>
}
```

AppKit disables the visible dropdown/context/submenu surface even when a
controlled parent keeps requesting isOpen, and requests onOpenChange(false).
Dropdown disablement includes its button and enclosing ButtonGroup. Reenabling
can reopen a controlled menu whose parent still requests it; keep visibility in
your state owner when you want a different result.

```tsx
import { useState } from 'octane'
import { DropdownMenu, DropdownMenuItem } from '@octane-xplat/ui'

export function ControlledActions({ disabled }: { disabled: boolean }) {
	const [open, setOpen] = useState(false)
	return <DropdownMenu isOpen={open} onOpenChange={setOpen} isDisabled={disabled} button={{ label: 'Actions' }}>
		<DropdownMenuItem label="Archive" />
	</DropdownMenu>
}
```

Five authored AppKit object-driver cases remain unrun and replace popovers with
inline content. Subsequent surface/trigger keyboard source paths are described below; reliable
owned-dropdown Tab return intent is described below; real popup/ref/focus timing, physical keys, mouse hit testing,
VoiceOver and packaging remain unqualified. Shared AppKit ContextMenu also has the Shift+F10 source path described below; secondary-click source ownership is described below.
The renderer's full menu-role/checked announcements also remain incomplete.


## Navigate AppKit menu surfaces

AppKit menu surfaces now have a source keyboard path: Up/Down wrap across current
enabled rows, Home/End move to an edge, and label prefixes move focus without
choosing. Enter/Space use the row's existing action/checkbox/radio owner. The
forward arrow requests a submenu and the backward arrow requests its parent
level; these directions reverse for RTL. Dropdowns request first-row focus after
the popup attaches. IME and modified shortcuts keep their existing ownership.

```tsx
import { DropdownMenu, DropdownMenuItem, DropdownMenuSubMenu } from '@octane-xplat/ui'

export function Actions() {
	return <DropdownMenu button={{ label: 'Actions' }}>
		<DropdownMenuItem label="Archive" onSelect={() => console.log('archive')} />
		<DropdownMenuItem label="Remove" isDisabled />
		<DropdownMenuSubMenu label="Export">
			<DropdownMenuItem label="Text" onSelect={() => console.log('export')} />
		</DropdownMenuSubMenu>
	</DropdownMenu>
}
```

Nested editors in endContent retain their key handling; typeahead uses string
row labels. Escape stays with the existing layer dismissal owner. Unowned surfaces request Tab closure without preventing native movement.
Dropdown/submenu return refs follow accepted closure; owned Tab return and
closed-trigger arrow intent are described below.

Seven new authored policy/inline-popup cases and the maintained AppKit menu
fixture remain unrun. Fake windows prove no physical keys or popup behavior.
Actual initial/return focus, native Tab traversal, separate-root lifetime, RTL
provider delivery, scrolling/reveal, mouse hit testing, VoiceOver and packaging
remain unqualified. Secondary-click opening and full native menu AX roles/checked
announcements remain implementation gaps.


### Open an AppKit dropdown with arrows

A closed, enabled AppKit DropdownMenu now requests opening with plain Down/Up
and retains first/last-row focus intent until the controlled parent accepts it.
The attachment uses the existing Button host, keeping its ref, ID and layout.
Descendant controls, prevented/composing input and modified shortcuts retain
ownership. Ordinary pointer/Enter/Space opening resets focus intent to the first row.

```tsx
import { DropdownMenu, DropdownMenuItem } from '@octane-xplat/ui'

export function Actions() {
	return <DropdownMenu button={{ id: 'actions', label: 'Actions' }}>
		<DropdownMenuItem label="Archive" />
		<DropdownMenuItem label="Export" />
	</DropdownMenu>
}
```

The matching AppKit renderer is required for the private view-key subscription;
older bridges retain the existing Button activation path. Nine new dispatcher/
bridge/fake-window cases remain unrun. Native monitor order, actual ref delivery,
physical arrows, popup first/last focus, IME, actual Tab return, VoiceOver and
packaging remain unqualified. Owned Tab return intent is described below;
secondary-click source ownership is described below; full menu accessibility remains a gap.


### Leave an owned AppKit dropdown with Tab

Owned dropdowns and their submenus now record Tab/Shift-Tab return intent using
the trigger's current next/previous valid key view. A foreign or missing candidate
falls back to the trigger. The key requests closure and is consumed while the
controlled owner decides; it does not move focus immediately. Ordinary dismissal
still requests the anchor. Keep isOpen synchronized through onOpenChange.

```tsx
import { useState } from 'octane'
import { DropdownMenu, DropdownMenuItem } from '@octane-xplat/ui'

export function Actions() {
	const [open, setOpen] = useState(false)
	return <DropdownMenu isOpen={open} onOpenChange={setOpen} button={{ label: 'Actions' }}>
		<DropdownMenuItem label="Archive" />
	</DropdownMenu>
}
```

Nested return refs choose the closest accepted open ancestor, then the outer
trigger's requested neighbor once the chain closes. The AppKit focus adapter
uses an explicit target's own window, resolves shared field editors to their
owning controls, and rejects detached/hidden targets or moved fallback controls.
ContextMenu now supplies return intent when it has a valid invoker, as described
below; originless and unowned surfaces retain native Tab fallback.

Ten new focus/return-policy/fake-window cases remain unrun. Native cleanup order,
actual key-view traversal and focus restoration, window activation timing,
FocusScope/modal integration, IME, VoiceOver and packaging remain unqualified.
The implementation records return intent; it is not proof of a native Tab result.


### Open AppKit context actions from the keyboard

AppKit ContextMenu now requests opening with Shift+F10 or an unmodified Context
Menu key from focused content
inside its wrapper, preserving composition, modified/prevented keys and disabled
state. It remembers that live native invoker for ordinary return and Tab/Shift-Tab
neighbor intent. Its visible trigger also supplies a return host; plain text
trigger content is wrapped in a native text host. ContextMenu owns the clickable
trigger, so provide its content with trigger; DropdownMenu uses button instead.

```tsx
import { Button, ContextMenu, DropdownMenuItem } from '@octane-xplat/ui'

export function Document() {
	return <ContextMenu label="Document actions" trigger="Actions"
		menu={<DropdownMenuItem label="Archive" onSelect={() => console.log('archive')} />}>
		<Button label="report.txt" clickAction={() => console.log('select')} />
	</ContextMenu>
}
```

The invoker must remain visible, eligible, inside the wrapper and in the same
window. An unavailable keyboard origin falls back to the visible trigger. Without
a valid invoker, long-press-only menus retain native Tab fallback. Controlled
owners still accept closure before layer restoration runs.

Six new origin-policy/inline-popup cases remain unrun. Physical Shift+F10 delivery,
actual invoker/popup/Tab focus, native metadata/gesture arbitration, IME, VoiceOver
and packaging remain unqualified. Context Menu key normalization now has the
source path described below; actual hardware delivery remains unqualified.


### Open AppKit context actions with the pointer

With the matching AppKit renderer, secondary-click or plain Control-primary-click
inside ContextMenu requests opening. The nearest live context scope owns the
intent; ordinary clicks and Control combinations with Shift, Option or Command
keep their existing behavior. Use the same component for keyboard and pointer
opening:

```tsx
import { Button, ContextMenu, DropdownMenuItem } from '@octane-xplat/ui'

export function Document() {
	return <ContextMenu label="Document actions" trigger="Actions" menu={<DropdownMenuItem label="Archive" />}>
		<Button label="report.txt" clickAction={() => console.log('select')} />
	</ContextMenu>
}
```

Hits on decorative content choose an eligible focusable ancestor as the return
host, then fall back to the visible trigger. Without a valid invoker, native Tab
fallback remains. Controlled owners still accept open/close requests. The renderer
observes pointer modality before consuming an owned intent; disabled, released,
foreign and detached scopes cannot open through a cached callback.

Twelve authored dispatcher/bridge/origin/modality/menu cases remain unrun. Native
mouse-down/up delivery, primary-action suppression, hit-testing, monitor ordering,
popup/focus/ref timing, embedded engines, IME, VoiceOver and packaging remain
unqualified. This is source implementation, not evidence of native operation.


### Use a dedicated Context Menu key on AppKit

The renderer maps AppKit's Context Menu virtual key or menu function character to
key="ContextMenu". The shared ContextMenu requests opening from its current owned
focused host and retains the same invoker/Tab return intent as Shift+F10. Modified,
composing, prevented, disabled and already-open events retain their existing path.
No special keyboard prop is required:

```tsx
import { Button, ContextMenu, DropdownMenuItem } from '@octane-xplat/ui'

export function Document() {
	return <ContextMenu trigger="Actions" menu={<DropdownMenuItem label="Archive" />}>
		<Button label="report.txt" clickAction={() => console.log('select')} />
	</ContextMenu>
}
```

Two renderer cases and two additional parameterized menu cases remain unrun.
SDK constants establish the source mapping; they do not prove delivery from any
physical keyboard. Actual native key/modifier/IME delivery, popup/focus/Tab return,
VoiceOver and packaging remain unqualified. The visible trigger stays useful on
keyboards without this key.
