# Give controls stable test names

> Name the controls a test or coding agent needs to find without changing what a screen reader says.

Add an optional `testID` to meaningful actions, editable fields, and state you
assert. A semantic name describes the control's purpose and stays the same
when its visible text is translated. Keep useful spoken labels and roles.

```tsx
import { Pressable, Text, TextInput, VStack } from '@octane-xplat/ui'

export function PackingForm() {
	return (
		<VStack>
			<TextInput testID="packing.item-name" accessibilityLabel="Item name" />
			<Pressable testID="packing.add-item" accessibilityLabel="Add item" accessibilityRole="button">
				<Text>Add item</Text>
			</Pressable>
		</VStack>
	)
}
```

Names must be unique among mounted targets, including open overlays. Prefer
`screen.action` or `entity.stable-key.action`; avoid translated text, array
positions, random values, personal data, and database secrets. Do not add an
ID to every decorative label or internal wrapper. For repeated items, use
the same durable item key for rendering and the automation name.

```tsx
import { Pressable, Text } from '@octane-xplat/ui'

export function PackingItems(props: { items: { key: string; name: string }[] }) {
	return (
		<>
			{props.items.map((item) => (
				<Pressable
					key={item.key}
					testID={`packing.item.${item.key}.open`}
					accessibilityLabel={`Open ${item.name}`}
				>
					<Text>{item.name}</Text>
				</Pressable>
			))}
		</>
	)
}
```

## Which host receives the name?

The supported shared leaves bind the ID to one host. They do not copy it to
children or generate IDs for internal actions. `TextInput`, `TextArea`, and
`SearchInput` target the editable field; `Overlay` targets the mounted content
surface, not its invisible anchor or shade. Give a child action its own name.
A changed or removed `testID` updates the retained host, which matters when a
row is reused for another item. Inline `Text` inside native `Text` is a
formatted span, not a separately identifiable OS view.

```tsx
import { Button, Overlay, TextInput } from '@octane-xplat/ui'

export function EditOverlay(props: { open: boolean; close: () => void }) {
	return (
		<Overlay open={props.open} testID="packing.editor">
			<TextInput testID="packing.editor.name" accessibilityLabel="Item name" />
			<Button testID="packing.editor.save" label="Save" clickAction={props.close} />
		</Overlay>
	)
}
```

| Shared host                                             | Forwarding                                            |
| ------------------------------------------------------- | ----------------------------------------------------- |
| `View`, `Row`, `Stack`, `HStack`, `VStack`, `Pressable` | Outer host; a scrollable `Stack` targets its scroller |
| `Text`                                                  | Standalone text host; native inline spans excluded    |
| `Button`                                                | Pressable host, or the web anchor when `href` is used |
| `TextInput`, `TextArea`, `SearchInput`                  | Editable field, excluding shell and clear button      |
| `Switch`                                                | Interactive track                                     |
| `ScrollableArea`                                        | Scroller, including the refreshable variant           |
| `VirtualList`                                           | Scroll viewport                                       |
| `Overlay`                                               | Content host, only while open                         |

Other composites, leaf packages, OS subpaths, and desktop renderers are not
covered by this list merely because their types inherit the optional prop.
Existing leaf APIs (such as table accessibility props) retain their own
contracts.

## Platform mapping and selector precedence

`testID` is separate from `id`: web receives `data-testid`; iOS/Android receive
NativeScript's `testID` property. Existing `id` values and accessibility
labels/roles remain intact. Avoid conflicting escape-bag identity properties;
platform escape props can override shared values when applied.

```tsx
import { TextInput } from '@octane-xplat/ui'

export function NameField() {
	return <TextInput id="name-field" testID="profile.name" accessibilityLabel="Your name" />
}
```

| Target | Mapping |
| --- | --- |
| iOS | UIKit `accessibilityIdentifier` |
| Android | Automation identifier in accessibility `resource-id`; runtime replay remains unverified |
| Web | DOM `data-testid`; existing DOM `id` preserved |
| AppKit (source only) | Raw native hosts map to `accessibilityIdentifier`; Pressable/Button forward the prop; runtime selectors unqualified |
| Other desktop renderers and physical devices | Not qualified; do not assume support |

The bounded journey passed on an iOS simulator and Chromium. See the
[internal mapping evidence](../../.agents/docs/argent.md#test-identifier-mapping-evidence)
for tested versions and reproduction details.

Argent 0.27.0's Chromium tree prefers a DOM `id` over `data-testid` on the same
element. For the example above, its replay selector is `{id: name-field}`;
when no DOM `id` exists it can use `{id: profile.name}`. DOM testing tools can
still select `[data-testid="profile.name"]`. Keep DOM IDs needed for label
relationships; do not remove them just to change automation precedence.

```yaml
steps:
  - type: { into: { id: name-field }, text: '42' }
```

For optional AI-agent browser/device control through MCP, use
[Argent's official setup](https://docs.swmansion.com/argent/docs/fundamentals/installation/)
and the [qualified local Argent recipe](argent.md). Stable IDs improve
reliable targeting; spoken accessibility semantics still belong to users.


## AppKit source implementation

AppKit Pressable and Button now forward `testID` to their retained native host.
The renderer assigns it to AppKit's
[accessibility identifier](https://developer.apple.com/documentation/appkit/nsaccessibility-c.protocol/accessibilityidentifier),
which is separate from the CSS `id` and spoken accessibility label. Changing the
prop updates that host; dropping it clears the identifier to an empty string.
Viewless logical nodes receive no native identifier.

```tsx
import { Button } from '@octane-xplat/ui'

export function SaveDraft({ save }: { save(): void }) {
	return <Button id="save-control" testID="draft.save" label="Save changes" clickAction={save} />
}
```

This is source implementation with authored, unrun renderer/object-driver cases.
It does not establish selector discovery/replay, native bridge behavior or
VoiceOver on macOS. Other AppKit composites need their own forwarding review;
this change does not qualify the whole host table for desktop use. Pressable
also forwards `accessible`, but use that prop only when deliberately choosing
whether an interaction appears as an accessibility element. It is not an
identifier or a substitute for a spoken label.

```tsx
import { Pressable, Text } from '@octane-xplat/ui'

export function NamedAction({ run }: { run(): void }) {
	return <Pressable testID="draft.preview" accessible accessibilityLabel="Preview draft" onPress={run}>
		<Text>Preview</Text>
	</Pressable>
}
```
