# Action controls and interactive cards

## Action controls and interactive cards

Use `Button` for labeled actions and `IconButton` when the whole control is an
icon. `ButtonGroup` shares size and disabled state across adjacent actions. On web,
Tab enters the group once and arrow/Home/End keys move among enabled members;
native and AppKit retain their renderer's ordinary per-control focus order.
`ToggleButton` can be controlled with `isPressed`/`onPressedChange`, or grouped
under `ToggleButtonGroup` with a single `value: string | null` and `onChange`,
or `type="multiple"` with a `string[]` value and `onChange`. Single selection
can be cleared by pressing the active member; multiple selection toggles each
member independently.

```tsx
import { Button, ButtonGroup, IconButton, MoreMenu, ToggleButton } from '@octane-xplat/ui'

<ButtonGroup label="Document actions" size="sm">
  <Button label="Save" variant="primary" clickAction={saveDocument} />
  <ToggleButton label="Pin" icon="pin" isPressed={pinned} onPressedChange={setPinned} />
  <IconButton label="Share" icon="share" onPress={shareDocument} />
</ButtonGroup>

<MoreMenu items={[{ key: 'duplicate', label: 'Duplicate', onSelect: duplicate }]} />
```

## Interactive cards

`ClickableCard` provides one named navigation/action target. `SelectableCard`
is controlled and announces its checked state. Both accept `padding` in 4 px
steps, `variant`, `elevation`, and dimensions. Web links retain anchor
navigation semantics and reject `javascript:`, `vbscript:`, and HTML data URLs;
iOS and Android links open through the platform URL handler. Native targets
cannot preserve browser modifier-click or new-tab behavior. The experimental
AppKit surface exports these controls, but its button/card `href` behavior and
tooltip presentation are not implemented yet.

`MoreMenu.presentation="adaptive"` uses a bottom sheet on iOS/Android and on
web viewports at or below 768 px with a coarse primary pointer. AppKit currently
uses the bottom sheet for both `adaptive` and explicit `bottom-sheet`. `start`/`end` placement maps to physical left/right and does not mirror for RTL; AppKit's
inline popover surface does not apply alignment. The current `items` shape
contains actions only, so upstream separator and nested-menu rows are not
represented.

## Button compatibility

`Button` keeps the existing `disabled`, `loading`, `leading`, and `trailing`
props. When an Astryx spelling and a legacy spelling are both supplied, the
states merge (either disabled/loading state wins); `children` takes precedence
over `label`. A pending `clickAction` shows a loading indicator and prevents
repeat presses unless `isInterruptible` is true.
