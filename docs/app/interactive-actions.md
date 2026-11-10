# Action controls and interactive cards

> Add buttons, action menus, and cards someone can select or open.

## Add a button

An **action** changes something, such as saving a document. A callback is the
function your app provides to perform it. The example keeps the pinned state locally and logs the Save and Share
actions. Replace those callbacks with your app’s actions. Icon names also
need to be registered in your app.

Use `Button` for labeled actions and `IconButton` when the whole control is an
icon. `ButtonGroup.size` is a default, so a member's explicit `size` wins;
`ButtonGroup.isDisabled` disables every member. On web, Tab enters the group
once and arrow/Home/End keys move among enabled members; native and AppKit
retain their renderer's ordinary per-control focus order.
`ToggleButton` can be controlled with `isPressed`/`onPressedChange`, or grouped
under `ToggleButtonGroup` with a single `value: string | null` and `onChange`,
or `type="multiple"` with a `string[]` value and `onChange`. Single selection
can be cleared by pressing the active member; multiple selection toggles each
member independently.

```tsx
import { Button, ButtonGroup, IconButton, ToggleButton } from '@octane-xplat/ui'
import { useState } from 'octane'

export function Example() {
  const [pinned, setPinned] = useState(false)

  return (
    <ButtonGroup label="Document actions" size="sm">
      <Button
        label="Save"
        variant="primary"
        size="lg"
        onPress={() => {
          console.log('Saved')
        }}
      />
      <ToggleButton label="Pin" isPressed={pinned} onPressedChange={setPinned} />
      <IconButton label="Share" icon="xplat-search" onPress={() => console.log('Share')} />
    </ButtonGroup>
  )
}
```

## Interactive cards

`ClickableCard` provides one named navigation/action target. `SelectableCard`
is controlled and announces its checked state. Both accept `padding` in 4 px
steps, `variant`, `elevation`, and dimensions. Web links retain anchor
navigation semantics and reject `javascript:`, `vbscript:`, and HTML data URLs;
iOS and Android links open through the platform URL handler. Native targets
cannot preserve browser modifier-click or new-tab behavior. AppKit now has source implementations for sanitized button/card URL dispatch;
ClickableCard opens the URL before its onPress callback. Its href surface uses
native link semantics, and SelectableCard keeps parent-controlled checked state.
Native URL launch, actual input/VoiceOver and card layout remain unqualified;
tooltip presentation is still missing.

```tsx
import { ClickableCard, SelectableCard, Text } from '@octane-xplat/ui'
import { useState } from 'octane'

export function Example() {
  const [selected, setSelected] = useState(false)

  return (
    <>
      <ClickableCard label="Open project" href="https://example.com" padding={4} variant="outlined">
        <Text>Project</Text>
      </ClickableCard>
      <SelectableCard label="Pack coat" isSelected={selected} onChange={setSelected} padding={4}>
        <Text>Coat</Text>
      </SelectableCard>
    </>
  )
}
```

`MoreMenu.presentation="adaptive"` uses a bottom sheet on iOS/Android and on
web viewports at or below 768 px with a coarse primary pointer. AppKit currently
uses the bottom sheet for both `adaptive` and explicit `bottom-sheet`. `start`/`end` placement maps to physical left/right and does not mirror for RTL; AppKit's
inline popover surface does not apply alignment. `MoreMenu` is for compact
action rows. Use `DropdownMenu` when rows need links, sections, separators, or
choices.

```tsx
import { MoreMenu } from '@octane-xplat/ui'

export function Example() {
  return (
    <MoreMenu
      label="Document actions"
      presentation="adaptive"
      placement="bottom"
      alignment="end"
      items={[
        {
          type: 'action',
          key: 'duplicate',
          label: 'Duplicate',
          onSelect: () => console.log('Duplicated'),
        },
      ]}
    />
  )
}
```

## Button states and actions

Use `onPress` for immediate effects, such as changing local state, moving focus,
opening a panel, or stopping playback. Use `pressAction` for asynchronous work:
it must return a promise. Returning a promise from `onPress` does not enable
pending-state or action-error handling. A pending action shows a loading indicator and prevents
repeat presses unless `isInterruptible` is true. With that option, each press
starts another call and the button stays busy until every call settles. Do not
make a synchronous effect `async` just to use `pressAction`.

