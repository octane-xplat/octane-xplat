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
/** @jsxImportSource @nativescript-community/octane */
// Settings.ios.tsrx: keep this import in the iOS file.
import { UISwitch } from '@octane-xplat/ui/ios'
import { useState } from 'octane'

export function Settings() {
	const [checked, setChecked] = useState(false)
	return <UISwitch checked={checked} onCheckedChange={setChecked} />
}
```

### Text and keyboard actions

`TextArea` keeps Return as a newline. On web, Cmd/Ctrl+Enter submits it.
On iOS and Android, submission is enabled only with
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
while composition is in progress, and check the actual iOS and Android
keyboards your app needs.

In the browser, Tab can focus a `Pressable`, and Enter or Space activates it.
`disabled` prevents activation and removes it from Tab navigation. Give an
action an `accessibilityLabel` when its visible content does not name it,
so a screen reader can describe it. Native accessibility behavior has
[separate checks](../notes/platform-notes.md#a11y-prop-map-shared-prop--leaf-attrs).

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

### Reusable rows

`Item` is a reusable, self-drawn row for settings, preferences, and
compact navigation lists. Use `leading`, `title`, `supportingText`, and
`trailing` for the common shape, or compose `Leading`, `Content`,
`Supporting`, and `Trailing` slots for richer content. It works by itself or
inside `FieldGroup`; the row owns its layout and press behavior, while
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
				title="Notifications"
				supportingText="Daily reminders"
				leading={<Text>•</Text>}
				trailing={<Text>Off</Text>}
				onPress={() => console.log('Open reminders')}
			/>
			<Item>
				<Item.Leading>
					<Text>•</Text>
				</Item.Leading>
				<Item.Content>
					<Text>Account</Text>
					<Item.Supporting>Profile settings</Item.Supporting>
				</Item.Content>
				<Item.Trailing>
					<Text>›</Text>
				</Item.Trailing>
			</Item>
		</FieldGroup>
	)
}
```

`List` and `ListItem` describe bounded content, such as a short set of steps
or notices. `List` is rendered in full and is not a data-windowing or native
OS-list wrapper; use `VirtualList` for long collections and the `ui/ios` or
`ui/android` subpath when OS list behavior is required. `listStyle` selects
`none`, `disc`, `circle`, or `decimal` markers; `ListItem` supplies its label,
optional description, leading and trailing content, and optional action or
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

Use `FormLayout` to arrange `Field` or `InputGroup` children. Its
`defaultOptionality` marks the exception to the form's usual required or
optional state. `InputGroup` provides one label and description for a joined
control; put prefix/suffix text or icons in `InputGroupText`, then place the
input beside it. This is layout and accessibility grouping only: `FormLayout`
does not render a browser `<form>` or provide submit behavior. `InputGroup`
uses a web `role="group"`; NativeScript has no corresponding group role.
The group's `size` and disabled state are inherited by supported member
controls so the addon, input border, and input state stay aligned.
See the [grouped field example](../../packages/demos/src/ComponentsDemo.tsrx).

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
				<TextInput value="example.com" />
			</InputGroup>
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
platform file. `Icon.select({ ios, android })` chooses a native asset for
`UITabBar` or `BottomNavigationView`; the shared `Icon` remains unchanged.
These selectors and modifiers are escape hatches for platform-authentic
widgets, not shared styling props.

```tsx
/** @jsxImportSource @nativescript-community/octane */
import { Icon, UITabBar, modifier } from '@octane-xplat/ui/ios'
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
					icon: Icon.select({ ios: 'heart.fill', android: 'favorite' }),
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
/** @jsxImportSource @nativescript-community/octane */
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

`ScrollableArea` and the platform lists (`UITableView`, `RecyclerView`) accept
`refreshing`, `onRefresh`, and `refreshThreshold` for pull-to-refresh.
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
has a usable layout. Web coordinates are viewport-relative; native coordinates
are screen-relative device-independent pixels. Set `{ observe: false }` for a
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
position, anchor, placement })` returns a dismiss function; `useToast()` routes
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
Wrap it in `SafeArea` and set `ignoreSafeArea` when the content should extend
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

