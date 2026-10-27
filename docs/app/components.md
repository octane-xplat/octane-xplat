# Component index

> Components exported by `@octane-xplat/ui` and its purpose entrypoints,
> grouped by job.

This is a lookup page; you don't need to learn the whole list. A component
is a reusable screen piece, and **props** are the options you give it.
Start with [building a small screen](primitives.md#a-practical-example) if
you haven't used components yet.

Feature APIs have their own import path so the root stays ordinary UI:
`@octane-xplat/ui/routing` (routes, navigation, back handling),
`@octane-xplat/ui/data` (stores, collection data, queries),
`@octane-xplat/ui/markdown` (Markdown rendering, parsing, syntax), and
`@octane-xplat/ui/chat` (the Chat family below).

Guides with examples live elsewhere: [primitives](primitives.md) for
layout/composition, [navigation](navigation.md) for routes and stacks,
[navigation shells and workspace controls](navigation-ui.md) for responsive
navigation, tab strips, overflow, and resizing,
[styling](styling.md) for className/style, [platform services](../platform/platform-services.md)
for device APIs. Platform-authentic widgets (no parity promised) live behind
`@octane-xplat/ui/ios`, `/android`, and `/web` — see
[primitives](primitives.md#the-components-you-reach-for-first).
For changed selection, date, number, timestamp, and duration props, see the
[UI API migration guide](ui-api-migrations.md).
`KeyboardAvoiding` is available from every root entry. It adjusts around the
software keyboard on iOS and Android; web, Linux, macOS, and Windows keep a
neutral column wrapper.

```tsx
import { KeyboardAvoiding, TextInput } from '@octane-xplat/ui'
import { useState } from 'octane'

export function Example() {
	const [name, setName] = useState('')

	return (
		<KeyboardAvoiding>
			<TextInput label="Name" value={name} onChange={setName} />
		</KeyboardAvoiding>
	)
}
```

Most components accept `className`/`style`/`id` plus the platform escape props
(`ios`, `android`, `web`) applied after shared props. `VisuallyHidden`
intentionally omits styling props so hidden content cannot be accidentally
made visible through component styling.

```tsx
import { View, VisuallyHidden, Text } from '@octane-xplat/ui'

export function Example() {
	return (
		<View id="summary" className="summary" web={{ 'data-testid': 'summary' }}>
			<Text>Packing progress</Text>
			<VisuallyHidden>
				<Text>Two items packed</Text>
			</VisuallyHidden>
		</View>
	)
}
```

Some names follow the Astryx component library. Options and platform support
can change as Xplat develops; check the guide for a component you rely on.
The content-display family and its platform limits are covered in
[Content display](content-display.md).

Some browser and native details have no exact match: `Stack as` selects an
HTML tag only on web, and native scrollable stacks wrap their flex content in
a `ScrollView`. `Center isInline` is web-only. `FormLayout`'s horizontal
label mode uses a shared label column and a 480px collapse on web; native
renders each field as its own label/control row. Native `AspectRatio` derives
height from the measured width in one layout pass. Native `VisuallyHidden`
uses a 1dip transparent container, so screen-reader exposure is best-effort.
Content `List` is rendered in full; it has no native list role and draws
markers/dividers in its leaf. `List.edgeCompensation="inline"` adjusts row
insets from container tokens on web only.

```tsx
import { Stack, Center, AspectRatio, VisuallyHidden, Text } from '@octane-xplat/ui'

export function Example() {
	return (
		<Stack as="section" isScrollable>
			<Center isInline>
				<Text>Summary</Text>
			</Center>
			<AspectRatio ratio={16 / 9}>
				<Text>Preview</Text>
			</AspectRatio>
			<VisuallyHidden>
				<Text>Packing progress</Text>
			</VisuallyHidden>
		</Stack>
	)
}
```

## Layout

| Component          | What it is                                                                                 | Key props                                                                 |
| ------------------ | ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------- |
| `View`             | Base container                                                                             |                                                                           |
| `Stack`            | Flow flex container; vertical by default                                                   | `direction`, `hAlign`, `vAlign`, `gap`, `padding`, `wrap`, `isScrollable` |
| `HStack`           | Horizontal `Stack`                                                                         | `hAlign`, `vAlign`, `gap`                                                 |
| `VStack`           | Vertical `Stack`                                                                           | `hAlign`, `vAlign`, `gap`                                                 |
| `StackItem`        | Child sizing/alignment override in `Stack`                                                 | `size`, `crossAlignSelf`, `isScrollable`                                  |
| `Grid`             | Grid container                                                                             | `rows`, `columns`                                                         |
| `Absolute`         | Absolutely-positioned layer                                                                |                                                                           |
| `Center`           | Centers children on one or both axes                                                       | `axis`, `isInline`                                                        |
| `Section`          | Banded content with padding and dividers                                                   | `variant`, `dividers`, `padding`                                          |
| `Layout`           | Five-slot page region primitive (header/start/content/end/footer)                          | `header`, `content`, `start`, `end`, `footer`, `padding`, `height`, `contentWidth`, `defaultHasDividers` |
| `LayoutHeader`     | `Layout` header band with optional divider                                                 | `hasDivider`, `padding`, `paddingBlockEnd`, `role`, `label`               |
| `LayoutContent`    | `Layout` scrollable content region                                                         | `padding`, `isScrollable`, `role`, `label`                                |
| `AspectRatio`      | Constrains child box to a width/height ratio                                               | `ratio`, `shape`, `fit`                                                   |
| `VisuallyHidden`   | Keeps content available to assistive technology                                            | `as` (web tag)                                                            |
| `Spacer`           | Flexible gap filler                                                                        |                                                                           |
| `SafeArea`         | Insets-aware container                                                                     | `edges`                                                                   |
| `KeyboardAvoiding` | Shifts content above the keyboard on iOS/Android; keeps a neutral column wrapper elsewhere | `enabled`, `keyboardVerticalOffset`                                       |

`Stack`, `Center`, `Section`, and `FormLayout` gap and padding props use
spacing steps: each step is 4 dips (CSS pixels on web). Numeric sizes are dips
too; CSS lengths remain strings. The [styling guide](styling.md) shows the
shared styling options.

## Text

| Component                                           | What it is                                                | Key props                               |
| --------------------------------------------------- | --------------------------------------------------------- | --------------------------------------- |
| `Text`                                              | Text block                                                |                                         |
| `RichText`, `RichTextSpan`                          | Inline styled/linked spans inside one block               |                                         |
| `Heading`                                           | Section heading (shared typography)                       |                                         |
| `Kbd`                                               | Keyboard-key glyph (⌘K styling hook)                      |                                         |
| `Link`, `NavLink`                                   | Route navigation as text                                  | `href`, `route`                         |
| [`Markdown`](content-display.md#markdown-documents) | Markdown doc — baked AST or runtime text, streaming-ready | `data`, `text`, `isStreaming`, `fadeIn` |

## Inputs

Field controls share `label`, `description`, `isDisabled`, `isReadOnly`,
`isRequired`, `isOptional`, `size`, `status`, and `isLoading`. Labels are
optional on controls so they can be composed inside `Field`; `Field` renders
the visible label and description before its child and the status message
after it, and connects those texts to the child control. A control used
outside `Field` still announces its `label`, `description`, `status` message,
and `disabledMessage` — they arrive through the platform's accessibility
description channel instead of rendered chrome. Use `inputID` when a
specific control ID is needed for the label's `htmlFor`; otherwise the child
uses the field's accessible label relationship. `isRequired` and
`isOptional` are mutually exclusive. `isLoading` reports busy work without
disabling edits by itself. `status` uses `{ type: 'warning' | 'error' |
'success', message?: string }`. `hasClear` is available where clearing is part
of the control, including `TextInput`, `SearchInput`, and `Selector`.

Controls that hold user state follow one ownership contract. The controlled
prop carries the current value — `value`, `isOpen`, or `open` —
and its callback reports each requested change: `onChange` and
`onValueChange` carry the next value, `onChange` the next text or boolean,
and `onOpenChange`/`onDismiss` the requested visibility. Pass the matching
`defaultValue` or `defaultOpen` instead and the control
owns that state — user actions update it internally and still call the
callback. When both are set, the controlled prop wins.

```tsx
import { Switch } from '@octane-xplat/ui'

export function Example() {
	// Uncontrolled — the switch owns its on state and reports each toggle.

	return <Switch defaultValue onChange={(next) => console.log(next)} />
}
```

```tsx
import { Field, TextInput } from '@octane-xplat/ui'
import { useState } from 'octane'

export function Example() {
	const [name, setName] = useState('')

	return (
		<Field
			label="Name"
			description="Shown on your profile"
			inputID="name"
			isRequired
			status={{ type: 'warning', message: 'Check the spelling' }}
		>
			<TextInput id="name" value={name} onChange={setName} hasClear isLoading size="sm" />
		</Field>
	)
}
```

`FormLayout` arranges fields; it is not an HTML `<form>` and does not submit.
Nested layouts inherit `defaultOptionality` when they omit it; an explicit
child default or field setting takes precedence. `InputGroup` gives joined
prefixes/suffixes and the input one visible label. Its `size` is a default,
so a control's explicit `size` wins; the group's disabled state still applies.
On web, the group uses
`role="group"` and its label; NativeScript renders a grouped row without a
matching accessibility group role.

```tsx
import { FormLayout, InputGroup, InputGroupText, TextInput } from '@octane-xplat/ui'

export function Example() {
	return (
		<FormLayout direction="horizontal-labels">
			<InputGroup label="Website" size="sm" isDisabled>
				<InputGroupText>https://</InputGroupText>
				<TextInput value="example.com" size="md" />
			</InputGroup>
		</FormLayout>
	)
}
```

| Component                                               | What it is                                                       | Key props                                                                                     |
| ------------------------------------------------------- | ---------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `TextInput`, `TextArea`                                 | One- and multi-line text entry                                   | `value`, `defaultValue`, `onChange`, `label`, `description`                                   |
| `SearchInput`                                           | Search field with clear button                                   | `value`, `onSubmit`, `hasClear`, `onClear`                                                    |
| `FormLayout`                                            | Arranges labeled fields                                          | `direction`, `defaultOptionality`                                                             |
| `InputGroup`, `InputGroupText`                          | Joins a labeled control with prefix/suffix text                  | `label`, `size`                                                                               |
| `PowerSearch`                                           | Structured field/operator/value filters                          | `config`, `filters`, `onChange`, `components`                                                 |
| `Button`                                                | Labeled action                                                   | `label`, `variant`, `size`, `isDisabled`, `isLoading`, `clickAction`, `onActionError`, `href` |
| `IconButton`                                            | Icon-only named action                                           | `icon`, `label`, `variant`, `size`                                                            |
| `ButtonGroup`                                           | Connected action row                                             | `label`, `orientation`, `size`, `isDisabled`                                                  |
| `ToggleButton`, `ToggleButtonGroup`                     | Pressed action and toggle group                                  | `isPressed`, `value`, `onChange`, `type`                                                      |
| `ClickableCard`, `SelectableCard`                       | Action/navigation card or controlled selection                   | `label`, `href`, `isSelected`, `onChange`                                                     |
| `MoreMenu`                                              | Icon-only overflow menu for action rows                          | `items`, `label`, `placement`, `alignment`                                                    |
| `DateInput`, `TimeInput`                                | ISO date or wall-clock time fields with adaptive picker surfaces | `value`, `onChange`, `min`, `max`, `presentation`                                             |
| `DateTimeInput`                                         | Combined ISO local date-time field                               | `value`, `onChange`, `min`, `max`, `presentation`                                             |
| `Calendar`                                              | Single-date or inclusive range calendar                          | `mode`, `value`, `numberOfMonths`, `dateConstraints`                                          |
| `DateRangeInput`                                        | Labeled range trigger with calendar and presets                  | `value`, `onChange`, `presets`, `minRangeSpan`, `maxRangeSpan`                                |
| `FileInput`                                             | `@octane-xplat/files` picker with input and dropzone modes       | `value`, `onChange`, `accept`, `isMultiple`, `maxSize`                                        |
| `Switch`                                                | On/off toggle (self-drawn)                                       | `value`, `defaultValue`, `onChange`, `isDisabled`                                  |
| `CheckboxInput`                                         | Self-drawn checkbox                                              | `value`, `defaultValue`, `onChange`, `isDisabled`                                  |
| `CheckboxIndicator`, `CheckIndicator`, `RadioIndicator` | Decorative selection marks                                       | `state`, `size`, `isDisabled`                                                                 |
| `CheckboxList`                                          | Self-drawn multi-select list                                     | `options`, `value`, `defaultValue`, `onValueChange`, `isDisabled`                             |
| `RadioList`                                             | Self-drawn radio options                                         | `options`, `value`, `defaultValue`, `onValueChange`, `isDisabled`                             |
| `SegmentedControl`                                      | Inline option segments                                           | `options`, `value`, `defaultValue`, `onValueChange`, `isDisabled`                             |
| `Slider`                                                | Value scrubber (self-drawn)                                      | `value`, `minValue`, `maxValue`, `onValueChange`                                              |
| `ColorPicker`                                           | Fixed color picker (area + hue slider + swatch + field)          | `value`, `defaultValue`, `onChange`, `onChangeEnd`, `isDisabled`                              |
| `ColorArea`                                             | 2D saturation/brightness pad for one hue                         | `value`, `defaultValue`, `onChange`, `onChangeEnd`, `isDisabled`                              |
| `ColorSlider`                                           | Single-channel slider — `channel="hue"` only                     | `channel`, `value`, `defaultValue`, `onChange`, `onChangeEnd`, `isDisabled`                   |
| `ColorSwatch`                                           | Small color chip                                                 | `color`, `size`                                                                               |
| `ColorField`                                            | Hex text field; commits on submit/blur                           | `value`, `defaultValue`, `label`, `onChange`, `onChangeEnd`, `isDisabled`                     |
| `Selector`                                              | Single or multiple-option picker                                 | `selectionMode`, `options`, `value`, `onValueChange`, `searchable`                            |
| `MultiSelector`                                         | Multiple-option picker preset                                    | `options`, `value`, `onValueChange`, `searchable`, `isDisabled`                               |
| `Typeahead`                                             | Searchable single selection field                                | `searchSource`, `value`, `onChange`, `hasEntriesOnFocus`                                      |
| `Tokenizer`                                             | Searchable multi-selection token field                           | `searchSource`, `value`, `onChange`, `hasCreate`                                              |
| `Token`                                                 | Removable or interactive entity chip                             | `label`, `color`, `onRemove`, `onClick`, `href`                                               |
| `ComplexSelector`                                       | Field trigger with a custom anchored picker surface              | `value`, `children`, `changeAction`, `variant`                                                |
| `NumberInput`                                           | Numeric entry with bounds; `null` is empty                       | `value`, `defaultValue`, `min`, `max`, `step`, `onValueChange`                                |
| `PinInput`                                              | Fixed-length code/PIN entry                                      | `length`, `onValueChange`, `onComplete`, `secure`                                             |

| `InputRating` | Tappable 1..max rating row | `value`, `max`, `icon`, `onValueChange` |
| `Chip` | Selectable/removable chip | `selected`, `onSelect`, `onRemove` |
| `Field`, `FieldGroup` | Labeled field wrapper / labeled field group | `label`, `description`, `inputID`, `isRequired`, `isOptional`, `status` |
| `Item` | Settings-style row | `label`, `description`, `startContent`, `endContent`, `isDisabled`, `onPress` |

Web `Slider` supports Tab focus, Arrow keys in increments of 1% of its range,
and Home/End to select its bounds. Disabled sliders are skipped. Keep its
controlled value in state so keyboard and drag changes appear on screen.

```tsx
import { useState } from 'octane'
import { Slider } from '@octane-xplat/ui'

export function Volume() {
	const [volume, setVolume] = useState(0.5)

	return <Slider value={volume} minValue={0} maxValue={1} onValueChange={setVolume} />
}
```

`ColorPicker` renders a fixed layout — a saturation/brightness `ColorArea`, a
hue `ColorSlider`, then a `ColorSwatch` and `ColorField` row — sharing one
color state, so dragging brightness to black and back keeps the hue. Color
values are hex strings: output is lowercase `'#rrggbb'`; input also accepts
`'#rgb'`, any case, and a missing `'#'`. `ColorArea` and `ColorSlider` work
standalone, `ColorSwatch` renders a small chip, and `ColorField` edits the
hex text directly (commit on submit/blur; invalid input restores the value).

```tsx
import { useState } from 'octane'
import { ColorPicker, ColorSwatch } from '@octane-xplat/ui'

export function FavoriteColor() {
	const [color, setColor] = useState('#4488ff')
	return (
		<>
			<ColorPicker value={color} onChange={setColor} />
			<ColorSwatch color={color} />
		</>
	)
}
```

Date controls use portable ISO strings: `YYYY-MM-DD`, `HH:MM[:SS]`, and
`YYYY-MM-DDTHH:MM[:SS]`. Date-time strings have no timezone suffix; they
represent local wall-clock values. Empty values and clear callbacks use
`null`. `presentation="native"` uses the browser
input on web and the shared calendar/time sheet on iOS and Android. Choose
`bottom-sheet`, `popover`, or adaptive presentations when the surface should
stay consistent across targets. `DateRangeInput` uses `{start, end}` ISO dates
or `null`. See the [date and file entry guide](../platform/date-picker.md) for full
contracts and the native picker package boundary.

```tsx
import { DateInput, TimeInput, DateTimeInput } from '@octane-xplat/ui'

export function Example() {
	return (
		<>
			<DateInput
				label="Date"
				value="2026-10-02"
				onChange={(value) => console.log(value)}
				presentation="native"
			/>
			<TimeInput
				label="Time"
				value="14:30"
				onChange={(value) => console.log(value)}
				presentation="bottom-sheet"
			/>
			<DateTimeInput
				label="Departure"
				value="2026-10-02T14:30"
				onChange={(value) => console.log(value)}
			/>
		</>
	)
}
```

`FileInput` is exported by `@octane-xplat/files`, which depends on
`@octane-xplat/ui` for its field presentation. It uses portable
`{name, uri, size?, mimeType?}` references because browser `File` objects do
not exist on native targets. On web the optional `file` property retains the
browser object for upload APIs. The package opens the platform picker by
default, including multi-file selection on iOS and Android; no app-level
picker registration is needed. Web uses the browser chooser and supports drag
and drop in `mode="dropzone"`. See the [date and file entry guide](../platform/date-picker.md)
for platform details and AppKit file-access limits.

```tsx
import { FileInput } from '@octane-xplat/files'
import type { FileInputFile } from '@octane-xplat/files'
import { useState } from 'octane'

export function Attachments() {
	const [files, setFiles] = useState<FileInputFile | FileInputFile[] | null>(null)

	return <FileInput label="Attachments" value={files} onChange={setFiles} isMultiple />
}
```

## Content

| Component        | What it is                                         | Key props                                                                                |
| ---------------- | -------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `Card`           | Container with header/footer slots                 | `header`, `footer`                                                                       |
| `ClickableCard`  | Named action or link surface                       | `label`, `onPress`, `href`, `isDisabled`                                                 |
| `SelectableCard` | Controlled checked card                            | `label`, `isSelected`, `onChange`                                                        |
| `Alert`          | Inline callout                                     | `tone`, `icon`, `title`                                                                  |
| `Banner`         | Notice strip with optional dismiss                 | `icon`, `onDismiss`                                                                      |
| `EmptyState`     | Empty-state block (icon + title + actions)         | `icon`, `title`, `description`                                                           |
| `Badge`          | Inline label chip                                  |                                                                                          |
| `Avatar`         | Circular image with text fallback                  | `src`, `fallback`, `size`                                                                |
| `AvatarGroup`    | Overlapping avatar row with `+N` overflow          | `max`, `size`                                                                            |
| `User`           | Avatar + name/description row                      | `name`, `description`, `src`, `onSelect`                                                 |
| `Icon`           | Registered icon glyph                              | `name`, `registry`, `size`, `color`, `accessibilityLabel`                                |
| `Image`          | Image                                              | `src`, `alt`, `placeholder`, `recyclingKey`, `contentFit`, `contentPosition`, `decoding` |
| `Thumbnail`      | Square image preview with optional remove action   | `src`, `alt`, `isLoading`, `onPress`, `onRemove`                                         |
| `Blockquote`     | Quoted content with optional attribution           | `cite`                                                                                   |
| `Code`           | Inline monospace text                              | `color`, `size`                                                                          |
| `CodeBlock`      | Syntax-colored code with copy and collapse actions | `code`, `language`, `hasLineNumbers`, `highlightLines`                                   |
| `Citation`       | Source label or numbered source link               | `source`, `number`, `variant`                                                            |
| `Skeleton`       | Loading placeholder block                          | `width`, `height`                                                                        |
| `Divider`        | Hairline rule                                      | `orientation`                                                                            |

For images on native, prefer the `Image` from `@octane-xplat/image` — same
name, same props, and it loads through Glide/SDWebImage (sized memory + disk
cache, decode-to-view-size) instead of the core component's 5 MB cache. Core
`Image` remains the dep-free baseline and the path for SVG sources.

`Icon` uses the default app registry when no registry is supplied. The
framework's `xplat-*` glyphs are included by default, and
`registerIcon`/`registerIcons` add or replace names in that registry.
Those registrations affect icons rendered afterward; mounted icons do not
re-render, so register during startup. An icon without an
`accessibilityLabel` is decorative; set one when the glyph carries meaning.

```tsx
import { registerIcon, Icon, Alert } from '@octane-xplat/ui'

registerIcon('logo', { svg: 'M4 4h16v16H4z' })

export function Brand() {
	return (
		<>
			<Icon name="logo" size={20} accessibilityLabel="Company logo" />
			<Icon name="logo" /> {/* decorative second use */}
			<Alert tone="info" icon="xplat-warning" title="Heads up" />
		</>
	)
}
```

Create an `IconRegistry` when one part of an app needs custom glyphs without
changing another part's names. Each registry starts with the built-ins.
`IconRegistryProvider` selects the registry for its descendants, and the
nearest provider wins; `Icon.registry` can override it for one icon. A
provider reaches native pushed Pages when a `RouteOutlet` is mounted below
it. Without an outlet, use the default app registry there or pass the registry
to an individual `Icon`; see [route providers](navigation.md#preserve-providers-across-native-pages).

```tsx
import { createIconRegistry, Icon, IconRegistryProvider } from '@octane-xplat/ui'

const brandIcons = createIconRegistry()
brandIcons.registerIcon('logo', { svg: 'M4 4h16v16H4z' })

export function BrandArea() {
	return (
		<IconRegistryProvider value={brandIcons}>
			<Icon name="logo" accessibilityLabel="Company logo" />
			<Icon name="logo" registry={brandIcons} />
		</IconRegistryProvider>
	)
}
```

Indicators draw the selection mark; the owning control keeps focus,
interaction, and accessibility semantics. `registerIndicator` and
`registerIndicators` replace named marks; mounted controls re-render with
the override on each target.

```tsx
import { registerIndicators, Text, View } from '@octane-xplat/ui'
import type { IndicatorProps } from '@octane-xplat/ui'

function SelectionMark(props: IndicatorProps<'singleSelection'>) {
	return (
		<View>
			<Text>{props.state === 'checked' ? '✓' : ''}</Text>
		</View>
	)
}
registerIndicators({ check: SelectionMark })
```

## Disclosure & navigation

| Component                                  | What it is                                               | Key props                                                        |
| ------------------------------------------ | -------------------------------------------------------- | ---------------------------------------------------------------- |
| `Collapsible`                              | Show/hide a region                                       | `trigger`, `open`, `onOpenChange`                                |
| `Accordion`                                | List of expanding items                                  | `items`, single key/null or `multiple` key array, `onOpenChange` |
| `Tabs`                                     | Route-stack switcher with tab panes                      | `tabs`, `selectedKey`, `onSelectionChange`                       |
| `TabList`, `Tab`, `TabMenu`                | Navigation strip or controlled tab strip + overflow menu | `value`, `onChange`, `role`, `href`, `isDisabled`                |
| `AppShell`                                 | Top, side, and mobile navigation frame                   | `topNav`, `sideNav`, `banner`, `mobileNav`                       |
| `TopNav`, `TopNavHeading`, `TopNavItem`    | Top navigation bar and items                             | `heading`, `startContent`, `endContent`, `href`                  |
| `SideNav`, `SideNavSection`, `SideNavItem` | Collapsible side rail with grouped items                 | `collapsible`, `resizable`, `isSelected`                         |
| `MobileNav`, `MobileNavToggle`             | Mobile navigation drawer and toggle                      | `isOpen`, `onOpenChange`, `side`, `width`                        |
| `NavIcon`                                  | Circular icon container for navigation                   | `icon`                                                           |
| `NavHeadingMenu`, `NavHeadingMenuItem`     | Keyboard-operable heading menu                           | `label`, `description`, `href`, `isDisabled`                     |
| `Toolbar`                                  | Labeled action row with start/center/end slots           | `label`, `orientation`, `dividers`                               |
| `OverflowList`                             | Responsive list that collapses excess items              | `overflowRenderer`, `maxVisibleItems`, `onOverflowChange`        |
| `useResizable`, `ResizeHandle`             | Bounded, optionally persistent panel resizing            | `defaultSize`, `minSize`, `maxSize`, `autoSaveId`                |
| `Breadcrumbs`                              | Ancestor path trail                                      | `items`, `separator`, `maxVisibleItems`, `overflowMenu`          |
| `Pagination`                               | Prev/next + windowed page buttons                        | `page`, `pageCount`, `onPageChange`                              |
| `Stepper`                                  | Multi-step progress/flow control                         | `steps`, `current`, `onStepChange`                               |
| `NavigationMenu`                           | Simple item-array navigation strip                       | `items`, `horizontal`, `href`                                    |
| [`CommandPalette`](command-palette.md)     | Searchable commands; mobile search sheet                 | `open`, `items` / `searchSource`, `searchMode`, `onValueChange`  |
| `DropdownMenu`                             | Anchored action menu                                     | `trigger`, `items` / children, `placement`, `isOpen`             |
| `ContextMenu`                              | Secondary-press action menu                              | `items` / `menu`, `trigger`, `isOpen`, `onOpenChange`            |

`Tabs` hosts named route stacks from `TabSpec`; `TabList` is the smaller
navigation or page-tab strip for caller-owned content. Use `TabList` without
`role="tablist"` for navigation links; add that role when it controls
caller-owned panels. `AppShell` changes the side navigation to a mobile drawer
below its configured breakpoint. The
[navigation shell guide](navigation-ui.md) covers composition, portable
boundaries, overflow, and resizing.

```tsx
import { TabList, Tab, AppShell, SideNav, SideNavItem, Text } from '@octane-xplat/ui'

export function Example() {
	return (
		<AppShell
			sideNav={
				<SideNav>
					<SideNavItem label="Projects" href="/projects" />
				</SideNav>
			}
			mobileNav={{ breakpoint: 'md' }}
		>
			<TabList value="projects" onChange={(value) => console.log(value)}>
				<Tab value="projects" label="Projects" href="/projects" />
			</TabList>
			<Text>Projects</Text>
		</AppShell>
	)
}
```

## Data display

| Component                          | What it is                                   | Key props                                                               |
| ---------------------------------- | -------------------------------------------- | ----------------------------------------------------------------------- |
| `List`                             | Non-virtual content list                     | `listStyle`, `density`, `hasDividers`, `start`                          |
| `ListItem`                         | Labeled row inside `List`                    | `label`, `description`, `startContent`, `endContent`, `onPress`, `href` |
| `Table`                            | Columnar rows                                | `columns`, `rows`, `idKey`, `renderCell`, `onRowPress`                  |
| `TreeList`                         | Expandable node hierarchy                    | `nodes`, `expandedKeys`, `selectionMode`, `onAction`                    |
| `Timeline`                         | Vertical event list (dot + connector)        | `items`                                                                 |
| `ProgressGroup`                    | Stacked labeled `Meter` rows                 | `items`                                                                 |
| `Meter`                            | Gauge/dash ring (meter role, not progress)   | `value`, `minValue`, `maxValue`, `valueLabel`, `strokeWidth`            |
| `ProgressBar`                      | Linear determinate or indeterminate progress | `value`, `max`, `label`, `marks`                                        |
| `MetadataList`, `MetadataListItem` | Aligned label/value details                  | `columns`, `label`, `children`                                          |
| `StatusDot`                        | Accessible colored status signal             | `variant`, `label`, `isPulsing`, `tooltip`                              |
| `Timestamp`                        | Localized relative or absolute instant       | `value`, `valueUnit` (numeric values), `format`, `isLive`               |
| `Timer`                            | Live elapsed duration                        | `startTimeMs` (Unix ms), `format`, `type`, `size`                       |
| `Outline`                          | Navigable heading outline                    | `items`, `activeId`, `hasScrollOnClick`                                 |
| `Spinner`                          | Self-drawn loading indicator                 |                                                                         |

`Table` keeps your row type through `rows`, `renderCell`, `onRowPress`, and
`idKey`; each column key must name a field on the row. The `renderCell`
callback receives a `TableCellRenderProps` context with the row, column, and
current row index:

```tsx
import { Table, Text } from '@octane-xplat/ui'

type Product = { name: string; stock: number }

export function Example() {
	const rows: Product[] = [{ name: 'Notebook', stock: 4 }]

	return (
		<Table
			columns={[{ key: 'name' }, { key: 'stock' }]}
			rows={rows}
			renderCell={({ row, column, rowIndex }) => (
				<Text>
					{rowIndex + 1}. {String(row[column.key])}
				</Text>
			)}
		/>
	)
}
```

**Migrating existing code:** `renderCell` now receives one named context
instead of three positional arguments. Change
`renderCell={(row, column, rowIndex) => ...}` to
`renderCell={({ row, column, rowIndex }) => ...}`.

`TreeList` accepts any node type with `key`, `label`, and `children`. Item
identity uses the shared `Key` domain (`string | number`) — the same one
`useListData`, `useTreeData`, and `GridList` selection report — so a key
returned by a store means the same thing to a view. `TreeList` expands and
selects by key: `expandedKeys`/`defaultExpandedKeys`/`onExpandedChange` own
the open set, and `selectionMode` plus `selectedKeys`/`defaultSelectedKeys`/
`onSelectionChange` select leaf rows — parent rows always expand on press,
and `onAction` reports leaf activation.

```tsx
import { TreeList } from '@octane-xplat/ui'
import { useState } from 'octane'

export function Example() {
	const [expanded, setExpanded] = useState<ReadonlySet<string | number>>(new Set(['src']))

	return (
		<TreeList
			nodes={[{ key: 'src', label: 'src', children: [{ key: 'app', label: 'App.tsrx' }] }]}
			expandedKeys={expanded}
			onExpandedChange={setExpanded}
			selectionMode="single"
			onAction={(key) => console.log('activated', key)}
		/>
	)
}
```

**Migrating existing code:** `Table`'s `keyFor` was renamed to `idKey`, which
also accepts a `key`-typed row field name (`idKey="id"`); the default row key
now reads the row's `id` or `key` property before falling back to its index.
`columns` keys are now checked against the row type — a column that names no
row field is a type error; extend the row type or render it through
`renderCell`.
`TreeList`'s `defaultExpanded`
became `defaultExpandedKeys`, `onToggle` became `onExpandedChange` (it reports
the complete expanded key set, not one key), and `onSelect` became `onAction`
with the leaf's key as its argument. The visual `TreeNode` prop type is now
`TreeListNode` — the exported `TreeNode` is the `useTreeData` store node
(still available as `CollectionTreeNode`). Store snapshots from
`useListData`, `useTreeData`, and `useAsyncList` now type `items` and
`selectedKeys` as readonly.

## Scrolling

| Component                        | What it is                                      | Key props                             |
| -------------------------------- | ----------------------------------------------- | ------------------------------------- |
| `ScrollableArea`                 | Scrollable region with optional pull-to-refresh | `axis`, `refreshing`, `onRefresh`     |
| [`VirtualList`](virtual-list.md) | Windowed long list                              | `items`, `keyExtractor`, `renderItem` |

## Chat

The Chat family provides a docked composer and composable message rows. Start
with [`ChatLayout`](../../.agents/docs/recipes/chat-conversation.md) for a complete conversation
or combine `ChatMessageList`, `ChatMessage`, and `ChatMessageBubble` inside an
existing scroll surface.

```tsx
import { ChatLayout, ChatComposer, ChatMessage, ChatMessageBubble } from '@octane-xplat/ui/chat'
import { useState } from 'octane'

export function Example() {
	const [message, setMessage] = useState('')

	return (
		<ChatLayout
			composer={
				<ChatComposer
					value={message}
					onChange={setMessage}
					onSubmit={(value) => console.log(value)}
				/>
			}
		>
			<ChatMessage sender="assistant">
				<ChatMessageBubble>Hello! Where are you traveling?</ChatMessageBubble>
			</ChatMessage>
		</ChatLayout>
	)
}
```

| Component                                                                                                                               | What it is                                                            | Key props                                                     |
| --------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- | ------------------------------------------------------------- |
| `ChatLayout`, `ChatLayoutScrollButton`                                                                                                  | Scrollable conversation, docked composer, and return-to-bottom action | `composer`, `keyboardFollow`, `bottomPanelHeight`, `scrollRef`, `density`              |
| `ChatMessageList`                                                                                                                       | Density-aware message column with empty state and load-older callback | `density`, `gap`, `align`, `scrollToTopAction`, `isStreaming` |
| `ChatMessage`, `ChatMessageBubble`                                                                                                      | Sender alignment/context and filled or ghost bubble                   | `sender`, `name`, `avatar`, `variant`, `group`, `metadata`    |
| `ChatMessageMetadata`, `ChatSystemMessage`                                                                                              | Timestamp/status row and centered conversation notices                | `timestamp`, `status`, `variant`, `icon`                      |
| `ChatToolCalls`, `ChatTokenizedText`                                                                                                    | Expandable tool-call summary and token-aware message text             | `calls`, `isExpanded`, `tokens`                               |
| `ChatComposer`, `ChatComposerInput`, `ChatComposerDrawer`                                                                               | Composer shell, rich input, and collapsible context/attachment region | `onSubmit`, `value`, `triggers`, `onFiles`, `count`           |
| `ChatSendButton`, `ChatDictationButton`                                                                                                 | Send/stop action and speech input control                             | `isStopShown`, `isDisabled`, `onSend`, `onStop`               |
| `useChatStreamScroll`, `useChatNewMessages`, `useChatPasteAsToken`, `useChatComposerTokens`, `useSpeechRecognition`, `useChatDictation` | Hooks for streaming, new messages, tokens, and dictation              | See each hook's TSDoc                                         |

`ChatComposerInput.ref` delivers the component's portable imperative handle. Key and paste callbacks expose
portable event records; their `native` member carries a browser event only on
web. `ChatComposerFile` exposes name, MIME type, size, and the original browser
`File` in `native`; file delivery is web-only. Web token chips are inline in
the contenteditable field. Native input uses a text field with a token row,
and mid-text token placement is approximate. Native has no browser paste or
file-drop event, and native speech recognition reports unsupported. Top-load
detection uses an `IntersectionObserver` sentinel on web and a scroll-position
check on native. New-message tracking uses `ResizeObserver` on web and
`layoutChanged` on native. The Linux entry uses the web leaves; the AppKit
entry uses AppKit scroll geometry and native text-input behavior.
See [keyboard-following conversations](software-keyboard.md#keep-a-conversation-steady)
for keyboard policies and history anchoring.
Windows resolves the shared `index.ts` through its app TypeScript mapping;
its Chat runtime has not been exercised separately.

```tsx
import { Pressable, Text } from '@octane-xplat/ui'
import { ChatComposerInput } from '@octane-xplat/ui/chat'
import { useState, useRef } from 'octane'

export function Example() {
	const [message, setMessage] = useState('')
	const composer = useRef<import('@octane-xplat/ui/chat').ChatComposerInputHandle | null>(null)

	return (
		<>
			<ChatComposerInput
				value={message}
				onChange={setMessage}
				ref={(handle) => {
					composer.current = handle
				}}
				onKeyDown={(event) => console.log(event.key)}
			/>
			<Pressable onPress={() => composer.current?.focus()}>
				<Text>Write a message</Text>
			</Pressable>
		</>
	)
}
```

## Overlays

| Component                 | What it is                                        | Key props                                                      |
| ------------------------- | ------------------------------------------------- | -------------------------------------------------------------- |
| `Overlay`                 | Content above the screen                          | `open`, `defaultOpen`, `onDismiss`, `shadeCover`, `isModal`    |
| `Popover`                 | Anchored floating content                         | `anchor`, `open`, `defaultOpen`, `placement`, `onDismiss`      |
| `useLayer`                | Anchored/fixed overlay primitive (hook)           | `mode`, `ref`, `show`, `hide`, `isOpen`, `render`              |
| `Tooltip`                 | Pointer hover hint                                | `trigger`, `content`, `openDelay`                              |
| `HoverCard`               | Hover or touch-triggered card around its children | `content`, `placement`, `delay`, `touchTrigger`                |
| `Dialog`                  | Modal surface with optional header                | `isOpen`, `defaultOpen`, `onOpenChange`, `purpose`, `position` |
| `AlertDialog`             | Required-action confirmation dialog               | `isOpen`, `defaultOpen`, `title`, `actionLabel`, `onAction`    |
| `BottomSheet`             | Declarative in-window bottom sheet                | `isOpen`, `defaultOpen`, `snapPoints`, `onOpenChange`          |
| `BottomSheetSwitcher`     | Shared host for a set of sheets                   | `activeSheet`, `defaultActiveSheet`, `onActiveSheetChange`     |
| `Carousel`                | Horizontally scrolling child slides               | `children`, `gap`, `hasButtons`, `hasSnap`, `ref`              |
| `Lightbox`                | Fullscreen image or video gallery                 | `media`, `isOpen`, `index`, `onIndexChange`                    |
| `Toast` / `ToastViewport` | Transient notification card and stack             | `showToast`, `useToast`, `position`, `maxVisible`              |
| `Drawer`                  | Edge drawer                                       | `main`, `drawer`, `open`, `defaultOpen`, `onDismiss`           |

Use `Dialog` for optional or informational modal content and `AlertDialog` when
the user must choose an action. `BottomSheet` is the shared in-window surface;
the platform-native `@octane-xplat/sheet` package remains a separate API.
`showToast(options)` presents a transient toast and returns its `ToastHandle`
(`dismiss()`/`update(options)`), while `useToast()` targets the
nearest `ToastViewport` or the fallback viewport. Overlay visibility follows
the same state contract as the field controls: `open`/`isOpen` are controlled,
`defaultOpen` seeds an uncontrolled layer that closes itself when the user
dismisses it, and `onOpenChange`/`onDismiss` report the request — `isOpen`
wins when both are set. `BottomSheetSwitcher` uses `activeSheet`/
`defaultActiveSheet`/`onActiveSheetChange` for which child `sheetId` is
visible. Declared shared surfaces and declarative modal content preserve
context through native portals on iOS and Android, including platform list cells.
On macOS, registered sheet stacks, toast stacks, and anchored popups still
use separate roots; see the [boundary inventory](../../.agents/docs/notes/portal-boundaries.md). Scoped
imperative hooks and native route outlets preserve context too; see
[ownership examples](primitives.md#own-temporary-surfaces) and
[route providers](navigation.md#preserve-providers-across-native-pages).
Global ownerless service calls still require explicit props/params. `openWindow` opens a host
window where supported; modal routing shares the navigation layer — see
[navigation](navigation.md).

```tsx
import { Screen, Dialog, Text, Pressable, showToast } from '@octane-xplat/ui'
import { useState } from 'octane'

export function Example() {
	const [open, setOpen] = useState(false)

	return (
		<Screen>
			<Dialog isOpen={open} onOpenChange={setOpen}>
				<Text>Saved details</Text>
			</Dialog>
			<Pressable onPress={() => showToast({ body: 'Saved' })}>
				<Text>Save</Text>
			</Pressable>
		</Screen>
	)
}
```

On macOS, `Dialog` and `AlertDialog` present centered AppKit layers in the
owning window, `BottomSheet` docks to its bottom edge, and `Lightbox` covers
its content area. `ToastViewport` mounts timed edge stacks, and `showToast`
uses a fallback stack when needed. Anchored notifications keep the existing
`NSPopover` path. See [macOS presentation and verification](primitives.md#macos-shared-presentations).
Lightbox video playback is unavailable; use the separate `@octane-xplat/video`
package when your screen needs a player. macOS `Overlay` retains its
experimental inline implementation. `Carousel` is a basic horizontal scroller without navigation buttons, looping,
edge fades, or a `CarouselHandle`; `ScrollableArea` supports block (the default), inline, and both-axis scrolling;
pull-to-refresh remains unsupported on macOS. Use the
[app-owned refresh action](primitives.md#macos-scrolling-and-refresh) instead.

```tsx
import { Dialog, Toast, ScrollableArea, Text } from '@octane-xplat/ui'

export function Example() {
	return (
		<>
			<Dialog isOpen onOpenChange={() => {}}>
				<Text>Presented details on AppKit</Text>
			</Dialog>
			<Toast body="Saved" />
			<ScrollableArea axis="both">
				<Text>Content</Text>
			</ScrollableArea>
		</>
	)
}
```

## Leaf packages

Features that need a NativeScript plugin ship as their own
packages so `@octane-xplat/ui` keeps zero required plugin deps:

| Package                 | Exports                                                                                        | What it is                                                                                    |
| ----------------------- | ---------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `@octane-xplat/pager`   | `Pager`                                                                                        | Full-page swipe container                                                                     |
| `@octane-xplat/camera`  | `CameraView`, `createCameraSession`                                                            | Camera preview and movie recording                                                            |
| `@octane-xplat/video`   | `Video`                                                                                        | Embedded video player                                                                         |
| `@octane-xplat/gif`     | `AnimatedImage`                                                                                | Animated images (GIF/webp)                                                                    |
| `@octane-xplat/image`   | `Image`, `initializeImageCache`, `prefetch`, `evictImage`, `clearImageCaches`, `isImageCached` | Recommended `Image` on native (Glide/SDWebImage via ui-image) — same contract as core `Image` |
| `@octane-xplat/canvas`  | `Canvas`, `getGPU`                                                                             | Canvas/GPU surface (2D, WebGL/WebGPU)                                                         |
| `@octane-xplat/audio`   | `createAudioPlayer`                                                                            | Long-form audio playback                                                                      |
| `@octane-xplat/haptics` | `createHaptics`                                                                                | Capability-aware haptics                                                                      |
| `@octane-xplat/sounds`  | `createSoundBank`                                                                              | Short UI sound effects                                                                        |
| `@octane-xplat/effects` | `ShaderEffect` (`/ios`, `/android` only)                                                       | View-effect shaders (Metal stitch / AGSL)                                                     |
| `@octane-xplat/shaders` | `createShader`, `createSharedDevice`, `prefersReducedMotion`                                   | `shaders` engine on Canvas (WebGPU; iOS/Android experimental)                                 |
| `@octane-xplat/auth`    | `appleAuth`, `googleAuth`, `AppleSignInButton`, `GoogleSignInButton`                           | Provider sign-in (Apple / Google SDKs)                                                        |

See [search, select, and token entry](search-selection.md) for `SearchSource`, `Typeahead`, `Tokenizer`, `Token`, and `ComplexSelector` workflows and platform limits.

Shared menu parts and their state/keyboard contracts are explained in [Add actions and choices to a menu](../menus.md).


## Media contrast and row actions

On web, `useImageMode` samples an image and returns `"dark"` or `"light"` for
its surface luminance. It returns your fallback while loading or when decoding,
CORS, or canvas support prevents sampling. Native hosts currently return the
fallback without sampling; use an explicit surface mode there. A normalized
region selects the part behind your controls (coordinates run from 0 to 1).

```tsx
import { Theme, Text, getRegisteredTheme, useThemeName, useImageMode, defineTheme } from '@octane-xplat/ui'

const mediaTheme = defineTheme({ name: 'photo' })

export function PhotoCaption(props: { src: string }) {
  const theme = getRegisteredTheme(useThemeName()) ?? mediaTheme
  const mode = useImageMode(props.src, {
    region: { x: 0, y: 0.5, width: 1, height: 0.5 },
    fallback: 'dark',
  })
  return <Theme theme={theme} mode={mode ?? 'dark'}><Text>Summer trip</Text></Theme>
}
```

`useContainerReveal` reveals secondary actions on web when the row is hovered
or receives keyboard focus. Actions remain mounted and tabbable. Touch hosts
keep them visible; native desktop hover reveal is not implemented. This subset
supports `isEnabled`, `getContainerProps()` and `getContentRevealProps()`;
Astryx's delay, inversion and force-state options are not supported.

```tsx
import { Button, HStack, Text, useContainerReveal } from '@octane-xplat/ui'

export function FileActions() {
  const reveal = useContainerReveal()
  return (
    <HStack {...reveal.getContainerProps()}>
      <Text>report.pdf</Text>
      <HStack {...reveal.getContentRevealProps()}>
        <Button label="Edit report" />
      </HStack>
    </HStack>
  )
}
```
