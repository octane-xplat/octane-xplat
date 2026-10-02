# Action controls and interactive cards

> Add buttons, action menus, and cards someone can select or open.

## Action controls and interactive cards

An **action** changes something, such as saving a document. A callback is the
function your app provides to perform it. The example keeps the pinned state locally and logs the Save and Share
actions. Replace those callbacks with your app’s actions. Icon names also
need to be registered in your app.

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
import { Button, ButtonGroup, IconButton, ToggleButton } from '@octane-xplat/ui'
import { useState } from 'octane'

export function Example() {
	const [pinned, setPinned] = useState(false)
	return (
		<ButtonGroup label="Document actions" size="sm">
			<Button
				label="Save"
				variant="primary"
				clickAction={async () => {
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
cannot preserve browser modifier-click or new-tab behavior. The experimental
AppKit surface exports these controls, but its button/card `href` behavior and
tooltip presentation are not implemented yet.

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
inline popover surface does not apply alignment. The current `items` shape
contains actions only, so upstream separator and nested-menu rows are not
represented.

```tsx
import { MoreMenu } from '@octane-xplat/ui'

export function Example() {
	return (
		<MoreMenu
			label="Document actions"
			presentation="adaptive"
			placement="bottom"
			alignment="end"
			items={[{ key: 'duplicate', label: 'Duplicate', onSelect: () => console.log('Duplicated') }]}
		/>
	)
}
```

## Button compatibility

`Button` keeps the existing `disabled`, `loading`, `leading`, and `trailing`
props. When an Astryx spelling and a legacy spelling are both supplied, the
states merge (either disabled/loading state wins); `children` takes precedence
over `label`. A pending `clickAction` shows a loading indicator and prevents
repeat presses unless `isInterruptible` is true.

```tsx
import { Button, Text } from '@octane-xplat/ui'

export function Example() {
	return (
		<Button
			label="Fallback label"
			disabled={false}
			loading={false}
			isInterruptible={false}
			clickAction={async () => {
				await Promise.resolve()
			}}
		>
			<Text>Save</Text>
		</Button>
	)
}
```