```tsx
import { Button } from '@octane-xplat/ui'

export function Actions(props: { close(): void; save(): Promise<void> }) {
  return (
    <>
      <Button label="Close" onPress={props.close} />
      <Button label="Save" pressAction={props.save} />
    </>
  )
}
```

When both are supplied, `onPress` runs first. Its `preventDefault()` skips the
link's navigation and the asynchronous action. A thrown `onPress` error also
skips the action and goes to the renderer's error boundary. Disabled buttons
and buttons blocked by a pending action run neither callback. Keyboard and
accessibility activation use the same handlers. `IconButton` shares this
contract. Toggle buttons use `onPressedChange` for immediate changes and
`pressedChangeAction` for asynchronous saves.

```tsx
import { Button } from '@octane-xplat/ui'

export function GuardedSave(props: { valid: boolean; save(): Promise<void> }) {
  return (
    <Button
      label="Save"
      onPress={(event) => {
        if (!props.valid) event.preventDefault()
      }}
      pressAction={props.save}
    />
  )
}
```

**Migrating existing code:** `clickAction` is removed. Move synchronous callbacks
to `onPress` and Promise-returning callbacks to `pressAction`. Earlier alpha
versions removed Button's `onPress`; it is now the synchronous effect callback.
Keep `isDisabled`, `isLoading`, `icon`, and `endContent` for state and slots.
There is no compatibility alias for `clickAction`.

```tsx
import { Button } from '@octane-xplat/ui'

export function Migrated(props: { open(): void; upload(): Promise<void> }) {
  return (
    <>
      <Button label="Open" onPress={props.open} />
      <Button label="Upload" pressAction={props.upload} />
    </>
  )
}
```

When a `pressAction` promise rejects — or the action throws — the failure
reports through `onActionError`. If no handler is set, the error still
surfaces as an uncaught asynchronous error so a failed action is never
silently swallowed. `ToggleButton`'s `pressedChangeAction` reports the same
way.

```tsx
import { Button, Text } from '@octane-xplat/ui'

export function Example() {
  return (
    <Button
      label="Fallback label"
      isDisabled={false}
      isLoading={false}
      isInterruptible={false}
      pressAction={async () => {
        await Promise.resolve()
      }}
      onActionError={(error) => {
        console.error('Save failed', error)
      }}
    >
      <Text>Save</Text>
    </Button>
  )
}
```

## Try a small demo

[Try the goal counter demo](../demos/goal-counter.md) with bundled local content.

## AppKit card qualification

AppKit cards now wrap primitive children in native text hosts while preserving
supplied child components. Variant/elevation classes reach both interactive
card leaves; native appearance remains unqualified.

```tsx
import { ClickableCard } from '@octane-xplat/ui'

export function ProjectHelp() {
  return (
    <ClickableCard label="Open project help" href="https://example.com/help" elevation="low">
      Read help
    </ClickableCard>
  )
}
```

AppKit has no native browser target/modifier-click behavior. Nested interactive
children have authored host-preservation cases, but OS gesture arbitration and
hit-testing remain unqualified. AppKit SelectableCard now has an opt-in focus claim while disabled. It keeps
its disabled accessibility state and has no activation handler; the native
FocusScope owner respects its explicit focus eligibility. This requires the
matching renderer bridge. These source changes do not qualify real Tab order,
VoiceOver, physical input, layout or packaging.

A disabled selection card remains discoverable by focus while rejecting changes.
Other disabled controls retain their ordinary focus behavior. Hiding, explicit
Tab suppression and scope fallback exclusions still take precedence.

```tsx
import { SelectableCard } from '@octane-xplat/ui'

export function Plan({
  selected,
  onChange,
}: {
  selected: boolean
  onChange(value: boolean): void
}) {
  return (
    <SelectableCard label="Team plan" isSelected={selected} isDisabled onChange={onChange}>
      Team plan is currently unavailable
    </SelectableCard>
  )
}
```
