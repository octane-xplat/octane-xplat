# Building screens

> Combine text, buttons, fields, and containers to make a screen.

A **component** is a reusable piece of a screen. `Text` displays words,
`Pressable` responds to a tap or click, and `View` groups content. You give
components **props**: options such as the text to show or what to do when
someone presses a button.

```tsx
import { View, Text, Pressable } from '@octane-xplat/ui'

export function Example() {
	return (
		<View>
			<Text>Packing list</Text>
			<Pressable onPress={() => console.log('Add item')}>
				<Text>Add item</Text>
			</Pressable>
		</View>
	)
}
```

If you're working with an agent, describe the screen in terms of what someone
can do: “Show saved orders. If there are none, explain how to add one. If
loading fails, offer Retry.” You can also write the components yourself.
[Create an app](../start/toolchain.md#create-and-run) first if you haven't yet.

New to Xplat? Follow [the practical example](#a-practical-example) first.
Use the rest of this page as a reference, or choose a focused guide for
[text entry](text-entry.md), [menus](menus.md), [tables](tables.md), and
[search and selection](search-selection.md). Advanced host details are optional
until your screen needs them.

## The components you reach for first

| I need to…                           | Use                       |
| ------------------------------------ | ------------------------- |
| Group content                        | `View`                    |
| Put items beside each other          | `HStack`                  |
| Put items above and below each other | `VStack` or `Stack`       |
| Show words                           | `Text`                    |
| Respond to a tap or click            | `Pressable`               |
| Accept typed text                    | `TextInput` or `TextArea` |
| Scroll content                       | `ScrollableArea`          |
| Show a short list                    | `List` with `ListItem`    |
| Show a dialog above a screen         | `Dialog`                  |

The [component index](components.md) lists more options. Begin with shared
components from `@octane-xplat/ui`. The supported web, iOS, and Android
implementations aim for consistent appearance and actions;
[experimental desktop targets](../start/spec.md#choose-your-targets) have narrower coverage.

## A practical example

For a small experiment in the starter, replace `src/App.tsrx` with this
component. It starts at zero; pressing “Add one” increases the count.

```tsx
import { useState } from 'octane'
import { View, Text, Pressable } from '@octane-xplat/ui'

export function App() {
	const [count, setCount] = useState(0)

	return (
		<View>
			<Text>Count: {count}</Text>
			<Pressable onPress={() => setCount(count + 1)}>
				<Text>Add one</Text>
			</Pressable>
		</View>
	)
}
```

`useState(0)` gives the component a changing value, starting at zero.
`count` is that value and `setCount` changes it. `onPress` is a callback: a
function the component calls when someone presses it. The `{count}` part
shows the current value in the text.

Save the file with the development server running. Press Add one twice and
check that the text says “Count: 2.” Reloading starts at zero again.
[Styling](styling.md) explains how to add spacing and button decoration.

### Layout and platform controls

`Stack` arranges its contents in a row or column. `HStack` fixes the direction
to horizontal; `VStack` fixes it to vertical. `gap` and padding use spacing
steps: one step is 4 device-independent pixels (dips) on native and 4 CSS
pixels on web. A dip is a size unit that accounts for a phone's pixel density.
Use `Absolute` when children need to overlap. `StackItem size="fill"` grows
into remaining space, and `crossAlignSelf` changes an item's alignment across
the row or column.

```tsx
import { Stack, HStack, VStack, StackItem, Absolute, Text } from '@octane-xplat/ui'

export function Example() {
	return (
		<VStack gap={2} padding={4}>
			<HStack gap={1}>
				<Text>Bag</Text>
				<StackItem size="fill" crossAlignSelf="center">
					<Text>Ready</Text>
				</StackItem>
			</HStack>
			<Stack direction="horizontal">
				<Text>Next item</Text>
			</Stack>
			<Absolute>
				<Text left={0} top={0}>
					Badge
				</Text>
			</Absolute>
		</VStack>
	)
}
```

You can now build a simple screen with text, actions, and rows or columns.
Continue with [text entry](text-entry.md) for a form,
[styling](styling.md) for colors and fonts, or
[grouped fields](#grouped-fields) for a settings screen. The sections below
cover more specialized layouts and platform behavior; read them when needed.

### Grid placement

`Grid` puts children in cells. `row` and `col` are zero-based track
indices — the first declared track is index 0 on every platform — and
omitting them lets a child fill the next free cell in row order.
`colSpan` and `rowSpan` cover several cells.
A reusable component must forward these props to its outermost view, as
`Card` does here. Use child margins for spacing.

```tsx
import { Grid, Text, View } from '@octane-xplat/ui'
import type { LayoutChildProps } from '@octane-xplat/ui'

function Card(props: LayoutChildProps) {
	return (
		<View {...props}>
			<Text>Reserved</Text>
		</View>
	)
}

export function GridExample() {
	return (
		<Grid columns="*,*,*">
			<Card row={0} col={0} colSpan={2} />
			<Text>Next free cell</Text>
		</Grid>
	)
}
```

The `rows` and `columns` track lists share one bounded grammar on every
platform. Each track is `auto` (sized to its content), a number or numeric
string (a fixed length in dips — `'48px'` and `'2fr'` spellings normalize
to the same value), or a star weight (`*` or `2*` for a share of leftover
space). Strings separate tracks with commas or whitespace; the array form
types each token. Entries outside the grammar — `minmax`, `repeat`,
percentages, line names — log a `[Grid]` warning and lay out as `auto`,
instead of working on one host and breaking on another.

```tsx
import { Grid, Text } from '@octane-xplat/ui'

export function TrackExample() {
	return (
		<Grid rows="auto,*" columns={['auto', 96, '2*']}>
			<Text>Header</Text>
			<Text>Sidebar</Text>
			<Text>Content</Text>
		</Grid>
	)
}
```

A star track keeps its content's minimum width, so long content can make a
cell wider than the available space. For a panel that must stay inside the
screen, use a zero-minimum CSS track instead. Omit `columns` on that Grid so
the CSS class owns its columns; apply this at each nested Grid that must fit.
The text may still need wrapping or truncation.

```tsx
import { Grid, Screen, Text, View } from '@octane-xplat/ui'
import './bounded-grid.css'

export function BoundedPanel() {
	return (
		<Screen>
			<Grid className="bounded-grid" rows="*">
				<View row={0} col={0}>
					<Text>A long explanation can wrap inside this cell.</Text>
				</View>
			</Grid>
		</Screen>
	)
}
```

```css
/* bounded-grid.css — 0 allows the track to shrink below its content minimum. */
.bounded-grid {
	flex: 1;
	grid-template-columns: minmax(0, 1fr);
}
```

For a native composite component, forward placement through a shared `View`
root. It translates the shared placement props into Mason grid lines. Put
this component in a `.mobile.tsx` file.

```tsx
/** @jsxImportSource @octane-xplat/jsx */
import { Text, View, type LayoutChildProps } from '@octane-xplat/ui'

export function NativeCard(props: LayoutChildProps) {
	return (
		<View row={props.row} col={props.col} rowSpan={props.rowSpan} colSpan={props.colSpan}>
			<Text>Reserved</Text>
		</View>
	)
}
```

Conditional children can be inserted after mounting. Their owning component
must use reactive state or a subscribed store so the renderer receives the
change. On NativeScript, Mason places inserted cells during layout; wait
for that layout pass before measuring their bounds.

```tsx
import { useState } from 'octane'
import { Grid, Pressable, Text, View } from '@octane-xplat/ui'

export function LateGridExample() {
	const [show, setShow] = useState(false)

	return (
		<View>
			<Pressable onPress={() => setShow((current) => !current)}>
				<Text>Toggle extra cell</Text>
			</Pressable>
			<Grid columns="*,*">
				<Text>First</Text>
				{show ? <Text>Extra</Text> : null}
			</Grid>
		</View>
	)
}
```

The maintained [Grid driver fixture](../../packages/ui/tests/grid-placement.fixture.mobile.tsrx)
covers placement, insertion, removal, and reorder. Its Node tests substitute
native views; phone layout and gesture/overlay timing still need device checks.
Existing apps need the current framework patches (`xplat patches apply`) and
a reinstall before relying on the NativeScript placement correction.

```sh
pnpm exec xplat patches apply
pnpm install
```

### Platform controls

On web, `Stack as="section"` selects an HTML tag. Native cannot create that
tag. Native `isScrollable` puts the layout inside a `ScrollView`.

```tsx
import { Stack, Text } from '@octane-xplat/ui'

export function Example() {
	return (
		<Stack as="section" isScrollable>
			<Text>Notes</Text>
		</Stack>
	)
}
```

Xplat also offers the OS's own controls through platform imports such as
`@octane-xplat/ui/ios` and `@octane-xplat/ui/android`. They keep their platform's
appearance and do not promise matching visuals. Examples include `UITableView`
and `UISwitch` on iOS, or `RecyclerView` and `MaterialSwitch` on Android.
Keep those imports in matching `.ios` or `.android` files; importing them into
a shared screen will fail the other platform's build.
[Platform files](../platform/module-resolution.md) explains the naming rules.
The [implementation map](#implementation-map) lists more controls and their
underlying views for readers who need that detail.

```tsx
/** @jsxImportSource @octane-xplat/jsx */
// Settings.ios.tsrx: keep this import in the iOS file.
import { UISwitch } from '@octane-xplat/ui/ios'
import { useState } from 'octane'

export function Settings() {
	const [checked, setChecked] = useState(false)

	return <UISwitch value={checked} onChange={setChecked} />
}
```

Platform widgets accept only the props the OS control can deliver. Each
widget's props type carries the widget's name — `UISwitch` takes
`UISwitchProps`, `UITableView` takes `UITableViewProps`, `MaterialSwitch`
takes `MaterialSwitchProps`. The `Platform*` types (`PlatformTabSpec`,
`PlatformListProps`, `PlatformIconChoice`, `PlatformWidgetProps`) are the
contracts the platform widgets share with each other. The platform switches
share the `value`/`onChange` state contract
(`defaultValue` seeds uncontrolled use) and
honor `isDisabled`, `isReadOnly`, `testID`, and the accessibility names —
`label`, `description`, and `accessibilityLabel`/`accessibilityHint` are
spoken, since a bare widget draws no visible label. Wrap one in `Field` for
visible label, description, and status chrome; the widget picks those states
up from the field automatically.

```tsx
/** @jsxImportSource @octane-xplat/jsx */
// Settings.ios.tsrx
import { UISwitch } from '@octane-xplat/ui/ios'

export function AirplaneRow() {
	return <UISwitch value label="Airplane mode" isDisabled />
}
```

### Layer a screen over retained content

To open a player while keeping a library mounted underneath, give both layers
cell `0,0` in a full-size `Grid`. Each layer needs a `View` wrapper to carry
`row` and `col`; `Screen` does not accept those placement props. The parent
must already have the bounds you want to cover. On native, start from a
full-window app host: layers do not correct offsets introduced by a custom
Page/Frame shell. The native screen shell fills its wrapper, so media's natural
height does not determine the screen's height. Here `playing` controls whether
the player layer is mounted.

```tsx
import { Grid, Screen, Text, View } from '@octane-xplat/ui'
import './screen-layers.css'

export function LibraryPlayer(props: { playing: boolean }) {
	return <Grid className="screen-layers-host" rows="*" columns="*">
		<View row={0} col={0}>
			<Text>Retained library</Text>
		</View>
		{props.playing && <View row={0} col={0}>
			<Screen className="screen-layers-screen">
				<Text>Player</Text>
			</Screen>
		</View>}
	</Grid>
}
```

```css
/* screen-layers.css */
.screen-layers-host { width: 100%; height: 100%; }
.screen-layers-screen {
	display: flex;
	flex-direction: column;
	width: 100%;
	height: 100%;
	flex: 1;
}
```

`Screen` is a screen shell, not an instruction to overlay its siblings. A
column-sibling Screen stays in normal flow; on iOS its content can extend
below the viewport from that slot. Increasing `zIndex` or setting `flex: 1`
does not give it a full-bounds slot. Use the same-cell composition above for
retained screens. It does not supply modal focus management or make the
background inaccessible; use [shared temporary surfaces](#own-temporary-surfaces)
when those behaviors are needed.

The maintained native regression qualifies this composition's height resizing
on iOS and Android, plus width resizing on Android. A nested iOS stage can
still report zero width after layout settles; see [known limits](../testing/known-limits.md).
Check width separately when using nested media stages on iOS.

### Safe-area edges

`SafeArea` keeps content clear of the system bars, notch, and home
indicator by padding the edges you select. `edges` takes any of `'top'`,
`'right'`, `'bottom'`, and `'left'` and defaults to all four;
`edges={[]}` makes it a neutral wrapper so content can extend underneath.
Each edge is consumed once — a nested `SafeArea` pads only what its
ancestors left, and `KeyboardAvoiding` inside one subtracts the consumed
bottom inset from the keyboard inset, so stacking never double-counts.

```tsx
import { SafeArea, Text } from '@octane-xplat/ui'

export function EdgeExample() {
	return (
		<SafeArea edges={['top']}>
			<SafeArea edges={['top', 'bottom']}>
				<Text>Top is padded once; bottom still applies</Text>
			</SafeArea>
		</SafeArea>
	)
}
```

The older `ignoreSafeArea` prop still works as `edges={[]}` and is
deprecated; `edges` wins when both are set. macOS windows have no
safe-area insets, so `SafeArea` stays a neutral wrapper there.

For edge-to-edge phone content, prepare the NativeScript Page before rendering
into it. This works with a Frame-navigated Page: the app root fills the Page,
and `SafeArea` supplies padding for the status bar and home indicator. Hide
the native action bar when the Page should cover the whole window.

```ts
import { Application, Frame, Page } from '@nativescript/core'
import { renderNativeScriptApp } from '@nativescript-community/octane'
import { prepareFullScreenPage } from '@octane-xplat/ui/nativescript'
import { App } from './App.tsrx'

Application.run({ create: () => {
	const frame = new Frame()
	const page = prepareFullScreenPage(new Page())
	page.actionBarHidden = true
	renderNativeScriptApp(page, App)
	frame.navigate({ create: () => page })

	return frame
} })
```

`Screen` fills the space its parent gives it; it does not require a
window-origin host or add safe-area padding itself. With the prepared Page
above, put `SafeArea` inside the Screen to keep controls clear of the system
bars. A Frame embedded in another native view still occupies that view's
bounds; preparing its Page does not enlarge the containing host. Avoid adding
negative inset margins to compensate for a prepared Page.

```tsx
import { SafeArea, Screen, Text } from '@octane-xplat/ui'

export function App() {
	return <Screen><SafeArea><Text>Inside the safe area</Text></SafeArea></Screen>
}
```

### Text and keyboard actions

On experimental AppKit, standalone `TextInput`, `TextArea` and `SearchInput`
render their label, description and status through the native Field wrapper.
Inside an existing `Field`, that parent owns the visible messages. Field width
sizes the wrapper; an explicit `style` still styles the input itself. Accessible
names, hints and required/error state are mapped, while VoiceOver and actual
native presentation remain unqualified.

```tsx
import { TextInput } from '@octane-xplat/ui'

export function ProfileName() {
	return <TextInput label="Name" description="Shown on your profile" width={280}
		isRequired status={{ type: 'error', message: 'Enter a name' }} />
}
```

AppKit text controls defer a different controlled value while the native editor
has marked text. The latest supplied value applies on a later turn after commit,
unless a newer matching `onChange` echo supersedes it. Unsetting the value or
removing the view cancels pending work. Changed writes reuse the view and clamp selection when the same editor survives
the setter. They make no focus request or public change callback. Real IME, selection and event timing remain unqualified.

```tsx
import { useState } from 'octane'
import { TextInput } from '@octane-xplat/ui'

export function Name() {
	const [value, setValue] = useState('')
	return <TextInput label="Name" value={value} onChange={setValue} />
}
```



`TextArea` keeps Return as a newline. On web, Cmd/Ctrl+Enter submits it.
On iOS, Android and experimental AppKit, submission is enabled only with
`returnKeyType="done"` or `returnKeyType="send"`; other Return keys insert
a newline. Keep `value` updated from `onChange`; the
[text-entry guide](text-entry.md) explains how.

```tsx
import { TextArea } from '@octane-xplat/ui'
import { useState } from 'octane'

export function Example() {
	const [note, setNote] = useState('')

	return (
		<TextArea
			label="Note"
			value={note}
			onChange={setNote}
			returnKeyType="done"
			onSubmit={() => console.log('Submitted')}
		/>
	)
}
```

Some keyboards compose a character over several keystrokes, such as when
entering Japanese text. This is called **IME composition**. Web inputs do
not submit when Enter confirms a composed character. Avoid rewriting text
while composition is in progress. AppKit's multiline submit delegate leaves
marked-text confirmation to its input context; real IME behavior remains
unqualified. Check the actual platform keyboards your app needs.

In the browser, Tab can focus a `Pressable`, and Enter or Space activates it.
`disabled` prevents activation and removes it from Tab navigation. Give an
action an `accessibilityLabel` when its visible content does not name it,
so a screen reader can describe it. Native accessibility behavior has
[separate checks](../../.agents/docs/notes/platform-notes.md#a11y-prop-map-shared-prop--leaf-attrs).

```tsx
import { Pressable, Text } from '@octane-xplat/ui'

export function Example() {
	return (
		<Pressable disabled accessibilityLabel="Save note" onPress={() => console.log('Saved')}>
			<Text>Save</Text>
		</Pressable>
	)
}
```

### Focus behavior

`useFocus` composes focus callbacks, and `useFocusWithin` reports when focus
enters or leaves a group. On web, their callbacks receive a typed
`FocusEventPayload`; on NativeScript and macOS, controls may call them without
an event. Web and experimental AppKit containers track descendants; check
`isSubtreeTrackingSupported` before relying on group behavior.

This example uses browser elements. Save it as `FocusExample.web.tsx` and
import it only from a web screen; see [platform files](../platform/module-resolution.md)
when a shared screen needs a separate native implementation.

```tsx
/** @jsxImportSource @octane-xplat/jsx/dom */
import { useFocus, useFocusWithin } from '@octane-xplat/ui'

export function FocusExample() {
	const focus = useFocus({ onFocus: (event) => console.log(event?.type) })
	const within = useFocusWithin({ onFocusWithin: (event) => console.log(event?.type) })

	return (
		<div {...within.focusWithinProps}>
			<button {...focus.focusProps}>Continue</button>
		</div>
	)
}
```

On AppKit, attach `focusWithinProps` to a raw native container in a `.macos.tsrx`
file. Shared `View` does not forward these handlers. The renderer observes the
window's first responder and emits one entry and one exit when focus crosses
the container boundary, including shared text-field editors. Moving between
descendants stays inside the group. This tracks responder ownership within one
window; separate popup windows and app activation need their own handling.
Window-update notifications may coalesce transient responder changes.
Observer availability is not runtime qualification: real Tab, clicks, IME,
VoiceOver and packaging have not been verified.

```tsx
/** @jsxImportSource @octane-xplat/jsx */
import { useFocusWithin } from '@octane-xplat/ui'

export function NameGroup() {
	const within = useFocusWithin({ onFocusWithinChange: (inside) => console.log(inside) })
	return <masonview {...within.focusWithinProps}>
		<textfield placeholder="First name" />
		<textfield placeholder="Last name" />
	</masonview>
}
```

On web and experimental AppKit, `useFocusVisible` identifies keyboard, pointer,
or unknown input modality. AppKit observes unmodified key presses and mouse
buttons without consuming events; app deactivation resets it to unknown.
Hook readers share one monitor and the last unmount releases it. AppKit's
`isSupported` reflects native bridge availability, not OS-input qualification.
NativeScript still reports false and unknown; `useFocusRing` exposes support
through `isFocusVisibleSupported`. `FocusScope` reports containment, autofocus,
restoration, and nested-scope support. Web supports the first three but does
not stack nested scopes. AppKit implements all four when its native bridge is
available; the default NativeScript leaf still reports all four false.
AppKit physical input, focus callbacks, focus appearance and VoiceOver remain
unqualified.

```tsx
import { FocusScope, Text, getFocusScopeCapabilities, useFocusVisible } from '@octane-xplat/ui'

export function ScopedContent() {
	const scope = getFocusScopeCapabilities()
	const modality = useFocusVisible()

	return (
		<FocusScope
			contain={scope.contain}
			autoFocus={scope.autoFocus}
			restoreFocus={scope.restoreFocus}
		>
			<Text>
				{modality.isSupported ? `Input: ${modality.inputModality}` : 'Focus modality unavailable'}
			</Text>
		</FocusScope>
	)
}
```

For a synchronous global read, AppKit's `isFocusVisible()` starts observation
and retains it for the module's lifetime (HMR disposes it). It does not subscribe
the caller to updates; use the hook for rendering. Neither API moves focus.

```ts
import { isFocusVisible } from '@octane-xplat/ui'

const lastInputWasKeyboard = isFocusVisible()
```

On AppKit, scopes traverse enabled, visible native views in native subview order.
The innermost containing scope owns Tab within its window; modified shortcuts
and IME composition pass through. An empty scope can receive programmatic focus
without becoming an ordinary Tab stop or gaining a click action. Restoration
returns to the saved native control when it still belongs to the window,
without overriding a newer independent scope. Only native descendants in that
window participate; hosted editors and separate popup windows need their own
owners. These behaviors are implemented but real OS input, focus appearance,
IME and VoiceOver remain unqualified.

```tsx
import { FocusScope, TextInput } from '@octane-xplat/ui'

export function Details() {
	return <FocusScope contain autoFocus restoreFocus accessibilityLabel="Details">
		<TextInput label="Name" />
		<TextInput label="Notes" />
	</FocusScope>
}
```

### Reusable rows

`Item` is a reusable, self-drawn row for settings, preferences, and
compact navigation lists. Use `startContent`, `label`, `description`, and
`endContent` for the common shape, or compose `StartContent`, `Content`,
`Description`, and `EndContent` slots for richer content. These content roles
match `ListItem`. `Item` works by itself or inside `FieldGroup`; the row owns
its layout and press behavior, while
`FieldGroup` remains the field container. See the maintained
[ListDemo](../../packages/demos/src/ListDemo.tsrx) for both forms. Press a row
with an action and verify one callback; disable it and verify the action
stays unchanged.

```tsx
import { Item, FieldGroup, Text } from '@octane-xplat/ui'

export function Example() {
	return (
		<FieldGroup>
			<Item
				label="Notifications"
				description="Daily reminders"
				startContent={<Text>•</Text>}
				endContent={<Text>Off</Text>}
				onPress={() => console.log('Open reminders')}
			/>
			<Item>
				<Item.StartContent>
					<Text>•</Text>
				</Item.StartContent>
				<Item.Content>
					<Text>Account</Text>
					<Item.Description>Profile settings</Item.Description>
				</Item.Content>
				<Item.EndContent>
					<Text>›</Text>
				</Item.EndContent>
			</Item>
			<Item label="Managed setting" isDisabled onPress={() => console.log('Not called')} />
		</FieldGroup>
	)
}
```

**Migrating existing code:** Rename `title` to `label`, `supportingText` to
`description`, `leading` to `startContent`, `trailing` to `endContent`, and
`disabled` to `isDisabled`. Rename the compound slots `Item.Leading`,
`Item.Supporting`, and `Item.Trailing` to `Item.StartContent`,
`Item.Description`, and `Item.EndContent`; `Item.Content` stays the same.

`List` and `ListItem` describe bounded content, such as a short set of steps
or notices. `List` is rendered in full and is not a data-windowing or native
OS-list wrapper; use `VirtualList` for long collections and the `ui/ios` or
`ui/android` subpath when OS list behavior is required. `listStyle` selects
`none`, `disc`, `circle`, or `decimal` markers; `ListItem` supplies its label,
optional description, start and end content, and optional action or
link. Native leaves draw markers and dividers because NativeScript has no
matching semantic list element. The shared [ListDemo](../../packages/demos/src/ListDemo.tsrx)
shows content `List` separately from settings `Item`.
On web, actionable `ListItem` rows use one anchor/button Tab stop; disabled
rows do not activate. Give rich row labels an `accessibilityLabel` when the
visible content does not name the action. `edgeCompensation="inline"` uses
container padding tokens on web and is ignored on native.

```tsx
import { List, ListItem, Text } from '@octane-xplat/ui'

export function Example() {
	return (
		<List listStyle="decimal" hasDividers>
			<ListItem
				label="Pack shoes"
				description="One pair"
				startContent={<Text>✓</Text>}
				endContent={<Text>Ready</Text>}
				onPress={() => console.log('Shoes')}
			/>
			<ListItem label="Pack coat" isDisabled onPress={() => console.log('Coat')} />
		</List>
	)
}
```

On web, Tab to an actionable row and use Enter or Space to activate it.
Rows without an action are outside the Tab sequence. Check the disabled row
in the demo too: it must neither activate nor become a keyboard Tab stop.

### Grouped fields

Use `FormLayout` to arrange `Field` or `InputGroup` children. A nested
`FormLayout` inherits `defaultOptionality` unless it sets its own value;
explicit field state still wins over that default. `InputGroup` provides one
label and description for a joined control; put prefix/suffix text or icons in
`InputGroupText`, then place the input beside it. The group's `size` is a
default that a control's explicit `size` can override; omit child sizes for
a uniform group. The group's disabled state remains enforced. This is layout
and accessibility grouping only: `FormLayout` does not render a browser
`<form>` or provide submit behavior. `InputGroup` uses a web `role="group"`;
NativeScript has no corresponding group role. The [grouped field example](../../packages/demos/src/ComponentsDemo.tsrx)
shows this composition.

```tsx
import { FormLayout, Field, InputGroup, InputGroupText, TextInput } from '@octane-xplat/ui'
import { useState } from 'octane'

export function Example() {
	const [name, setName] = useState('')

	return (
		<FormLayout defaultOptionality="required">
			<Field label="Name" isOptional>
				<TextInput value={name} onChange={setName} />
			</Field>
			<InputGroup label="Website" description="Your profile link" size="sm" isDisabled>
				<InputGroupText>https://</InputGroupText>
				<TextInput value="example.com" size="md" isDisabled={false} />
			</InputGroup>
			<FormLayout defaultOptionality="optional">
				<Field label="Nickname">
					<TextInput />
				</Field>
				<Field label="Work email" isRequired>
					<TextInput />
				</Field>
			</FormLayout>
		</FormLayout>
	)
}
```

### Native modifiers and glyphs

Keep this example in an `.ios.tsx`/`.ios.tsrx` file; use the Android
subpath in `.android.*`.

Native platform widgets accept a `modifiers` array for OS-specific styling or
properties. Import `modifier` from the matching `@octane-xplat/ui/ios` or
`@octane-xplat/ui/android` subpath and keep that configuration in a matching
platform file. `PlatformIcon.select({ ios, android })` chooses a native asset for
`UITabBar` or `BottomNavigationView`; the shared `Icon` component is unchanged.
These selectors and modifiers are escape hatches for platform-authentic
widgets, not shared styling props.

```tsx
/** @jsxImportSource @octane-xplat/jsx */
import { PlatformIcon, UITabBar, modifier } from '@octane-xplat/ui/ios'
import { Text } from '@octane-xplat/ui'

function Saved() {
	return <Text>Saved trips</Text>
}

export function SavedTabs() {
	return (
		<UITabBar
			tabs={[
				{
					title: 'Saved',
					icon: PlatformIcon.select({ ios: 'heart.fill', android: 'favorite' }),
					render: Saved,
				},
			]}
			modifiers={[modifier.opacity(0.98)]}
		/>
	)
}
```

### Implementation map

| Component                   | Web element                  | iOS NativeScript view                         | Android NativeScript view              | Normalization class   |
| --------------------------- | ---------------------------- | --------------------------------------------- | -------------------------------------- | --------------------- |
| `Item`                      | `div` via shared `Pressable` | `FlexboxLayout` via shared `Pressable`        | `FlexboxLayout` via shared `Pressable` | `self-drawn`          |
| `SafeArea`                  | `div`                        | `FlexboxLayout`                               | `FlexboxLayout`                        | shared layout wrapper |
| `WebView`                   | sandboxed `iframe`           | `webview` → WKWebView                         | `webview` → android.webkit.WebView     | `hosted`              |
| `UITableView`               | unavailable                  | `listview` → UITableView                      | unavailable                            | `platform-authentic`  |
| `RecyclerView`              | unavailable                  | unavailable                                   | `listview` → RecyclerView              | `platform-authentic`  |
| `UITabBar`                  | unavailable                  | `TabView` / UITabBarController                | unavailable                            | `platform-authentic`  |
| `BottomNavigationView`      | unavailable                  | unavailable                                   | `TabView`                              | `platform-authentic`  |
| `UISwitch`                  | unavailable                  | `switch` → UISwitch                           | unavailable                            | `platform-authentic`  |
| `MaterialSwitch`            | unavailable                  | unavailable                                   | `switch` → SwitchMaterial              | `platform-authentic`  |
| `UISlider`                  | unavailable                  | `slider` → UISlider                           | unavailable                            | `platform-authentic`  |
| `SeekBar`                   | unavailable                  | unavailable                                   | `slider` → SeekBar                     | `platform-authentic`  |
| `UIActivityIndicatorView`   | unavailable                  | `activityindicator` → UIActivityIndicatorView | unavailable                            | `platform-authentic`  |
| `CircularProgressIndicator` | unavailable                  | unavailable                                   | `activityindicator` → ProgressBar      | `platform-authentic`  |
| `SideDrawer`                | unavailable                  | ui-drawer host view                           | unavailable                            | `platform-authentic`  |
| `DrawerLayout`              | unavailable                  | unavailable                                   | ui-drawer host view                    | `platform-authentic`  |
| `LiquidGlass`               | unavailable                  | NativeScript glass effect view                | unavailable                            | `platform-authentic`  |
| `LiquidGlassContainer`      | unavailable                  | NativeScript glass effect view                | unavailable                            | `platform-authentic`  |

The platform-authentic rows intentionally have no web counterpart. Their
native modifiers and glyph names stay behind platform subpaths; they do not
change the shared components' parity class.

`Pressable`, `Text`, and the containers (`View`/`HStack`/`Stack`/`Absolute`/
`Grid`/`ScrollableArea`) share the accessibility props in the
platform map, including `accessible`, label, hint, value, role, state, and
live region — a container can carry `accessibilityRole`/live-region for
grouped announcements without reaching for the `web` escape bag. Role
names stay portable; the native leaf translates names such as `heading` to
NativeScript's `header`.

```tsx
import { View, Text } from '@octane-xplat/ui'

export function Example() {
	return (
		<View
			accessible
			accessibilityRole="summary"
			accessibilityLiveRegion="polite"
			accessibilityLabel="Packing progress"
		>
			<Text>Two items packed</Text>
		</View>
	)
}
```

For mixed formatting or inline links, compose `RichText` with
`RichTextSpan` children. Each span can carry its own `className`, `style`, and
`onPress`; the native leaf maps the runs to NativeScript `FormattedString`
spans and uses the span's `text` prop for driver compatibility.

```tsx
import { RichText, RichTextSpan } from '@octane-xplat/ui'

export function Example() {
	return (
		<RichText>
			<RichTextSpan text="Read " />
			<RichTextSpan text="the guide" className="link" onPress={() => console.log('Open guide')} />
		</RichText>
	)
}
```

## When a screen needs more

For a small or bounded list, render `items.map(...)` inside a `ScrollableArea`.
For a short content list with labels, descriptions, markers, and optional row
actions, use `List` + `ListItem`; it is not virtualized.
For larger vertical data sets that need bounded rendering across targets, use
the shared `VirtualList`: it measures variable row heights and renders the
viewport plus one viewport of overscan. Rows outside that window unmount, so
keep durable row state outside the row and key it by item identity.
`getItemType` contributes to row identity but does not enable cell recycling.
The shared list does not promise FlashList-level performance; fast-scroll and
long-session budgets remain open.

```tsx
import { ScrollableArea, List, ListItem, Text, VirtualList } from '@octane-xplat/ui'

export function Example() {
	const items = [{ id: 'coat', title: 'Coat' }]

	return (
		<>
			<ScrollableArea>
				{items.map((item) => (
					<Text>{item.title}</Text>
				))}
			</ScrollableArea>
			<List>
				<ListItem label="Coat" />
			</List>
			<VirtualList
				className="item-viewport"
				items={items}
				keyExtractor={(item) => item.id}
				renderItem={(item) => <Text>{item.title}</Text>}
			/>
		</>
	)
}
```

Use `UITableView` (`ui/ios`) or `RecyclerView` (`ui/android`) when their
platform-authentic list behavior is what the app needs. A native platform list
must not sit inside a vertically scrolling `ScrollableArea` — NativeScript
measures a vertical `ScrollView` child without a bounded height, which makes the nested list
prepare cells through an unsupported path; the list leaf throws a named error
on that nesting. Wrap the list in `ScrollableArea axis="both"` (a scrolling
viewport on web and an inline shell on native) so the list owns scrolling.
_VirtualList anchor correction and slots verified on web, iOS simulator, and
Android emulator; native nested-list guard verified on iOS._

```tsx
/** @jsxImportSource @octane-xplat/jsx */
// Items.ios.tsrx
import { UITableView } from '@octane-xplat/ui/ios'
import { ScrollableArea, Text } from '@octane-xplat/ui'

const items = [{ id: 'coat', title: 'Coat' }]

const renderItem = (item: (typeof items)[number]) => <Text>{item.title}</Text>

export function Items() {
	return (
		<ScrollableArea axis="both">
			<UITableView items={items} renderItem={renderItem} />
		</ScrollableArea>
	)
}
```

`Pager` gives paged horizontal swiping — onboarding flows, media galleries.
It ships as the `@octane-xplat/pager` leaf — `pnpm add @octane-xplat/pager`
and import `Pager` from that package; the `ui-pager` plugin travels as the
leaf's own dependency, so apps declare nothing extra. It takes `items` +
`renderItem` (the same contract as the platform lists),
`page`/`onPageChange` for controlled use, `defaultPage` for uncontrolled.
Native pages are recycled OS cells, so pages need no fixed height of their
own — each fills the pager. There is no built-in page indicator; compose
dots from `HStack` + `Pressable` driven by the page index (see the `pager`
demo). The web leaf is a scroll-snap row; `onPageChange` fires after the
snap settles.

```tsx
import { Pager } from '@octane-xplat/pager'
import { Text } from '@octane-xplat/ui'

const pages = ['Welcome', 'Pack a bag']

const renderPage = (page: string) => <Text>{page}</Text>

export function Onboarding() {
	return (
		<Pager
			items={pages}
			renderItem={renderPage}
			defaultPage={0}
			onPageChange={(page) => console.log(page)}
		/>
	)
}
```

`SegmentedControl` is a self-drawn row of equal-width segments — the
normalized shape of UISegmentedControl / Material segmented buttons, with
no OS chrome. It takes `options` (the `RadioOption` shape), `value` +
`onValueChange` for controlled use or `defaultValue` for uncontrolled, and
`isDisabled` per-option or on the group. Field-like controls also accept
`label`, `description`, `isReadOnly`, `isRequired`, `isOptional`, `size`,
`status`, and `isLoading`; see [Inputs](components.md#inputs) for the shared
state contract.

```tsx
import { SegmentedControl } from '@octane-xplat/ui'
import { useState } from 'octane'

export function Example() {
	const [filter, setFilter] = useState('all')

	return (
		<SegmentedControl
			label="Items"
			options={[
				{ value: 'all', label: 'All' },
				{ value: 'packed', label: 'Packed', isDisabled: true },
			]}
			value={filter}
			onValueChange={setFilter}
		/>
	)
}
```

`SearchInput` is a chrome-reset search field — TextInput with a leading
glyph and a clear button, styled the same on every target (not
UISearchBar). `value`/`onChange`/`onSubmit`/`onClear` are controlled like
TextInput; `defaultValue` makes it uncontrolled. The leading glyph is an
`Icon` — `icon` names a registered glyph (default `'xplat-search'`, a
framework-provided one any app can override by registering the same name).

```tsx
import { SearchInput } from '@octane-xplat/ui'
import { useState } from 'octane'

export function Example() {
	const [query, setQuery] = useState('')

	return (
		<SearchInput
			label="Find items"
			value={query}
			onChange={setQuery}
			onSubmit={() => console.log('Submitted')}
			onClear={() => console.log('Cleared')}
		/>
	)
}
```

Experimental AppKit now renders the default/custom search icon; `icon={false}`
omits it. `TextInput.startIcon` also accepts a registered name or a rendered
node, and `placeholderTextColor` reaches the AppKit field. An omitted search
placeholder stays omitted; supply your own text when needed. These are source
contracts; native glyph presentation, spacing, pointer behavior and accessibility
still need platform qualification.

```tsx
import { SearchInput, TextInput } from '@octane-xplat/ui'

export function Filters() {
	return <>
		<SearchInput label="Find items" icon={false} placeholder="Search by name" />
		<TextInput label="Account" startIcon="xplat-check" placeholder="Name"
			placeholderTextColor="#68707e" />
	</>
}
```


Use `Dialog` for modal content, `AlertDialog` when the user must choose an
action, `BottomSheet` for bottom-anchored content, `Overlay` for floating
content, or `Popover` for anchored content. Dialog and BottomSheet visibility
uses `isOpen`/`onOpenChange`; `showToast({ body })` or `useToast()` presents a
transient notification. Pass the data the content needs as props. BottomSheet
`snapPoints` (viewport-height fractions like `[0.25, 0.5, 1]`) turns the panel
into a snap-point surface — it opens at the smallest stop and drags between
them via a self-drawn grabber. The platform's own modal presentation is `UIModal`/`MaterialDialog`

```tsx
import {
	Screen,
	Dialog,
	AlertDialog,
	BottomSheet,
	Overlay,
	Popover,
	View,
	Text,
} from '@octane-xplat/ui'
import { useState, useRef } from 'octane'

export function Example() {
	const [open, setOpen] = useState(false)
	const anchor = useRef(null)

	return (
		<Screen>
			<View
				ref={(view) => {
					anchor.current = view
				}}
			>
				<Text>Anchor</Text>
			</View>
			<Dialog isOpen={open} onOpenChange={setOpen}>
				<Text>Details</Text>
			</Dialog>
			<AlertDialog
				title="Remove item?"
				actionLabel="Remove"
				isOpen={false}
				onOpenChange={() => {}}
				onAction={() => console.log('Removed')}
			/>
			<BottomSheet label="Actions" isOpen={false} snapPoints={[0.25, 0.5]}>
				<Text>Actions</Text>
			</BottomSheet>
			<Overlay open={false}>
				<Text>Floating content</Text>
			</Overlay>
			<Popover anchor={anchor} open={false}>
				<Text>Anchored content</Text>
			</Popover>
		</Screen>
	)
}
```

- `openModal` in the subpaths — there is no shared `Modal`.

On web, iOS, and Android, `ScrollableArea` and the platform lists
(`UITableView`, `RecyclerView`) accept `refreshing`, `onRefresh`, and
`refreshThreshold` for pull-to-refresh.
`onRefresh` enables the gesture; `refreshing` is controlled — set it while
reloading and the self-drawn `Spinner` strip stays docked above
the content. There is no OS spinner anywhere in the path.

```tsx
import { ScrollableArea, Text } from '@octane-xplat/ui'
import { useState } from 'octane'

export function Example() {
	const [refreshing, setRefreshing] = useState(false)
	async function reload() {
		setRefreshing(true)
		try {
			await Promise.resolve()
		} finally {
			setRefreshing(false)
		}
	}

	return (
		<ScrollableArea refreshing={refreshing} refreshThreshold={64} onRefresh={reload}>
			<Text>Items</Text>
		</ScrollableArea>
	)
}
```

`HoverCard` (delayed hover card) shows `content` on pointer platforms — web
and macOS. Its touch behavior is controlled by `touchTrigger`; keep essential
information available in the trigger. `Tooltip` remains a hint-only
enhancement.

```tsx
import { HoverCard, Text } from '@octane-xplat/ui'

export function Example() {
	return (
		<HoverCard content={<Text>Updated today</Text>} touchTrigger="tap">
			<Text>Report — updated today</Text>
		</HoverCard>
	)
}
```

`Tooltip` remains a hint-only enhancement. It takes `trigger` +
`content` slots and, on web, opens on hover after `openDelay` and
immediately on keyboard focus, wires `aria-describedby` onto the focusable
trigger, and dismisses on Escape, blur, or scroll. Positioning rides the
shared `Popover` machinery (`placement`, default `top`). On macOS the hint
is an anchored `NSPopover`. On touch targets only the `trigger` renders —
keep essential information out of `content`, or compose
`Pressable` + `Popover`/`BottomSheet` for an explicit tap-to-reveal hint.

```tsx
import { Tooltip, Pressable, Text } from '@octane-xplat/ui'

export function Example() {
	return (
		<Tooltip
			placement="top"
			openDelay={300}
			trigger={
				<Pressable onPress={() => console.log('Save')}>
					<Text>Save</Text>
				</Pressable>
			}
			content={<Text>Save your changes</Text>}
		/>
	)
}
```

Use `useMeasure()` when a screen needs live element bounds:
`const { ref, bounds } = useMeasure()`, then pass `ref` to a primitive's
`ref` prop. Bounds are observed by default and are `null` before the element
has a usable layout — that `null` is the readiness signal, so render
fallbacks while it holds. `x` and `y` are dips from the top-left of the
app surface — the web viewport, the macOS window's content area, or the
app's root surface on iOS/Android — the same coordinate space on every
target. Set `{ observe: false }` for a
single read after binding.

```tsx
import { View, Text, useMeasure } from '@octane-xplat/ui'

export function Example() {
	const { ref, bounds } = useMeasure({ observe: false })

	return (
		<View ref={ref}>
			<Text>Width: {bounds?.width ?? 0}</Text>
		</View>
	)
}
```

`ToastViewport` owns toast position and visibility limits. `showToast({ body,
position, anchor, placement })` returns a `ToastHandle` — `dismiss()` closes
the toast, `update(options)` rewrites it in place — or `null` when a
`collisionBehavior: 'ignore'` duplicate suppressed it; `useToast()` routes
to the nearest viewport or the fallback viewport. Anchored toasts follow
`Popover`'s platform-specific overlay behavior.

```tsx
import { ToastViewport, Pressable, Text, useToast } from '@octane-xplat/ui'

export function Example() {
	const toast = useToast()

	return (
		<ToastViewport position="bottomEnd">
			<Pressable onPress={() => toast({ body: 'Saved' })}>
				<Text>Save</Text>
			</Pressable>
		</ToastViewport>
	)
}
```

### WebView content sizing

`WebView` embeds a web document — `src` for a URL, `html` for an inline
document — with `onLoad`/`onError`, `scrollEnabled`, and a `ref` handle for
`reload`/`goBack`/`goForward`. `matchContents` sizes the frame height to its
document and `onLayoutContent` reports measured content dimensions. Browser
measurement works only when the iframe document is same-origin; cross-origin
content cannot expose its internal size. On native, `onLayoutContent` reports
the web view's content size, and `matchContents` applies the measured height.
Wrap it in `SafeArea` and pass `edges={[]}` when the content should extend
under system safe areas. On web it is a sandboxed `<iframe>`
(default `allow-scripts allow-same-origin allow-forms allow-modals`, tunable
via the `sandbox` prop); on native it is the OS web view. The document itself
renders in each platform's engine, so parity applies to the frame's chrome,
not the page's pixels. There is deliberately no script-injection or
`postMessage` bridge — the three engines expose different page-side APIs, so
use the `ios:`/`android:`/`web:` escape bags for that.

```tsx
import { useRef } from 'octane'
import { SafeArea, WebView, Pressable, Text } from '@octane-xplat/ui'

export function Example() {
	const browser = useRef<import('@octane-xplat/ui').WebViewHandle | null>(null)

	return (
		<SafeArea>
			<WebView
				src="https://example.com"
				matchContents
				scrollEnabled={false}
				onLoad={() => console.log('Loaded')}
				onError={(error) => console.log(error)}
				onLayoutContent={(size) => console.log(size)}
				ref={(handle) => {
					browser.current = handle
				}}
			/>
			<Pressable onPress={() => browser.current?.reload()}>
				<Text>Reload</Text>
			</Pressable>
		</SafeArea>
	)
}
```

On AppKit macOS, the same component embeds `WKWebView` inside the native
screen. For example:

```tsx
import { WebView } from '@octane-xplat/ui'

;<WebView
	html="<html><body><h2>Hello from a document</h2></body></html>"
	style={{ width: 320, height: 180 }}
	onLoad={() => console.log('Document loaded')}
	onError={(event) => console.error(event.error)}
	onLayoutContent={(size) => console.log(size.width, size.height)}
/>
```

Set exactly one document source — `src` and `html` are mutually exclusive;
passing both (or neither) is a compile-time error. To switch sources
conditionally, spread one of them:

```tsx
<WebView {...(remote ? { src: url } : { html: INLINE_HTML })} />
```

Set
`matchContents` to apply the measured height after a successful load. AppKit
measures after loading and when measurement props change; later changes made
by page scripts are not continuously observed. A document's viewport can set a
minimum measured height. Use the maintained
[WebView demo](../../packages/demos/src/WebViewDemo.tsrx) to try sizing and navigation.
`scrollEnabled={false}` applies hidden document overflow to freeze inner scrolling;
it does not prevent a page script from scrolling. `sandbox` is browser-only.
The ref's `native` is the WKWebView itself. `reload()` reloads the current
remote or file page; for `html`, it submits the supplied HTML again. AppKit
`SafeArea` is a neutral wrapper, so `edges` adds no desktop inset. Removing the component stops loading,
clears the delegate and ref, and ignores pending measurements.

This embedded component does not install a service bridge. To run an entire
DOM app in a macOS webview window, use the separate
[desktop-webview app-shell workflow](../platform/macos-webview.md).

### Fit and position an image

`Image` sizes its bitmap to its box with `contentFit` — the CSS `object-fit`
vocabulary: `'cover'` (default — fill the box, crop the overflow),
`'contain'` (letterbox the whole image), `'fill'` (stretch to the box),
`'none'` (intrinsic size), or `'scale-down'` (like `contain`, but never
larger than the source). `contentPosition` moves the bitmap inside the box:
a keyword like `'top left'` or an object naming edges
(`{ top: 0, right: '25%' }`). Both behave identically on web and native —
the native leaf computes the same rect the browser would.

```tsx
import { Image } from '@octane-xplat/ui'

;<Image
	src="https://example.com/team-photo.jpg"
	alt="Team at the offsite"
	contentFit="cover"
	contentPosition="top center"
	style={{ width: 200, height: 120 }}
/>
```

`src` also accepts a resolution array — the closest pixel count to the
laid-out view wins (the `srcset` model; web emits a real `srcset`):

```tsx
<Image
	src={[
		{ uri: 'https://example.com/hero-400.jpg', width: 400, height: 300 },
		{ uri: 'https://example.com/hero-1200.jpg', width: 1200, height: 900 },
	]}
	alt="Hero"
	contentFit="cover"
/>
```

### Video playback

`Video` plays a clip — `src`, `poster`, `playing`/`onPlayingChange` (or
`autoPlay` for uncontrolled start), `muted`, `loop`, `fit`
(`contain`/`cover`/`fill`), and a `ref` handle for `play`/`pause`/
`seekTo`/`currentTime`/`duration`. All transport chrome is self-drawn —
tap the frame to show/hide it — so the controls are identical on every
target while the video pixels stay in each platform's player engine.
`Video` ships as the `@octane-xplat/video` leaf — `pnpm add
@octane-xplat/video` and import `Video` from that package; the
`@nstudio/nativescript-exoplayer` plugin travels as the leaf's own
dependency, so apps declare nothing extra.
Times are milliseconds everywhere, including `onReady`'s duration. Use the
maintained [VideoDemo](../../packages/demos/src/VideoDemo.tsrx) for a bounded
player and play/pause controls. Check that playback advances, pause holds the
position, and resume continues. Native player failures do not emit `onError`;
see [video limits](../testing/known-limits.md#primitives) before designing error UI.

```tsx
import { Video } from '@octane-xplat/video'

export function Clip() {
	return (
		<Video
			src="https://example.com/clip.mp4"
			poster="https://example.com/poster.jpg"
			autoPlay
			muted
			loop
			fit="contain"
		/>
	)
}
```

### Lottie animations

`Lottie` plays a Lottie animation — `src` (URL; mobile native also accepts `~/`
bundle paths, absolute files, `res://` names, `.lottie` containers, and raw
`{`-JSON) or `data` (inline animation object), `autoPlay`, `loop`,
`playing`, `progress` (normalized 0..1), `speed`, `fit`
(`contain`/`cover`/`fill`), `onLoaded`/`onEnded`/`onError`, and a `ref`
handle (`play`/`pause`/`stop`/`seekTo`/`setSpeed`/`progress`/`duration`/
`isPlaying`). It ships as the `@octane-xplat/lottie` leaf — `pnpm add
@octane-xplat/lottie`. `lottie-web` is a real dependency; the NativeScript
plugin is vendored in the leaf (`src/vendor/ui-lottie` — a git submodule of
`octane-xplat/ui-lottie`, branch `xplat-vendored`). AppKit compiles Airbnb
Lottie 4.6.1 from the leaf's pinned Swift source; apps add no engine dependency.
Durations are milliseconds and progress is 0..1 on every target — the
plugin reports seconds and the leaf normalizes. Use the maintained
[LottieDemo](../../packages/demos/src/LottieDemo.tsrx) for bounded playback
controls. The vendored plugin carries fixes unreleased upstream (load
events, sync-src, remote URLs, `declare` fields for modern bundlers); see
[lottie limits](../testing/known-limits.md#primitives) before designing error UI.
On web, `lottie-web` evaluates JavaScript expressions embedded in animation
data. Load only trusted animation data. Expression-bearing files require a
Content Security Policy that allows `unsafe-eval`; do not weaken a site's CSP
to load untrusted animations.

```tsx
import { Lottie } from '@octane-xplat/lottie'

export function Celebration() {
	return (
		<Lottie
			src="https://example.com/celebration.json"
			autoPlay
			loop={false}
			speed={1}
			fit="contain"
		/>
	)
}
```

The experimental native macOS AppKit target does not play Lottie animations.
It renders an unsupported label and calls `onError` on mount. It supplies no
playback handle and does not emit `onLoaded` or `onEnded`. The macOS WKWebView
renderer uses the web implementation instead.

AppKit supports inline `data`, raw JSON in `src`, absolute JSON file paths,
`file://` URLs, and HTTPS JSON URLs. It rejects relative paths, `~/` and
`res://` aliases, HTTP URLs, `.lottie`/`.zip` archives, and external image
assets. `ref.native` is the AppKit `LottieAnimationView`. The WKWebView frontend
uses the web implementation instead. See [known limits](../testing/known-limits.md#primitives)
and the [AppKit integration record](../../.agents/docs/notes/lottie-appkit-investigation.md) for the
source boundary and runtime evidence.

### Camera preview

`CameraView` is a live camera preview — `facing` (`'back'`/`'front'`),
`active` to start/stop, `onReady`/`onError`, and a `ref` handle for the
platform view. Add `@octane-xplat/camera` to the app with
`pnpm add @octane-xplat/camera` and import `CameraView` from that package. The
leaf requests permission when the preview starts and includes the iOS camera
usage description and Android camera permission in its platform files; no
separate camera plugin is needed. Setting `active` to `false` stops the
preview. Stills deliberately go through `media.capturePhoto` in
`@octane-xplat/platform`, not this widget. Use the maintained
[CameraDemo](../../packages/demos/src/CameraDemo.tsrx) to check start/stop, lens
changes, and ready/error state. Browser preview needs a secure context
(HTTPS or localhost). Native `onReady` means the session started or bound,
not that a frame has appeared; see [camera limits](../testing/known-limits.md#primitives).

For tap-to-focus, the `onTap` prop reports the tapped point normalized to
the preview (`0`–`1`, top-left origin) without consuming the gesture, and
a session's `focusAtPoint` meters autofocus and auto-exposure there on
iOS, Android, and macOS — check `capabilities().focusPointOfInterest`
first, since front cameras are often fixed-focus:

```tsx
<CameraView session={session} onTap={(point) => session.focusAtPoint(point)} />
```

```tsx
import { CameraView } from '@octane-xplat/camera'

export function Preview() {
	return (
		<CameraView
			facing="back"
			active
			onReady={() => console.log('Ready')}
			onError={(error) => console.log(error)}
		/>
	)
}
```

If a component needs different markup on web and native, keep its public props
shared and split only its leaves. The [primitive notes](../../.agents/docs/notes/primitive-notes.md)
cover the less common components, accessibility details, and renderer limits.

### Camera sessions and movie recording

`createCameraSession` creates a shared camera owner — the same
`AVCaptureSession` can feed a `CameraView` preview and a movie-recording
attempt. Pass the session to `CameraView` via the `session` prop instead of
`facing`; the two are mutually exclusive. Recording is opt-in: preview-only
screens keep working exactly as before with no session.

```tsx
import { CameraView, createCameraSession } from '@octane-xplat/camera'

const session = createCameraSession({ camera: 'default' })

export function RecorderScreen() {
	return <CameraView session={session} />
}
```

A session owns at most one preview and one recording attempt. Start a take
once the session-backed preview is ready; `take.stop()` resolves only after
the movie is finalized on disk and its duration, dimensions, and orientation
are read back — a valid early stop is a successful partial clip
(`endReason: 'stopped'`, `partial: false`), not an automatic retry. Recording
survives view detachment, but the shared session means the app should keep
the session object alive for the capture's lifetime.

```ts
const take = session.startRecording({ maximumDurationMs: 30_000 })
const outcome = await take.stop()
if (outcome.kind === 'clip') {
	const clip = outcome.clip
	saveClip(clip.output.fileUrl, clip.durationMs, clip.width, clip.height)
}
```

Sessions are honest about what a host can do: `capabilities()` reports
`supported`, `available`, discovered cameras, and per-profile resolution
without prompting or acquiring hardware. Check it before showing capture UI —
on a host with no camera (a stock iOS simulator, say) `supported` is `false`
and `startRecording` rejects with a typed `CameraCaptureError` instead of
fabricating a lens.

```ts
// Continue with the camera session created above.
const caps = await session.capabilities()
if (caps.supported) {
	const permission = await session.requestPermission('camera')
	console.log(permission)
} else {
	console.log('Camera capture is unavailable on this host')
}
```

Output is a durable file in app-private storage (`nativeFile` output —
`fileUrl`/`path`), reopenable via `session.openOutput(output)` for playback
or sharing; the package never uploads, persists, or deletes clips. See the
[camera package README](../../packages/camera/README.md#movie-recording) for
the full contract: errors, interruption causes, and ownership rules. Android
and web session adapters are still pending — they reject with `unsupported`
until they land; see [known limits](../testing/known-limits.md#primitives).

## Move a scroll viewport

Use the portable `ScrollableAreaHandle` to move content to an absolute offset.
Offsets use browser pixels or native layout units, independent of screen pixel
density. Omitted axes keep their position. Request animation when useful;
Mason's iOS viewport currently moves instantly. On iOS, Android and Windows,
the `native` escape hatch exposes Mason's wrapper, which does not have
NativeScript ScrollView's offset methods.

```tsx
import { useRef } from 'octane'
import { Button, ScrollableArea, Text, View, type ScrollableAreaHandle } from '@octane-xplat/ui'

export function LongNotes() {
	const viewport = useRef<ScrollableAreaHandle | null>(null)

	return <View>
		<Button clickAction={() => viewport.current?.scrollToOffset({ block: 0 }, { animated: true })}>
			Back to the start
		</Button>
		<ScrollableArea ref={viewport} height={200} label="Trip notes">
			<Text>{Array.from({ length: 50 }, (_, index) => `Note ${index + 1}`).join('\n')}</Text>
		</ScrollableArea>
	</View>
}
```

## macOS scrolling and refresh

Give scrolling content a bounded viewport. `ScrollableArea` scrolls vertically
by default; choose `axis="inline"` for horizontal content or `axis="both"`
for content wider and taller than the viewport. Its object or callback `ref`
receives a `ScrollableAreaHandle` — `scrollToOffset({ inline, block })`
scrolls each logical axis to an absolute offset (AppKit points), and
`native` is the underlying `NSScrollView` for anything the handle does not
cover. The handle clears when the area is replaced or removed. Numeric
dimensions use AppKit points, independent of the display's pixel density.
Block offsets count from the top in either native coordinate orientation;
seeks clamp to the available range, and fitting content stays at zero. Missing
animator scrolling support falls back to an immediate seek. These source paths
still need real native scrolling, animation and resize qualification.

```tsx
import { useRef } from 'octane'
import { ScrollableArea, View, Text } from '@octane-xplat/ui'
import type { ScrollableAreaHandle } from '@octane-xplat/ui'

export function WideDetails() {
	const viewport = useRef<ScrollableAreaHandle | null>(null)

	return (
		<ScrollableArea ref={viewport} axis="both" width={320} height={240} label="Trip details">
			<View style={{ width: 640, height: 480 }}>
				<Text>A wide trip summary</Text>
			</View>
		</ScrollableArea>
	)
}

// Later: viewport.current?.scrollToOffset({ block: 0 }, { animated: true })
```

For a custom macOS viewport, `useScrollableArea` supplies refs and handlers
through its two prop getters. Its per-axis `state` reports overflow and the
start/end edges after layout, resizing, content changes, axis changes, and
scrolling. Pass a caller scroll handler to `getViewportProps`; it receives the
existing AppKit event once, after the hook updates its measured state. Layout
measurements alone do not invoke the caller scroll handler. Keep editable children
in charge of their editing keys; the hook does not intercept them.

```tsx
/** @jsxImportSource @octane-xplat/jsx */
// Details.macos.tsx
import { useScrollableArea } from '@octane-xplat/ui'

export function Details(props: { onScrolled: (atEnd: boolean, event: any) => void }) {
	const area = useScrollableArea({ axis: 'both' })

	return (
		<scrollview
			{...area.getViewportProps({
				style: { width: 320, height: 240 },
				onScroll: (event: any) => {
					props.onScrolled(area.state.block.atEnd, event)
				},
			})}
		>
			<flexboxlayout {...area.getContentProps({ style: { width: 640, height: 480 } })} />
		</scrollview>
	)
}
```

macOS has no built-in pull-to-refresh. Put a named refresh action outside the
viewport, disable it while loading, and show completion or failure text. The
app owns the reload function; replace `loadRows` with your data source. The
maintained [macOS scrolling demo](../../packages/demos/src/ScrollBoxDemo.macos.tsrx)
uses this pattern. Readable status text is available to accessibility readers;
automatic spoken status announcements and real keyboard/trackpad behavior
require separate platform verification.

```tsx
import { useState } from 'octane'
import { Pressable, ScrollableArea, Text, View } from '@octane-xplat/ui'

export function RefreshableRows(props: { loadRows: () => Promise<string[]> }) {
	const [rows, setRows] = useState<string[]>([])
	const [refreshing, setRefreshing] = useState(false)
	const [status, setStatus] = useState('Ready')
	async function refresh() {
		if (refreshing) return
		setRefreshing(true)
		setStatus('Refreshing rows')
		try {
			setRows(await props.loadRows())
			setStatus('Rows updated')
		} catch {
			setStatus('Could not refresh. Try again.')
		} finally {
			setRefreshing(false)
		}
	}

	return (
		<View>
			<Pressable disabled={refreshing} accessibilityLabel="Refresh rows" onPress={refresh}>
				<Text>{refreshing ? 'Refreshing…' : 'Refresh rows'}</Text>
			</Pressable>
			<Text accessibilityLabel={status}>{status}</Text>
			<ScrollableArea label="Rows" height={240}>
				{rows.map((row, index) => (
					<Text key={index}>{row}</Text>
				))}
			</ScrollableArea>
		</View>
	)
}
```

## Refs

Use Octane's ordinary `ref` prop. Layout and interaction primitives such as
`View` and `Pressable` forward it to their host. Controls such as `TextInput`,
`Calendar`, and `WebView` expose their documented imperative handle instead.
The handle's `native` field, where provided, is platform-specific; keep direct
host API calls in a platform file.

```tsx
import { useMemo, useRef } from 'octane'
import { Pressable, Text, TextInput, View, useMeasure } from '@octane-xplat/ui'
import type { TextInputHandle } from '@octane-xplat/ui'

export function FocusField() {
	const input = useRef<TextInputHandle | null>(null)
	const host = useRef<any>(null)
	const measurement = useMeasure()
	const refs = useMemo(() => [host, measurement.ref], [host, measurement.ref])

	return (
		<View ref={refs}>
			<TextInput label="Name" ref={input} />
			<Pressable onPress={() => input.current?.focus()}>
				<Text>Focus name</Text>
			</Pressable>
		</View>
	)
}
```

A ref can be an object with `current`, a callback, or an array of refs
(including nested arrays). Objects are set to `null` when detached. Callback
refs receive `null` when detached, or can return a cleanup function that runs
instead. Replacing a ref detaches the previous owner before attaching the new
one. Read handles from events or effects after mount, and handle `null` during
cleanup.

Hooks that attach to a host use the same prop: `useMeasure().ref`,
`useAnimation().ref`, intersection observation's `ref` and `rootRef`, and drag
and drop's `ref`. Combine them with an array when they need the same host. Keep
composed refs stable with `useMemo` when their callbacks update state, so a
render does not detach and attach them again. Forward a ref through your own
component as a normal prop, or use Octane's `useImperativeHandle` to expose a
custom handle.

A primitive's `ref` delivers `HostElement` — an opaque platform host: a DOM
element on web, a NativeScript view on iOS/Android, an AppKit view on macOS.
Cast it to the platform type before calling host APIs, inside a platform file
(for web, `(view as HTMLElement)`). The same applies to the `ios:`/`android:`/
`web:` escape bags, typed `PlatformProps` as attribute key/value pairs.

### Migrate from bind

Upgrade the framework packages and their [managed patches](../start/toolchain.md#agent-context-and-versions)
together before migrating; native handle refs need the matching Octane patch.

Change `bind={...}` to `ref={...}`, hook results `.bind` to `.ref`, and
intersection observation's `.bindRoot` to `.rootRef`. Assignment callbacks can
become object refs: `bind={(handle) => { input.current = handle }}` becomes
`ref={input}`. Callbacks that perform work must accept `null` or return cleanup.
The old `bind` names are removed.

## Hold a press

Use `Pressable onLongPress` for a hold action. Web reports a hold after
approximately 500 ms and native uses its platform long-press gesture.
Releasing, leaving the hit area, canceling the pointer, disabling the control,
or removing it cancels a pending web hold. Rerendering keeps the pending
interaction and invokes the latest callback if the hold completes.

```tsx
import { Pressable, Text, showToast } from '@octane-xplat/ui'

export function HoldAction() {
	return (
		<Pressable onLongPress={() => showToast({ body: 'Held' })}>
			<Text>Hold to show a toast</Text>
		</Pressable>
	)
}
```

## Own temporary surfaces

Render `BottomSheet`, `Dialog`, `Overlay`, or `Popover` inside a `Screen` on
native so the component can find its owning `RootLayout`. Keep `isOpen` in app
state and set it to false from `onOpenChange` when the user dismisses the
surface. Setting `isOpen={false}` or removing the declaring component closes
the surface without reporting user dismissal.

```tsx
import { useState } from 'octane'
import { Screen, BottomSheet, Pressable, Text } from '@octane-xplat/ui'

export function Example() {
	const [open, setOpen] = useState(false)

	return (
		<Screen>
			<Pressable onPress={() => setOpen(true)}>
				<Text>Open sheet</Text>
			</Pressable>
			{open && (
				<BottomSheet label="Temporary content" isOpen={open} onOpenChange={setOpen}>
					<Text>Temporary content</Text>
					<Pressable onPress={() => setOpen(false)}>
						<Text>Close sheet</Text>
					</Pressable>
				</BottomSheet>
			)}
		</Screen>
	)
}
```

Pressing Close removes the declaring `BottomSheet` and releases its portal content,
keyboard/gesture bindings, and theme subscription. User dismissal also
releases those resources and reports through the latest `onOpenChange` callback.
An open animation finishing after removal cannot revive the surface.
The maintained [Overlay demo](../../packages/demos/src/OverlayDemo.tsrx) uses the
same conditional ownership pattern.

For a modal layer with no shade — a full-screen photo viewer, for example —
set `isModal` instead of `shadeCover`. The overlay gets the same modal
behavior (web focus isolation and Escape, Android back dismissal, iOS modal
accessibility) without a dimmed backdrop. macOS ignores `isModal`.

```tsx
import { Overlay, Text } from '@octane-xplat/ui'

<Overlay open={open} isModal accessibilityLabel="Photo viewer" onDismiss={close}>
	<Text>Full-screen content</Text>
</Overlay>
```

### Give a web overlay a title and description

Use `accessibilityLabelledBy` and `accessibilityDescribedBy` to connect visible
text to the web dialog. Their values are element IDs. A title association wins
over a literal `accessibilityLabel`. Native overlays use `accessibilityLabel`
for their name; DOM ID-based associations are web-only.

```tsx
<Overlay open isModal accessibilityLabelledBy="photo-title" accessibilityDescribedBy="photo-details">
	<h2 id="photo-title">Trip photos</h2>
	<p id="photo-details">Choose a photo to open it</p>
</Overlay>
```

On Web, a shaded `Overlay` is a modal dialog and requires an
`accessibilityLabel` or `accessibilityLabelledBy`; `BottomSheet` uses its required `label`. Modal focus stays
inside the surface, the background leaves keyboard and accessibility queries,
and dismissal returns focus to the opener, including when a nested surface
closes. The maintained browser check covers Chromium, Firefox, and WebKit;
Chromium also checks the accessibility tree. It does not qualify iOS Safari or
screen-reader behavior; see [input readiness evidence](../../.agents/docs/notes/input-readiness-notes.md).

On iOS and Android, component-owned shared surfaces and declarative
`UIModal`/`MaterialDialog` content (children or `component` + `params`) portal
into native hosts, so they retain the declaring Octane tree's context and live
context updates. The host still needs its own theme classes because native
view-tree classes do not cross the host boundary. Android `BottomNavigationView`
panes and Pager cells, and iOS `UITabBar` panes, also portal from their
declaring tree; Android and iOS tab/Pager probes verify context inheritance and
live updates. The iOS Pager probe also verifies that changing pages delivers
the current provider value to the next page's cell; OS swipes remain untested.
`UITableView` and `RecyclerView` cells and compiled AppKit `listview` and
`tabviewitem` content also preserve their declaring context. For imperative
calls, use the scoped hooks below. Native route Pages and modals inherit the
providers around a mounted `RouteOutlet`; see [navigation](navigation.md#preserve-providers-across-native-pages).
Ownerless global service calls keep independent roots and require explicit data.
On macOS, `BottomSheetSwitcher`, toast stacks, and anchored `useLayer` popups
still use separate roots; see the [current boundary inventory](../../.agents/docs/notes/portal-boundaries.md).

```tsx
import { Screen, Button, Text, useImperativeBottomSheet } from '@octane-xplat/ui'

function Picker(props: { params: { title: string }; close: (value?: string) => void }) {
	return <Button clickAction={() => props.close('saved')}>{props.params.title}</Button>
}

export function SheetAction() {
	const sheet = useImperativeBottomSheet()

	return (
		<Screen>
			<Button
				clickAction={() => {
					void sheet.open(Picker, { title: 'Save' })
				}}
			>
				Open picker
			</Button>
			{sheet.element}
		</Screen>
	)
}
```

Keep `sheet.element` rendered beneath the providers the picker needs. Its
`open` method returns the existing promise with a `close(result)` method;
removing the element closes its sheets and settles their promises. On iOS
and Android, `useImperativeModal` provides the same ownership for OS modals:

```tsx
// Save in an iOS platform file; Android imports from '@octane-xplat/ui/android'.
import { useImperativeModal } from '@octane-xplat/ui/ios'
import { Button } from '@octane-xplat/ui'

function Picker(props: { close: (value?: string) => void }) {
	return <Button clickAction={() => props.close('saved')}>Save</Button>
}

export function ModalAction() {
	const modal = useImperativeModal()

	return (
		<>
			<Button
				clickAction={() => {
					void modal.open(Picker)
				}}
			>
				Open modal
			</Button>
			{modal.element}
		</>
	)
}
```

For the optional `@octane-xplat/sheet` and `@octane-xplat/context-menu` leaves,
Android and iOS content portals preserve context; the sheet's macOS content
does too. The iOS `@octane-xplat/effects` shader subtree also preserves its
declaring context. Web portals retain their declaring tree's context.

```tsx
import { createContext, useContext } from 'octane'
import { Screen, BottomSheet, Text } from '@octane-xplat/ui'

const AccountName = createContext('Guest')
const AccountNameProvider: any = AccountName

function AccountLabel() {
	return <Text>{useContext(AccountName)}</Text>
}

export function Example() {
	return (
		<Screen>
			<AccountNameProvider value="Avery">
				<BottomSheet label="Account" isOpen>
					<AccountLabel />
				</BottomSheet>
			</AccountNameProvider>
		</Screen>
	)
}
```

### Keep drafts when switching panels

Each `sheetId` has a separate editing lifetime inside the shared presentation.
Keep drafts in your screen's state to retain them when switching between panels.
This lets a name editor and an email editor use their own controls and values.

```tsx
import { useState } from 'octane'
import { BottomSheet, BottomSheetSwitcher, Button, Screen, TextInput } from '@octane-xplat/ui'

export function ContactEditors() {
	const [active, setActive] = useState<string | null>(null)
	const [name, setName] = useState('')
	const [email, setEmail] = useState('')

	return <Screen>
		<Button clickAction={() => setActive('name')}>Edit name</Button>
		<Button clickAction={() => setActive('email')}>Edit email</Button>
		<BottomSheetSwitcher activeSheet={active} onActiveSheetChange={setActive}>
			<BottomSheet sheetId="name" label="Edit name">
				<TextInput value={name} onChange={setName} />
			</BottomSheet>
			<BottomSheet sheetId="email" label="Edit email">
				<TextInput value={email} onChange={setEmail} keyboardType="email" />
			</BottomSheet>
		</BottomSheetSwitcher>
	</Screen>
}
```

### Close nested layers one at a time

Put a menu or hover card inside a dialog when it belongs to that dialog's
content. On web and AppKit, Escape requests a close from the innermost open
layer. For example, open the menu in the maintained
[Overlay demo](../../packages/demos/src/OverlayDemo.tsrx): the first Escape closes
the menu; the next closes the dialog. A required dialog consumes Escape
without closing. Escape used to cancel text composition does not close a layer.

For controlled components, the request calls `onOpenChange(false)` (or
`onHide` for HoverCard). Update your open state to accept it. If your callback
leaves the layer open, later Escape presses keep requesting that layer's close;
they do not close the dialog underneath. Focus returns when the layer actually
closes, rather than when the request is sent. `Dialog.finalFocusRef` can select
a return target with a `focus()` method. Removing a lower layer does not move
focus away from a layer that is still open above it.

On web, keep a child `Popover`'s anchor inside its owning modal. Its portal
stays in that modal's layer, so the popover remains interactive while background
content stays inert. `Popover.finalFocusRef` chooses where to return focus after
its content receives focus (the anchor is the default).

```tsx
// NestedChoice.web.tsx
import { useRef } from 'octane'
import { Overlay, Popover } from '@octane-xplat/ui'

export function NestedChoice() {
	const anchor = useRef<HTMLButtonElement | null>(null)

	return <Overlay open shadeCover accessibilityLabel="Choose a bag">
		<button ref={anchor}>Bag options</button>
		<Popover anchor={anchor} open><button>Carry-on</button></Popover>
	</Overlay>
}
```

`Popover.dismissOnEscape={false}` blocks Escape while that popover is on top.
For `useLayer`, Escape follows `lightDismiss` by default. Set
`dismissOnEscape: true` to allow Escape without an outside-tap backdrop.
Nesting depth is tracked across native layer hosts. See
[portal-backed surfaces](#own-temporary-surfaces) for which native surfaces
retain their declaring component context.

iOS/Android retain RootLayout's platform back behavior; there is no shared
hardware Escape listener on those targets. A platform back close may remove
the native host before the controlled callback is accepted. Mobile surfaces do
not provide a native keyboard focus trap. For software-keyboard positioning and
editing-focus return, see the [sheet form and focus example](software-keyboard.md#edit-a-form-in-a-sheet).
On AppKit, shared modal surfaces manage native focus and nested Escape
dismissal; physical OS keyboard delivery remains unverified.

### macOS shared presentations

Use the same shared imports on AppKit macOS. `Dialog` and `AlertDialog` float
above the current screen, `BottomSheet` docks to the bottom of its window,
and `Lightbox` fills the window's content area. `Dialog isInline` deliberately
keeps ordinary inline content for previews. The generic `Overlay` still renders
inline on macOS; choose `Dialog` or `BottomSheet` for presented content. These
shared layers are separate from the platform-authentic `AppKitSheet` window in
`@octane-xplat/sheet/macos`.

Keep `isOpen` and `onOpenChange` together. For a dialog or sheet, `purpose="info"`
allows outside-click and Escape dismissal; `"form"` blocks outside clicks;
`"required"` blocks both. Alert dialogs use `"required"`: Cancel calls
`onOpenChange(false)`, while Confirm calls your `onAction`. Your action owns
closing the alert after it succeeds. `hasScrim={false}` on a sheet keeps the
page interactive and does not move focus into the sheet. Drag the sheet's
handle to resize between `snapPoints` (fractions, dip counts, or percentage
strings); a downward drag past the smallest stop requests dismissal when
purpose permits. Switching a `BottomSheetSwitcher`'s `activeSheet` updates its
existing host. Set it to `null` to close the group.

Modal presentations focus their first enabled control and keep Tab traversal
inside the panel. Self-drawn buttons accept Return and Space. On close, focus
returns to `finalFocusRef.current` (a native view or a handle with `focus()`),
or to the control that opened the surface. Removing the declaration releases
its content, event monitors, timers, and window observers. Closing the owning
window also releases its presentations. Programmatic removal does not call
`onOpenChange`; user dismissal does.

Set a final focus target when the opener may disappear while the dialog is
open:

```tsx
import { useRef } from 'octane'
import { Screen, Dialog, Text, TextInput } from '@octane-xplat/ui'

export function EditName(props: { open: boolean; setOpen: (open: boolean) => void }) {
	const returnFocus = useRef<any>(null)

	return (
		<Screen>
			<TextInput ref={returnFocus} placeholder="Name" />
			<Dialog isOpen={props.open} onOpenChange={props.setOpen} finalFocusRef={returnFocus}>
				<Text>Saved details</Text>
			</Dialog>
		</Screen>
	)
}
```

For imperative dialog control, keep the returned `element` mounted:

```tsx
import { useImperativeDialog, Button, Text } from '@octane-xplat/ui'

export function SaveButton() {
	const dialog = useImperativeDialog()

	return (
		<>
			<Button clickAction={() => dialog.show(<Text>Saved changes</Text>)}>Save</Button>
			{dialog.element}
		</>
	)
}
```

`useImperativeAlertDialog()` and `useLightbox()` return mounted elements and
show/dismiss methods with the same owner cleanup. The `openBottomSheet` handle's
`close(result)` dismisses that specific sheet; `closeBottomSheet(result)`
remains for closing the most recently opened one. A sheet's component receives
`{ params, close }`; `close(result)` resolves its promise with that result, while
user dismissal or owner-window closure resolves with `'closed'`. Call
`openBottomSheet` after a window mounts; missing host/window support rejects
its promise.

```tsx
import { useImperativeAlertDialog, useLightbox, Button } from '@octane-xplat/ui'

const media = [{ src: '/trip.jpg', alt: 'A lake beside the campsite' }]

export function GalleryActions() {
	const alert = useImperativeAlertDialog()
	const lightbox = useLightbox({ media })

	return (
		<>
			<Button
				clickAction={() =>
					alert.show({ title: 'Remove photo?', actionLabel: 'Remove', onAction: alert.hide })
				}
			>
				Remove
			</Button>
			<Button clickAction={() => lightbox.open()}>View photo</Button>
			{alert.element}
			{lightbox.element}
		</>
	)
}
```

`openBottomSheet(Component, params, options)` mounts its own root in the key
window and returns a `BottomSheetHandle` — await it for the value passed to
`close`, or call `handle.close(result)` to dismiss that specific sheet.

```tsx
import { Button, openBottomSheet } from '@octane-xplat/ui'

function Details(props: { params: { title: string }; close: (result?: unknown) => void }) {
	return <Button clickAction={() => props.close(props.params.title)}>Done</Button>
}

export function OpenDetails() {
	return (
		<Button
			clickAction={() => {
				void openBottomSheet(Details, { title: 'Packing list' }, { label: 'Details' }).then(
					(result) => console.log(result),
				)
			}}
		>
			Open details
		</Button>
	)
}
```

`ToastViewport` routes `useToast()` to its own stack, while `showToast()` uses
a fallback stack in the key window. Info toasts auto-hide after 5000ms by
default; error toasts wait for manual dismissal. Override `isAutoHide` and
`autoHideDuration` as needed. Hover and keyboard focus pause the countdown.
The returned `ToastHandle` and `onHide(reason)` keep the shared contract.
`uniqueID`, `collisionBehavior`, `maxVisible`, `renderContent`, edge positions,
and insets are supported. A toast whose viewport unmounts moves to the
fallback stack. Toast stacks leave page input and focus available. Anchored
notifications continue to use `NSPopover`.

```tsx
import { ToastViewport, Button, useToast } from '@octane-xplat/ui'

function SaveNotice() {
	const toast = useToast()

	return <Button clickAction={() => toast({ body: 'Saved' })}>Save</Button>
}

export function ScreenNotice() {
	return (
		<ToastViewport>
			<SaveNotice />
		</ToastViewport>
	)
}
```

Lightbox Previous/Next buttons and Left/Right keys change the media index.
Image magnification uses AppKit's scroll view (pinch zoom, 1×–4×, controlled
by `hasZoom`); double-click zoom and touch swipe navigation are not implemented
on macOS. Shared lightbox video playback remains unavailable and shows an
explicit message with the media description; `hasAutoPlay` remains web-only.

Try the maintained [shared presentation example](../../examples/probes/shared-presentations.tsrx).
Supply your own image source before using its lightbox buttons. The
[isolated AppKit fixture](../../apps/macos/test/verify-overlays.mjs) checks native
views, geometry, updates, focus, imperative results, timers, and teardown
without screenshots. These are native-state and handler/API checks, not proof
of physical mouse hit-testing, OS keyboard delivery, or VoiceOver navigation.
The focused bridge tests cover dismissal and drag dispatch separately.

## Anchor a layer to an element

`useLayer` is the public anchored-overlay primitive — the same shape Meta
Astryx's `useLayer` exposes. Reach for it when `Popover`'s declarative props
are not enough: you get the anchor ref, open state, and a `render` function to
place inside your component tree.

```tsx
import { Pressable, Text, View, useLayer } from '@octane-xplat/ui'

export function Example() {
	const layer = useLayer({ mode: 'context', lightDismiss: true })

	return (
		<>
			<View ref={layer.ref}>
				<Pressable onPress={() => layer.show()}>
					<Text>Help</Text>
				</Pressable>
			</View>
			{layer.render(
				<View>
					<Text>Anchored content</Text>
				</View>,
				{ placement: 'below', alignment: 'start', offset: 4 },
			)}
		</>
	)
}
```

`mode: 'context'` binds `layer.ref` to the element the layer anchors to and
positions `render`'s children beside it: `placement` accepts `above`, `below`,
`start`, `end` (`start`/`end` mirror under RTL), plus physical
`top`/`bottom`/`left`/`right`; `alignment` is `start`/`center`/`end` on the
cross axis; `offset` is the gap. The layer flips to the opposite side when the
preferred side does not fit and clamps into the viewport. Web portals to
`document.body` and measures with `getBoundingClientRect`; native mounts on the
owning `RootLayout` and measures the anchor's native bounds. On macOS the AppKit host mounts a self-drawn view inside the owning window. Pass
`positioning: 'custom'` (context mode only) to skip anchor measurement and
author its position yourself. Web keeps `position-anchor` wired to `anchorId`
and leaves all insets unset; for example, `{ positioning: 'custom', style: {
left: 'anchor(left)', top: 'anchor(bottom)' } }`. Native uses numeric `left`/`top`
in page coordinates; macOS uses numeric points from the window's top-left corner.
macOS rejects nonnumeric custom coordinates. Custom mode ignores placement,
alignment, and offset.

On web, `offset` also accepts CSS lengths such as `'1rem'`, `'2em'`,
`'var(--gap)'`, or `'calc(var(--gap) + 4px)'`. The browser resolves them using
the anchor's font and custom properties. Native accepts numbers and numeric
`px` strings; other CSS units throw instead of being interpreted as dips.
Logical sides and horizontal alignment mirror the anchor's effective direction
on every supported target. The portable geometry assumes horizontal writing;
vertical CSS writing modes are outside this contract.

```tsx
import { View, Text, Pressable, useLayer } from '@octane-xplat/ui'

export function Example() {
	const layer = useLayer({ mode: 'context', lightDismiss: true })

	return (
		<>
			<View ref={layer.ref}>
				<Pressable onPress={layer.show}>
					<Text>Help</Text>
				</Pressable>
			</View>
			{layer.render(<Text>Help text</Text>, { placement: 'below', alignment: 'start', offset: 4 })}
		</>
	)
}
```

`mode: 'fixed'` drops the anchor entirely: `render` positions at the `x`/`y`
given in its props — viewport pixels on web, page dips on native, and the
containing window's top-left point on macOS. `lightDismiss` closes on outside
interaction; `onShow`/`onHide` track state, `isOpen` reads it, `show`/`hide`
toggle it. To keep visibility in your own state, pass `isOpen` in the options.
Then `show`/`hide` call `onShow`/`onHide` as requests; content stays mounted until
you change `isOpen`. A rejected close request retains dismissal ownership.

```tsx
import { Pressable, Text, useLayer } from '@octane-xplat/ui'

export function Example() {
	const layer = useLayer({
		mode: 'fixed',
		lightDismiss: true,
		onShow: () => console.log('Open'),
		onHide: () => console.log('Closed'),
	})

	return (
		<>
			<Pressable onPress={layer.show}>
				<Text>Open at a point</Text>
			</Pressable>
			{layer.render(
				<Pressable onPress={layer.hide}>
					<Text>Close</Text>
				</Pressable>,
				{ x: 20, y: 40 },
			)}
		</>
	)
}
```

On iOS and Android, `useLayer` and `Popover` portal layer content from the
declaring component tree, preserving its context. Calling `render` with
updated content refreshes an open layer, including on macOS. AppKit uses its
own layer host; pass data through props or shared state when content mounts in
an independent host. `Tooltip` and `HoverCard` route positioning through
`useLayer`.
macOS layers require the host's `showLayer` bridge; a missing bridge leaves the
surface absent. Outside dismissal also requires the AppKit local mouse monitor;
presentation rejects that request when the monitor is unavailable. The in-window view has no OS popover arrow or animation. Focus
traversal on macOS/mobile and physical outside-input behavior need separate
OS input evidence.

```tsx
import { Text, useLayer } from '@octane-xplat/ui'

function Details(props: { title: string }) {
	return <Text>{props.title}</Text>
}

export function Example() {
	const layer = useLayer({ mode: 'fixed' })

	return <>{layer.render(<Details title="Help" />, { x: 20, y: 40 })}</>
}
```

## Edit a PIN

`PinInput` uses a contiguous string: provide `value` and update it from
`onValueChange`, or omit `value` to let the component own it. Filled cells
and the next empty cell are editable; entry advances focus. Clearing cell 2
of `1234` reports `1` and clears cells 2–4 rather than moving later digits.
Replacing a filled cell keeps the remaining digits in their cells.

```tsx
import { Field, PinInput } from '@octane-xplat/ui'
import { useState } from 'octane'

export function Example() {
	const [pin, setPin] = useState('')

	return (
		<Field label="Security code" description="Enter all four digits" isRequired>
			<PinInput
				length={4}
				secure
				value={pin}
				onValueChange={setPin}
				onComplete={(value) => console.log(value)}
			/>
		</Field>
	)
}
```

`onComplete` receives a full-length PIN after an edit;
it does not fire for an incomplete value or an external value update.
The maintained [Components demo](../../packages/demos/src/ComponentsDemo.tsrx)
shows controlled entry. `secure` masks the cells, while `isDisabled` and
`isReadOnly` prevent editing. PIN fields also accept the shared field-control
props described in [Inputs](components.md#inputs). Wrap the control in `Field`
when it needs a visible label, description, or status message; the group uses
that label and each cell gets a distinct accessible name.

## Grow a multiline field

On experimental AppKit, `TextArea.maxLength` bounds committed user edits in
UTF-16 units, like web string lengths. Pasting or replacing a selection keeps
the existing text around the insertion; a cut does not split a surrogate pair.
Marked text may temporarily exceed the cap until composition commits. Initial
and external programmatic values are not truncated. Omit the cap to remove it;
zero prevents added text, and invalid caps are ignored. Real IME, undo/redo,
selection and native behavior remain unqualified.

```tsx
import { TextArea } from '@octane-xplat/ui'

export function ShortNote() {
	return <TextArea label="Short note" defaultValue="" maxLength={80} autoGrow maxRows={4} />
}
```


Set `autoGrow` on `TextArea` to fit content as the user types or clears text.
Omit `value` to let the field own its text; use `value` and `onChange` together
when the app owns it. Both modes resize on input, and controlled value updates
also resize the field.

```tsx
import { TextArea } from '@octane-xplat/ui'
import { useState } from 'octane'

export function Example() {
	const [note, setNote] = useState('')

	return <TextArea label="Note" autoGrow value={note} onChange={setNote} />
}
```

`rows` sets the starting height (one row by default with `autoGrow`), and
`maxRows` caps growth. Beyond the cap, the field scrolls internally. Without
`autoGrow`, the field keeps its row-based height. `onChange` receives the text
in either mode; submission follows the multiline submit rules described above.

```tsx
import { TextArea } from '@octane-xplat/ui'

export function Composer() {
	return <TextArea label="Note" autoGrow rows={2} maxRows={4} placeholder="Write a note" />
}
```

The [input probe](../../packages/app/src/Home.tsrx) includes controlled and
uncontrolled composers.

### Logical scroll offsets on AppKit

ScrollableArea now reads direction from InternationalizationProvider. In RTL,
`inline: 0` means the document's right edge; inline start/end state and padding
follow the same direction. A live direction change remeasures state and keeps
the imperative handle stable. Omitted axes retain their current position.
The provider does not reorder native content or choose its initial clip
position; those layout behaviors still require separate native qualification.
OS scrolling, elastic offsets and animation remain unqualified.

```tsx
import { useRef } from 'octane'
import { Button, InternationalizationProvider, ScrollableArea, Text } from '@octane-xplat/ui'
import type { ScrollableAreaHandle } from '@octane-xplat/ui'

export function RightToLeftNotes() {
	const viewport = useRef<ScrollableAreaHandle | null>(null)
	return <InternationalizationProvider dir="rtl">
		<Button label="Inline start" clickAction={() => viewport.current?.scrollToOffset({ inline: 0 })} />
		<ScrollableArea ref={viewport} axis="inline" width={240} height={80} paddingInlineStart={2}>
			<Text>Wide notes content</Text>
		</ScrollableArea>
	</InternationalizationProvider>
}
```

## Render bundled SVG on AppKit

On experimental AppKit macOS, `Image.src` accepts trusted inline SVG markup,
percent-encoded SVG data URIs, and base64 SVG data URIs. The macOS boundary
encodes markup with Foundation and loads it into a native `NSImageView`.
Use `alt` for the accessibility label; omit it for decorative images.
Registered `Icon` glyphs with `svg` or `markup` use this same path.

```css
.line-image {
	width: 24px;
	height: 24px;
}
```

```tsx
import { Image } from '@octane-xplat/ui'

;<Image
	src='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M4 12h16" stroke="black"/></svg>'
	alt="Horizontal line"
	className="line-image"
/>
```

This image host does not load SVG file paths or remote URLs. The native SVG
path has runtime evidence on macOS 27.0.1; decoding on macOS 13.5 remains
unverified. An unsupported decoder produces an empty image. See the
[AppKit SVG notes](../../.agents/docs/notes/icon-svg-notes.md) for evidence and limits, and the
[icons leaf](../../packages/icons/README.md) for set-agnostic Iconify rendering.


### Clear and continue typing on AppKit

AppKit TextInput and SearchInput now request focus on their retained input after
clearing. The callbacks remain ordered `onChange('')`, then `onClear`; controlled
parents still apply the requested value. Disabled/read-only fields do not expose
the clear action. Native focus, caret/IME behavior and pointer/keyboard activation
remain unqualified.

```tsx
import { SearchInput } from '@octane-xplat/ui'

export function Search() {
	return <SearchInput label="Find records" defaultValue="recent" hasClear />
}
```


### PIN fields on AppKit

AppKit PinInput now owns one standalone Field, or inherits an enclosing Field's
label, description, validation and disabled/read-only state. Cells have unique
IDs and accessible digit names. Metadata changes preserve entered values and
hosts; blocked groups cancel pending focus advance. Controlled parents still
apply onValueChange feedback before an unavailable next cell can be focused.

```tsx
import { PinInput } from '@octane-xplat/ui'

export function Code() {
	return <PinInput id="account-code" label="Account code" description="Enter four characters" length={4} />
}
```

This slice preserves the shared single-character-per-edit behavior: a multi-
character paste retains its last character, and deleting a filled cell truncates
the suffix. Empty-cell Backspace navigation, OTP autofill, native digit filtering,
physical focus/caret/IME, secure-field behavior and VoiceOver remain open or
unqualified; do not infer a complete native authentication flow from source
presence.