`html` wins when both sources are present, including an empty string. Set
`matchContents` to apply the measured height after a successful load. AppKit
measures after loading and when measurement props change; later changes made
by page scripts are not continuously observed. A document's viewport can set a
minimum measured height. Use the maintained
[WebView demo](../../packages/demos/src/WebViewDemo.tsrx) to try sizing and navigation.
`scrollEnabled={false}` applies hidden document overflow to freeze inner scrolling;
it does not prevent a page script from scrolling. `sandbox` is browser-only.
The ref's `native` is the WKWebView itself. `reload()` reloads the current
remote or file page; for `html`, it submits the supplied HTML again. AppKit
`SafeArea` is a neutral wrapper, so `ignoreSafeArea` adds no desktop inset. Removing the component stops loading,
clears the delegate and ref, and ignores pending measurements.

This embedded component does not install a service bridge. To run an entire
DOM app in a macOS webview window, use the separate
[desktop-webview app-shell workflow](../platform/macos-webview.md).

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
see [video limits](../verify/known-limits.md#primitives) before designing error UI.

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

`Lottie` plays a Lottie animation — `src` (URL; native also accepts `~/`
bundle paths, absolute files, `res://` names, `.lottie` containers, and raw
`{`-JSON) or `data` (inline animation object), `autoPlay`, `loop`,
`playing`, `progress` (normalized 0..1), `speed`, `fit`
(`contain`/`cover`/`fill`), `onLoaded`/`onEnded`/`onError`, and a `ref`
handle (`play`/`pause`/`stop`/`seekTo`/`setSpeed`/`progress`/`duration`/
`isPlaying`). It ships as the `@octane-xplat/lottie` leaf — `pnpm add
@octane-xplat/lottie`. `lottie-web` is a real dependency; the NativeScript
plugin is vendored in the leaf (`src/vendor/ui-lottie` — a git
submodule of `octane-xplat/ui-lottie`, branch `xplat-vendored`), so apps declare nothing extra.
Durations are milliseconds and progress is 0..1 on every target — the
plugin reports seconds and the leaf normalizes. Use the maintained
[LottieDemo](../../packages/demos/src/LottieDemo.tsrx) for bounded playback
controls. The vendored plugin carries fixes unreleased upstream (load
events, sync-src, remote URLs, `declare` fields for modern bundlers); see
[lottie limits](../verify/known-limits.md#primitives) before designing error UI.
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
not that a frame has appeared; see [camera limits](../verify/known-limits.md#primitives).

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
shared and split only its leaves. The [primitive notes](../notes/primitive-notes.md)
cover the less common components, accessibility details, and renderer limits.

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

Pressing Close removes the declaring `BottomSheet` and releases its native root,
keyboard/gesture bindings, and theme subscription. User dismissal also
releases those resources and reports through the latest `onOpenChange` callback.
An open animation finishing after removal cannot revive the surface.
The maintained [Overlay demo](../../packages/demos/src/OverlayDemo.tsrx) uses the
same conditional ownership pattern.

On Web, a shaded `Overlay` is a modal dialog and requires an
`accessibilityLabel`; `BottomSheet` uses its required `label`. Modal focus stays
inside the surface, the background leaves keyboard and accessibility queries,
and dismissal returns focus to the opener, including when a nested surface
closes. The maintained browser check covers Chromium, Firefox, and WebKit;
Chromium also checks the accessibility tree. It does not qualify iOS Safari or
screen-reader behavior; see [input readiness evidence](input-readiness-notes.md).

Native content mounts in a separate Octane root: component context does not
cross that boundary. Pass values as props or subscribe to shared state in
each consuming component. The framework keeps the separate host's theme
current; content updates do not create additional permanent subscriptions.
Web portals retain the declaring root's context.

```tsx
import { Screen, BottomSheet, Text } from '@octane-xplat/ui'

function Details(props: { title: string }) {
	return <Text>{props.title}</Text>
}

export function Example() {
	return (
		<Screen>
			<BottomSheet label="Details" isOpen>
				<Details title="Packing list" />
			</BottomSheet>
		</Screen>
	)
}
```

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
owning `RootLayout` and measures the anchor's native bounds. On macOS the layer
is a real `NSPopover` presented by the AppKit host bridge. Pass
`positioning: 'custom'` (context mode only) to skip anchor measurement and
mount the layer in the overlay shell unpositioned.

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
toggle it.

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

On native, layer content is a separate root: it does not see the declaring
component's context. Calling `render` with updated content refreshes an open
layer, including on macOS. Pass data through props or subscribe to shared
state inside the layer tree. Web `Tooltip` uses `useLayer`; `Popover` remains
the positioning surface underneath the web and mobile hook, and `HoverCard`
still uses that surface directly.

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
[AppKit SVG notes](../notes/icon-svg-notes.md) for evidence and limits, and the
[icons leaf](../../packages/icons/README.md) for set-agnostic Iconify rendering.
