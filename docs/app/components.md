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

On experimental AppKit, Text and Heading now preserve inline declaration strings
and runtime style arrays beneath authored override order. Heading root and
purpose imports use the same leaf. RichText and RichTextSpan forward their
styles for renderer normalization, and RichText preserves its declared ID.
The renderer parses declaration strings before validation; malformed lists fail
before native allocation. Type-scale defaults and maxLines remain. Native glyph
metrics, truncation, rich-run layout and heading/VoiceOver semantics still need
qualification; forwarding is source evidence.

```tsx
import { Heading, Text } from '@octane-xplat/ui'
export function Summary({ points }: { points: number }) {
	return <>
		<Heading level={2} style={{ fontSize: points }}>Summary</Heading>
		<Text type="body" style={`font-size:${points}px`}>Ready to review</Text>
	</>
}
```

AppKit nested Text and RichText now compose logical styled runs under one text
owner; Text inside Heading uses that owner too. RichText purpose imports use the
same AppKit leaf as root imports. RichTextSpan.text wins over children (including
an explicit empty string); an omitted/null text uses children. Top-level Text
and RichText forward parent-layout props, while outer Text owns line caps and
allows shrinking when capped. Inline runs do not own separate layout boxes or
line caps. Per-span onPress hit testing remains unimplemented on AppKit; native
shaping, layout, truncation and accessibility remain unqualified.

```tsx
import { Heading, RichText, RichTextSpan, Text } from '@octane-xplat/ui'
export function Notice() {
	return <>
		<Heading level={2}>Your <Text weight="bold">account</Text></Heading>
		<Text>Read the <Text style={{ fontWeight: 600 }}>latest update</Text>.</Text>
		<RichText><RichTextSpan text="Ready to review" /></RichText>
	</>
}
```

Outer AppKit Text now forwards testID, accessible, accessibilityHint and
accessibilityValue as well as its existing accessible name. Hints use native
help text; the portable value uses a native value description so visible text
stays intact. Removing those descriptions clears them to nil; removing an
explicit accessibility visibility override restores element participation.
Inner runs still belong to their outer owner. Text state/live announcements and
other arbitrary role mappings remain separate gaps; actual VoiceOver behavior
and native update/removal still need qualification.

```tsx
import { Text } from '@octane-xplat/ui'
export function Count({ count }: { count: number }) {
	return <Text testID="item-count" accessibilityLabel="Items"
		accessibilityHint="Review the collection." accessibilityValue={`${count} items`}>
		{count}
	</Text>
}
```

AppKit Heading now passes its level to the readable host. The renderer maps it
to a native heading role, uses the numeric level for the accessibility value,
and keeps its accessible title current with plain or rich contents. The default
level is 2; a display `type` changes appearance while `level` keeps its semantic
meaning. Visible text is preserved. Actual VoiceOver heading navigation, level
announcements and dynamic updates remain unqualified.

```tsx
import { Heading, Text } from '@octane-xplat/ui'
export function AccountTitle({ title }: { title: string }) {
	return <Heading level={2} type="display-2">Your <Text>{title}</Text></Heading>
}
```

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

### Busy feedback on AppKit

AppKit Spinner now uses the shared named sizes, text/node labels and on-media
contrast. `busy={false}` removes it; `accessibilityLabel` names the progress
owner. A labeled spinner uses one root ID. AppKit-specific rotation rules now
use the renderer's existing keyframe sampler. A reduced-motion rule leaves the
ring steady; workspace display-option notifications refresh that media query.
Actual animation, notification delivery, appearance and accessibility remain
unqualified.

```tsx
import { Spinner } from '@octane-xplat/ui'

export function Saving() {
	return <Spinner id="saving" size="sm" label="Saving settings" accessibilityLabel="Saving" />
}
```

AppKit Switch now includes a compact ring inside its thumb while changeAction
is pending or `isLoading` is set. Its existing busy state and pending-save
guards remain. Native clipping, contrast, loading presentation and VoiceOver
still need qualification.

```tsx
import { Switch } from '@octane-xplat/ui'

export function Alerts({ save }: { save(next: boolean): Promise<void> }) {
	return <Switch label="Alerts" defaultValue changeAction={save} />
}
```

AppKit ProgressBar now preserves object, array and CSS-string styles and follows
the app theme. It forwards accessibility names, hints and determinate value
overrides; unknown progress omits numeric range/value, skips the formatter,
readout and marks, and reports busy state. Disabled progress reports disabled
state. Unknown progress now selects an AppKit-specific sliding 40% fill clipped
to its track; reduced motion leaves steady feedback. Switching to determinate
removes the animation class. Actual playback, preference delivery, appearance,
layout and VoiceOver remain unqualified.

```tsx
import { ProgressBar } from '@octane-xplat/ui'
export function Upload({ percent }: { percent?: number }) {
	return <ProgressBar label="Upload" value={percent} isIndeterminate={percent === undefined}
		hasValueLabel accessibilityHint="Keep the app open" style="width:240px" />
}
```

AppKit Meter now uses the same leaf from root, purpose imports and ProgressGroup.
It keeps supplied content and an unfilled track, preserves style forms and uses
normalized finite range metadata. Size defaults to 24 for invalid/nonpositive
values; stroke width defaults to 3 for nonfinite values and clamps to the size.
The value arc and `color` remain unimplemented. Native ring/layout/VoiceOver
qualification is separate from this import and metadata repair.

```tsx
import { Meter, Text } from '@octane-xplat/ui'
export function Storage() {
	return <Meter value={6} maxValue={10} size={48} accessibilityLabel="Storage"
		valueLabel="6 GB of 10 GB used" style="margin-left:8px"><Text>6 GB</Text></Meter>
}
```

### Radio choices on AppKit

AppKit RadioList now shares selection between `options` and RadioListItem
children. Options render descriptions and trailing content; standalone groups
render Field metadata, while an enclosing Field owns it instead. Native rows
expose radio roles, explicit names and checked state. Controlled parents apply
onValueChange feedback; disabled/read-only groups block both item forms.

```tsx
import { RadioList, RadioListItem } from '@octane-xplat/ui'

export function Plan() {
	return <RadioList label="Plan" defaultValue="free"
		options={[{ value: 'free', label: 'Free', description: 'Personal use' }]}>
		<RadioListItem value="team" label="Team" description="Shared projects" />
	</RadioList>
}
```

Held AppKit item/key handlers now check the current group and row state.
Uncontrolled selection updates its local value before render, so an immediate
repeat does not report the same selection twice. Controlled parents still own
checked state; separate requests can repeat while a parent rejects feedback.
Nested selection during `onValueChange`, removed rows and retired groups cannot
select. Changing a child value updates its native registration.

```tsx
import { useState } from 'octane'
import { RadioList, RadioListItem } from '@octane-xplat/ui'
export function CurrentPlan({ locked }: { locked: boolean }) {
	const [value, setValue] = useState('free')
	return <RadioList label="Plan" value={value} onValueChange={setValue} isReadOnly={locked}>
		<RadioListItem value="free" label="Free" />
		<RadioListItem value="team" label="Team" />
	</RadioList>
}
```

Eight [ownership cases](../../packages/ui/src/radio-ownership.macos.mobile.test.tsrx)
are authored, all unrun. Fake row/responder dispatch does not prove native
pointer, keyboard, focus, accessibility or packaging behavior.

Standalone RadioListItem remains presentational. For ordinary form groups,
arrows and Home/End now move focus and request selection; horizontal arrows
respect RTL. Controlled parents must accept the request to update checked state.
Registered items use the renderer's roving Tab exclusions when available; keys
on interactive trailing children remain with those controls. Native pointer/
keyboard/Tab, reveal/focus, VoiceOver/group relationships and layout remain
unqualified. Toolbar-specific radio navigation remains unsupported. Indicator
overrides use the existing registry; their native presentation also needs
qualification.

```tsx
import { Field, RadioList, RadioListItem } from '@octane-xplat/ui'

export function LockedPlan() {
	return <Field label="Plan" isReadOnly>
		<RadioList defaultValue="free"><RadioListItem value="free" label="Free" /></RadioList>
	</Field>
}
```

### Checkbox lists on AppKit

AppKit CheckboxList now shares a checked-value set across `options` and
CheckboxListItem children, including descriptions and trailing content. A
standalone item without `value` uses `isChecked`/`onCheck` instead, so it can
represent a mixed-state “select all” row. Controlled owners apply the requested
array or boolean feedback. Field metadata renders once and inherited disabled/
read-only state blocks both member and standalone rows.

```tsx
import { useState } from 'octane'
import { CheckboxList, CheckboxListItem } from '@octane-xplat/ui'

export function Notifications() {
	const [value, setValue] = useState<string[]>([])
	return <CheckboxList label="Notifications" value={value} onValueChange={setValue}
		options={[{ value: 'email', label: 'Email', description: 'A daily summary' }]}>
		<CheckboxListItem value="alerts" label="Alerts" description="Immediate updates" />
	</CheckboxList>
}
```

Rows expose native checkbox names and mixed/checked state. Indicator overrides,
composed class/style forms and the divider class remain available. Native input,
independent Tab stops, mixed-state VoiceOver, nested trailing controls, divider/
layout appearance and packaging remain unqualified.

```tsx
import { CheckboxListItem } from '@octane-xplat/ui'

export function SelectAll({ onCheck }: { onCheck(checked: boolean): void }) {
	return <CheckboxListItem label="All notifications" isChecked="indeterminate" onCheck={onCheck} />
}
```

### Checkbox metadata on AppKit

Standalone AppKit Checkbox renders its label and description beside the
indicator, with status below. An enclosing Field owns this text instead.
`isLabelHidden` hides the standalone text while retaining its accessible name.
`labelTooltip` forwards to the label's existing info affordance; an enclosing Field
owns that affordance instead. Native tooltip activation remains unqualified.
Mixed state requests `true` when toggled; controlled parents apply the callback.
Native input, nested hit testing, focus and accessibility remain unqualified.
The AppKit leaf still ignores `changeAction`; use controlled state and save in
`onChange` until its async/mixed-state rollback contract is resolved.

```tsx
import { Checkbox } from '@octane-xplat/ui'

export function IncludeArchived() {
	return <Checkbox label="Include archived records" description="Search older entries"
		labelTooltip="Include records saved in the archive" defaultValue="indeterminate" status={{ type: 'warning', message: 'Some records are selected' }} />
}
```

### Save a switch setting on AppKit

Supply `changeAction` to save a toggle after `onChange`. While the action runs,
the AppKit switch reports busy and blocks overlapping toggles. Rejection or a
synchronous throw restores the previous uncontrolled value and calls `onChange`
with that previous value. Controlled parents must apply the callback themselves.
Completion after unmount is ignored. Ownership is claimed before onChange, so
reentrant callbacks cannot start duplicate saves. Cached handlers read current
blocking props/callbacks. An event's save still runs after onChange detaches the
control, while pending/rollback updates do not touch detached UI. A throwing
forward callback releases ownership and propagates; rollback callback faults are
logged and release busy state. Native activation and presentation remain
unqualified; four additional regression cases are authored and unrun.

```tsx
import { Switch } from '@octane-xplat/ui'

export function Notifications({ save }: { save(enabled: boolean): Promise<void> }) {
	return <Switch accessibilityLabel="Notifications" defaultValue={false}
		changeAction={save} />
}
```

Standalone AppKit switches render a label/description column beside the track
and a detached status below. Use `labelPosition="start"` to put text first,
`labelSpacing="spread"` to separate text and track, or `size="sm"` for the
shared compact geometry. An enclosing Field owns this metadata instead.
Hidden labels keep their accessible name. Label presses now use the same
toggle/save path and request focus on the switch; the label target uses the
renderer's Tab-stop suppression lease. If that bridge capability is absent,
activate the track. Actual label hit testing, tooltip arbitration, focus, Tab
order, layout and accessibility still need native qualification.

```tsx
import { Switch } from '@octane-xplat/ui'

export function EmailAlerts() {
	return <Switch label="Email alerts" description="Send a daily summary"
		defaultValue labelPosition="start" labelSpacing="spread" width={280}
		status={{ type: 'error', message: 'Try saving again' }} />
}
```

### Slider on AppKit

Use an uncontrolled slider for a settings range, or supply `value` and
`onValueChange` together. The AppKit leaf implements scalar/range values,
bounds, steps, marks and formatted readouts. Each range thumb has its own
keyboard and accessibility adjustment handlers. Arrows request one step (1%
of the full range when omitted); Home/End request that thumb's allowed bounds.

```tsx
import { Slider } from '@octane-xplat/ui'

export function PriceRange() {
	return <Slider label="Price range" defaultValue={[20, 80]} min={0} max={100}
		step={5} valueDisplay="text" formatValue={(value) => `$${value}`}
		marks={[{ value: 0, label: 'Low' }, { value: 100, label: 'High' }]} />
}
```

Dragging uses distance from the starting point and chooses the nearest thumb;
tapping the track does not jump the value. Thumbs cannot cross. `isDisabled`
and `isReadOnly` also inherit from Field. Retained thumb key/accessibility
handlers use current values, bounds, steps and callbacks, reject blocked or
detached hosts, and suppress nested value changes during onValueChange. A
consumer exception releases that claim and propagates. Drag previews belong to
their active gesture. Matching normalized parent feedback keeps that gesture;
a different parent value, controlled/uncontrolled switch, bounds/step/shape
change or blocking retires it before it can mask current state. Keys or
accessibility adjustments also end the drag preview. Repeating the starting or
latest requested normalized value is matching feedback, not an explicit reset.
Steps use the existing web grid
anchored at zero, then clamp to bounds. Native input, Tab/VoiceOver, hover
tooltips, layout and pixel parity remain unqualified; these changes have source
coverage only. `valueDisplay="tooltip"` uses AppKit's hover tooltip timing.

```tsx
import { Field, Slider } from '@octane-xplat/ui'

export function LockedVolume() {
	return <Field label="Volume" isReadOnly>
		<Slider defaultValue={0.5} min={0} max={1} valueDisplay="tooltip" />
	</Field>
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

### Number fields on AppKit

The AppKit `NumberInput` leaf implements trailing `units`, `formatValue`, optional
steppers and a clear action. Clear reports `null` before `onClear`; `null` stays
an explicitly controlled empty value. Standalone fields own their label,
description, status and width; an enclosing `Field` keeps that ownership and
its disabled/read-only state blocks both typing and steppers. Metadata and
stepper visibility changes reuse the editing control.

```tsx
import { useState } from 'octane'
import { NumberInput } from '@octane-xplat/ui'

export function Mass() {
	const [value, setValue] = useState<number | null>(2)
	return <NumberInput label="Mass" value={value} onValueChange={setValue}
		min={0} max={9} step={0.5} units="kg" width={280}
		formatValue={(number) => number.toFixed(1)} hasClear hasNumberSteppers={false} />
}
```

The formatter changes display text; it does not define an inverse locale or
currency parser. Editing still uses the existing shared `parseFloat` behavior.
Native layout, formatted/partial edits, IME, pointer and keyboard activation,
focus, accessibility and packaging remain unqualified.

### AppKit segmented control

The experimental native macOS leaf renders options or child items and supports
controlled/uncontrolled selection, disabled/read-only state and fill layout.
Arrow keys wrap through enabled segments, Home/End reach the endpoints, and
horizontal arrows follow the UI provider's text direction. Enter/Space use
the renderer's activation path. Icon-only items retain their label for
accessibility. OS keyboard input, Tab entry, focus appearance, VoiceOver and
pixel parity still require qualification.

```tsx
import { SegmentedControl, SegmentedControlItem } from '@octane-xplat/ui'

export function MailboxFilter() {
	return <SegmentedControl defaultValue="inbox" layout="fill" accessibilityLabel="Mailbox">
		<SegmentedControlItem value="inbox" label="Inbox" />
		<SegmentedControlItem value="sent" label="Sent" />
		<SegmentedControlItem value="archived" label="Archived" isDisabled />
	</SegmentedControl>
}
```

### Responsive AppKit layout

In an experimental native macOS app, `useMediaQuery` follows the primary host
window's content dimensions in dips and updates on resize. AppKit reports a
fine pointer and hover support. The native subset accepts min/max width/height
in `px`, `pointer`, `any-pointer`, `hover`, `any-hover`, `orientation`, term
negation, `and`, `or` and comma alternatives. A missing host returns false.
Nested conditions, CSS range syntax, secondary-window ownership and
reduced-motion queries are outside this subset. Actual resize/rendering and
packaged-app qualification remain pending.

```tsx
import { Text, useMediaQuery } from '@octane-xplat/ui'

export function LayoutHint() {
	const wide = useMediaQuery('(min-width: 800px)')
	const hover = useMediaQuery('(pointer: fine) and (hover: hover)')
	return <Text>{wide ? 'Wide layout' : 'Compact layout'}{hover ? ' with pointer actions' : ''}</Text>
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

For images on iOS/Android, prefer the `Image` from `@octane-xplat/image` — same
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
| `DropdownMenu`                             | Anchored action menu                                     | `button`, `items` / children, `placement`, `isOpen`             |
| `ContextMenu`                              | Secondary-press action menu                              | `items` / `menu`, `trigger`, `isOpen`, `onOpenChange`            |

### Tab strips on AppKit

AppKit TabList now uses native geometry to reveal selected or keyboard-focused
tabs horizontally while preserving the page's vertical offset. Registered Tab
children use one roving keyboard stop when the renderer suppression bridge is
available. Arrows and Home/End move focus without selecting; Enter/Space
activate the focused tab. Horizontal arrows respect text direction and skip
disabled/hidden tabs. Under `role="tablist"`, vertical arrows remain available
to the page; navigation strips accept both axes.

```tsx
import { useState } from 'octane'
import { TabList, Tab, Text } from '@octane-xplat/ui'

export function Sections() {
	const [value, setValue] = useState('overview')
	return <>
		<TabList role="tablist" value={value} onChange={setValue}>
			<Tab value="overview" label="Overview" />
			<Tab value="details" label="Details" />
			<Tab value="unavailable" label="Unavailable" isDisabled />
		</TabList>
		<Text>{value}</Text>
	</>
}
```

Visible and hidden tabs now have explicit accessible names; disabled tabs keep
their tab role and disabled state. The strip exposes native tab-group semantics.
Keyboard event delivery, Tab order, scroll geometry, VoiceOver, panel
relationships and layout remain unqualified. TabMenu overflow ownership is
described below. Missing keyboard/suppression
bridges retain the corresponding native fallback; do not infer tested keyboard
support from source presence. See the [native fixture](https://github.com/octane-xplat/octane-xplat/blob/feat/appkit-native-support/examples/probes/tab-list.macos.tsrx).

```tsx
import { TabList, Tab } from '@octane-xplat/ui'

export function ControlledStrip({ value, onChange }: { value: string; onChange(value: string): void }) {
	return <TabList role="tablist" value={value} onChange={onChange} overflow="scroll">
		<Tab value="overview" label="Overview" />
		<Tab value="details" label="Details" isLabelHidden icon="xplat-search" />
	</TabList>
}
```

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


### Overflow tabs on AppKit

AppKit TabMenu now registers its trigger with the surrounding tab strip. The
selected overflow value identifies that same trigger, so strip arrows and the
roving Tab candidate include it. Plain Down/Up from the trigger requests first/
last-option opening; Enter/Space keeps normal press activation. Compose it with
controlled tabs, as in the ComponentsDemo overflow example:

```tsx
import { useState } from 'octane'
import { TabList, Tab, TabMenu, Text } from '@octane-xplat/ui'

export function Sections() {
	const [value, setValue] = useState('overview')
	return <>
		<TabList role="tablist" value={value} onChange={setValue}>
			<Tab value="overview" label="Overview" />
			<TabMenu label="More" options={[
				{ value: 'settings', label: 'Settings' },
				{ value: 'support', label: 'Support' },
			]} />
		</TabList>
		<Text>{value}</Text>
	</>
}
```

The popup reuses the AppKit menu surface: arrows/Home/End and typeahead move
option focus, Enter/Space selects, and Tab/Shift-Tab requests a current trigger
neighbor after closure. Ordinary Escape stays with layer dismissal and requests
trigger return. Navigation alone does not select a value. Current options and
attachment guard selection; reentrant callbacks cannot select twice or reopen
while a selection is being reported. Empty option lists disable the AppKit
trigger and close an open popup. Older bridges retain pointer selection:

```tsx
<TabList value={section} onChange={setSection}>
	<Tab value="home" label="Home" />
	<TabMenu label="More" options={extraSections} />
</TabList>
```

The original six object-driver cases and maintained tab-menu fixture remain
unrun; focused-row repair has additional unrun cases below. This source path requires matching keyboard/focus bridges; it does not
qualify physical keys, native refs/window/focus/Tab/return, scroll reveal,
popup/modal integration, menu radio mark announcements or packaging. Focused-row
repair source ownership is described in the [dynamic menu guide](../menus.md#keep-focus-owned-when-appkit-menu-rows-change); native delivery remains unqualified.

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

### GridList on AppKit

Use `GridList` for a small collection of selectable cards or rows. On experimental
AppKit, its default arrow mode keeps one native Tab stop. Left/Right move one
slot; Up/Down use `columns` or the rendered row positions; Home/End move to the
first/last enabled row. Navigation skips hidden and disabled rows, scrolls the
focused row into view, and follows the native layout direction. Enter activates
`onAction` and selects; Space selects without activation. Shift+Space extends
the selection from the anchor key and skips disabled keys.

```tsx
import { GridList, Text } from '@octane-xplat/ui'

export function Documents() {
	return <GridList
		items={[{ id: 'notes' }, { id: 'budget' }, { id: 'draft' }]}
		columns={2}
		selectionMode="multiple"
		disabledKeys={['budget']}
		renderItem={(item) => <Text>{item.id}</Text>}
		onAction={(key) => console.log('open', key)}
		onSelectionChange={(keys) => console.log('selected', keys)}
	/>
}
```

For cells containing buttons or text inputs, choose `keyboardNavigationBehavior="tab"`.
Each enabled row keeps its native Tab stop, arrows stay with the content, and
nested controls retain their editing/activation keys. The selector-based
`useGridList` hook still reports false on AppKit; the component owns an explicit
native row registry. Shift+click range selection is not implemented. Native accessibility still exposes a group and
button rows rather than a complete grid/row model. Real OS Tab/arrow input,
scrolling, IME, accessibility and packaging remain unqualified.

```tsx
import { GridList, TextInput } from '@octane-xplat/ui'

export function EditableRows() {
	return <GridList
		items={[{ id: 'first' }, { id: 'second' }]}
		layout="stack"
		keyboardNavigationBehavior="tab"
		renderItem={(item) => <TextInput label={item.id} />}
	/>
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

### Custom grid-cell focus on AppKit

In a configured native AppKit app, use `useGridFocus` for a custom palette of
focusable cells. Put this component in a `.macos.tsx` file. Attach the returned
ref and key handler to a raw native container, mark its cells with
`data-grid-cell`, and give each cell a real action. Positive integer `rows` and
`columns` describe the grid. The source implementation moves by one native cell
with Left/Right, by `columns` with Up/Down, and to an edge with Home/End.
Movement clamps at the first/last cell; item activation stays with the cell.

```tsx
/** @jsxImportSource @octane-xplat/jsx */
// Palette.macos.tsx
import { useState } from 'octane'
import { Text, View, useGridFocus } from '@octane-xplat/ui'
export function Palette() {
	const [chosen, setChosen] = useState('none')
	const grid = useGridFocus<NSView>({ rows: 2, columns: 2 })
	return <View className="gap-2">
		<masonview ref={grid.ref} onKeyDown={grid.onKeyDown} className="flex flex-row flex-wrap gap-2 w-72">
			{['Red', 'Blue', 'Green', 'Gold'].map((name) =>
				<masonview key={name} data-grid-cell className="w-32 p-2" accessible accessibilityRole="button"
					onTap={() => setChosen(name)}>
					<label text={name} />
				</masonview>)}
		</masonview>
		<Text>{`Chosen: ${chosen}`}</Text>
	</View>
}
```

`focusIndex` reports the last accepted hook-directed target index. Indices follow
the current native child order; keep persistent option IDs in your own selected
value. `onFocusChange` reports successful keyboard moves. The optional
`onFocusCell(index)` moves programmatically, clamps an integer index, and does
not select an item or call that callback. Its presence reflects bridge
availability and valid dimensions, not native input qualification.

```tsx
// PaletteControls.macos.tsx
import { Button, Text, View, useGridFocus } from '@octane-xplat/ui'
export function PaletteControls() {
	const grid = useGridFocus<NSView>({ rows: 1, columns: 2, onFocusChange: (index) => console.log(index) })
	return <View className="gap-2">
		<Button label="Focus last cell" clickAction={() => grid.onFocusCell?.(1)} />
		<masonview ref={grid.ref} onKeyDown={grid.onKeyDown} className="flex flex-row gap-2">
			<button data-grid-cell text="First" onTap={() => console.log('First')} />
			<button data-grid-cell text="Last" onTap={() => console.log('Last')} />
		</masonview>
		<Text>{`Hook index: ${grid.focusIndex}`}</Text>
	</View>
}
```

Native cell navigation skips hidden/disabled cells, keeps one roving cell Tab
stop, reveals a focused cell, and leaves descendant editing controls, IME,
modified shortcuts and already-prevented keys alone. Descendant controls retain
their own native Tab behavior. Nested marked grids and `GridList` components
own their cells separately. Mark raw native hosts: shared component props do
not automatically forward this marker. It is a presence marker, including a
false or empty value; omit it or pass `undefined` to remove it.

```tsx
// OptionalCell.macos.tsx
export function OptionalCell({ included }: { included: boolean }) {
	return <button data-grid-cell={included ? '' : undefined} text="Optional"
		onTap={() => console.log('Optional')} />
}
```

This is an experimental source implementation. Compiled hooks/marker forwarding,
real Tab/arrows, keyboard activation, editing/IME, native BOOL state, nested
ownership, focus/scroll timing, RTL presentation, layout, VoiceOver, cleanup and
installed consumers remain unqualified. The selector-based `useGridList` hook
still reports false; this API discovers marked cells rather than arbitrary CSS
selectors. The [manual probe](../../examples/probes/grid-cell-focus.macos.tsrx)
includes disabled/hidden/removed cells, current callbacks, programmatic focus,
nested grids and an editing child; its runner only records mounting and is unrun.

### Image loading on AppKit

AppKit `Image` accepts local and HTTP(S) sources and preserves its declared
parent-layout props, composed class names, and object/inline-CSS styles.
Concurrent views share a pending load. Changing the source or removing a view
releases that subscriber; the last removal cancels the work. Failed HTTP
responses do not populate the decoded-image cache. Remote processing is queued
on AppKit's main operation queue; actual delivery and responsiveness remain
unqualified. Remote loading remains subject to system transport and sandbox policy.

```tsx
import { Image } from '@octane-xplat/ui'

export function Photo({ src }: { src: string }) {
	return <Image src={src} alt="Photo" contentFit="contain" flexGrow={1}
		className={['photo', { framed: true }]}
		style={{ width: 120, height: 80 }} />
}
```

AppKit now computes `cover`, `contain`, `fill`, `none` and `scale-down`
rectangles and clips image drawing to its box. `contentPosition` accepts the
shared keywords, point offsets and percentages; percentages use the space left
between the image and its box, including negative space during a cover crop.
Changing fit/position or resizing the box invalidates native drawing. Raw CSS
`objectPosition` supports one/two-value positions and four-value edge offsets
using keywords, `px` and percentages; other units or
unresolved expressions warn and fall back to center. These are implementation
contracts: actual cropping, orientation, density and pixels remain unqualified.

```tsx
import { Image } from '@octane-xplat/ui'

export function Portrait({ src }: { src: string }) {
	return <Image src={src} alt="Portrait" contentFit="cover"
		contentPosition={{ top: 0, right: '25%' }}
		style={{ width: 120, height: 120 }} />
}
```

For resolution candidates, AppKit uses the shared closest-pixel-count rule
with the image box and its own window's backing scale. It reselects after
resize, attachment or backing-density changes; before attachment it falls
back to declared density at scale 1. Use a stable styled box for resolution
variants. Intrinsic-only source sets, screen transfers and actual asset density
still need native qualification.

```tsx
import { Image } from '@octane-xplat/ui'

export function Avatar() {
	return <Image alt="Profile photo" style={{ width: 80, height: 80 }} src={[
		{ uri: '~/avatar.png', width: 80, height: 80, scale: 1 },
		{ uri: '~/avatar@2x.png', width: 80, height: 80, scale: 2 },
	]} />
}
```

The optional image package reuses this core AppKit path and now has the
[AppKit byte-cache subset](../../packages/image/README.md#appkit-subset) for
prefetch, memory/disk queries, eviction and clear. Remote images now use a
dedicated credential-free transport; shared session cookies/credentials are not
reused. Engine-specific headers, decode bounds and transitions remain unimplemented.
Optional Image load/error callbacks now use current-request guards and the
owning root event scope; see the [event contract](../../packages/image/README.md#appkit-subset).
Reported dimensions use native representation pixels or 0×0 when unknown;
successful assignment does not prove native drawing. AppKit does not honor decode scheduling hints. Fit/position
use the native image's logical point dimensions, not an engine decode bound. Local placeholders remain on failure;
remote placeholders are ignored. Real native loading, cancellation, layout,
network errors and packaging still need qualification. Use `cachePolicy="none"`
to bypass framework memory/owned-disk caching for one view; matching UI/renderer
support is required, and older cached entries are not purged.

```tsx
import { Image } from '@octane-xplat/image'

export function Photo({ src }: { src: string }) {
	return <Image src={src} cachePolicy="none" alt="Photo" contentFit="contain"
		placeholder="~/thumbnail.png" style={{ width: 120, height: 80 }}
		onLoad={({ width, height, source }) => console.log(width, height, source)}
		onError={({ error }) => console.warn(error.message)} />
}
```

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
Lightbox video playback and the AppKit `@octane-xplat/video` leaf remain unavailable. macOS `Overlay` retains its
experimental inline implementation. AppKit Carousel navigation/handle source ownership
is described below; edge fades remain a gap; `ScrollableArea` supports block (the default), inline, and both-axis scrolling;
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

### Navigate AppKit carousel slides

Carousel now has an AppKit source path for its existing handle, Previous/Next
buttons and end wrapping. Steps use one measured viewport; scrollTo(index) uses
the current slide's native leading edge. Requests clamp to the content range
and preserve the vertical clip offset. The proportional variant measures the
viewport and gives each slide that width, including its gap in the track size:

```tsx
import { useRef } from 'octane'
import { Carousel, Button, Text } from '@octane-xplat/ui'
import type { CarouselHandle } from '@octane-xplat/ui'

export function Previews() {
	const carousel = useRef<CarouselHandle | null>(null)
	return <>
		<Carousel ref={carousel} label="Trip previews" variant="proportional" hasButtons hasLoop
			style={{ width: 320, height: 160 }}>
			<Text>First preview</Text>
			<Text>Second preview</Text>
			<Text>Third preview</Text>
		</Carousel>
		<Button label="Last preview" clickAction={() => carousel.current?.scrollTo(2)} />
	</>
}
```

The source adapter reads current layout and child counts for capability checks;
empty, hidden, detached or invalid geometry cannot scroll. Looping requires at
least two slides and actual overflow. Logical offsets, button direction and
leading-edge alignment follow the app's writing direction; initial alignment
waits for usable geometry. Native animation is skipped when reduced motion is
reported, with a direct scroll fallback when an animator is unavailable. Refs,
layout/scroll callbacks and window updates keep controls current and release on
teardown:

```tsx
<Button label="Next preview" clickAction={() => {
	if (carousel.current?.canScrollNext()) carousel.current.scrollNext()
}} />
```

Five geometry-policy, three object-driver and one motion-getter cases plus a
maintained fixture are authored and unrun. Source/syntax review does not qualify
native intrinsic sizing, RTL geometry/initial alignment, scroll/animation/input,
button overlay hit testing/keyboard activation, resize behavior, accessibility
or packaging. AppKit snap source ownership is described below; hasEdgeFade remains unsupported.


### Snap AppKit carousel slides after user scrolling

Set hasSnap to request the nearest measured slide edge after native user
scrolling becomes quiet. The AppKit source uses live-scroll notifications,
not ordinary bounds changes, so handle/button animations do not start a new
snap cycle. A tracked gesture waits for its end and a 140 ms quiet period;
unbracketed user notifications use the same trailing quiet period:

```tsx
import { Carousel, Text } from '@octane-xplat/ui'

export function Previews() {
	return <Carousel label="Previews" hasButtons hasSnap variant="proportional" style={{ width: 320, height: 120 }}>
		<Text>First</Text><Text>Second</Text><Text>Third</Text>
	</Carousel>
}
```

The SDK notes that legacy mice can emit user-scroll updates without start/end
pairs. Subsequent user updates replace pending work, including updates reported
after an end notification. The adapter chooses current clamped slide coordinates,
respects RTL/reduced motion and preserves vertical position. Valid programmatic
moves, snap-flag/layout/child changes and scope teardown cancel old intent.
Native user activity and accepted handle commands also retire late initial
alignment rather than resetting the user's position:

```tsx
<Button label="Last preview" clickAction={() => carousel.current?.scrollTo(2)} />
```

Six intent-policy, two geometry and two wiring cases are authored and unrun;
the earlier nine Carousel cases remain unrun too. The maintained fixture now
includes a snap toggle and still synthesizes no native scroll/input. This host
path requires the three AppKit live-scroll notifications; missing registration
leaves basic navigation available without a snap guarantee. Native notification/
momentum timing, wheel/trackpad/scroller/keyboard delivery, RTL/layout, animation,
focus/AX and packaging remain unqualified. Edge fades remain a source gap.


## Leaf packages

Features that need a NativeScript plugin ship as their own
packages so `@octane-xplat/ui` keeps zero required plugin deps:

| Package                 | Exports                                                                                        | What it is                                                                                    |
| ----------------------- | ---------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `@octane-xplat/pager`   | `Pager`                                                                                        | Full-page swipe container                                                                     |
| `@octane-xplat/camera`  | `CameraView`, `createCameraSession`                                                            | Camera preview and movie recording                                                            |
| `@octane-xplat/video`   | `Video`                                                                                        | Embedded video player                                                                         |
| `@octane-xplat/gif`     | `AnimatedImage`                                                                                | Animated images (GIF/webp)                                                                    |
| `@octane-xplat/image`   | `Image`, `initializeImageCache`, `prefetch`, `evictImage`, `clearImageCaches`, `isImageCached` | Glide/SDWebImage on iOS/Android; AppKit shares the core Image path with engine/cache gaps |
| `@octane-xplat/canvas`  | `Canvas`, `getGPU`                                                                             | Canvas/GPU surface (2D, WebGL/WebGPU)                                                         |
| `@octane-xplat/audio`   | `createAudioPlayer`                                                                            | Long-form audio playback                                                                      |
| `@octane-xplat/haptics` | `createHaptics`                                                                                | Capability-aware haptics                                                                      |
| `@octane-xplat/sounds`  | `createSoundBank`                                                                              | Short UI sound effects                                                                        |
| `@octane-xplat/effects` | `ShaderEffect` (`/ios`, `/android` only)                                                       | View-effect shaders (Metal stitch / AGSL)                                                     |
| `@octane-xplat/shaders` | `createShader`, `createSharedDevice`, `prefersReducedMotion`                                   | `shaders` engine on Canvas (WebGPU; iOS/Android experimental)                                 |
| `@octane-xplat/auth`    | `appleAuth`, `googleAuth`, `AppleSignInButton`, `GoogleSignInButton`                           | Provider sign-in (Apple / Google SDKs)                                                        |

See [search, select, and token entry](search-selection.md) for `SearchSource`, `Typeahead`, `Tokenizer`, `Token`, and `ComplexSelector` workflows and platform limits.

Shared menu parts and their state/keyboard contracts are explained in [Add actions and choices to a menu](menus.md).


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
or receives keyboard focus. AppKit now has an experimental native CSS-state
path for the same interaction; its actions keep their layout space and change
opacity immediately. Actions remain mounted and tabbable. Touch hosts and
native hosts without tracking capability keep actions visible. This subset
supports `isEnabled`, `getContainerProps()` and `getContentRevealProps()`;
Astryx's delay, inversion and force-state options are not supported. Native
hover, focus/Tab, nested-row behavior and accessibility remain unqualified.

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


### AppKit button actions and links

AppKit buttons keep their content mounted beneath the busy indicator. Normal
pending actions block presses; `isInterruptible` allows overlap and keeps busy
state until every call settles. `isDisabled` and ButtonGroup disablement always
block presses. Action failures use `onActionError`; unmount cancels pending UI
updates, while failures still reach the configured error path.

```tsx
import { Button } from '@octane-xplat/ui'

export function SaveButton({ save, report }: { save(): Promise<void>; report(error: unknown): void }) {
	return <Button label="Save changes" clickAction={save} onActionError={report} />
}
```

A button's `href` uses the existing URL sanitizer and AppKit platform opener
before its click action. `target` does not create a native browser tab/window;
use NavLink for app routes. Primitive children receive a text host, and inherited
Pressable layout/events and accessibility metadata reach the native host.

```tsx
import { Button } from '@octane-xplat/ui'

export function HelpButton() {
	return <Button href="https://example.com/help">Read help</Button>
}
```

These are source implementations with authored, unrun object-driver cases.
Native click/keyboard delivery, OS URL opening, busy sizing/appearance and
VoiceOver remain unqualified. Button tooltip presentation remains a separate
AppKit gap; this change does not implement it.


AppKit IconButton shares the Button implementation, including group disablement,
metadata, URL dispatch and busy/action ownership. Its required label remains the
accessible name while the icon stays mounted under the busy overlay. Native
input, busy sizing, VoiceOver and tooltip presentation remain unqualified.

```tsx
import { IconButton } from '@octane-xplat/ui'

export function Share({ share }: { share(): Promise<void> }) {
	return <IconButton label="Share document" icon="share" clickAction={share} testID="document.share" />
}
```


### Save a toggle-button action on AppKit

Use pressedChangeAction when a pin or favorite change needs saving. AppKit
ToggleButton now uses Button's action owner: it flips the uncontrolled choice,
calls onPressedChange, then runs the save action with a busy indicator. Normal
pending actions block duplicates; isInterruptible allows overlap and keeps busy
state until every call settles. A rejected save reports onActionError and keeps
the optimistic choice. It does not roll the choice back.

```tsx
import { ToggleButton } from '@octane-xplat/ui'

export function Pin({ save, report }: { save(pressed: boolean): Promise<void>; report(error: unknown): void }) {
	return <ToggleButton label="Pin" pressedChangeAction={save} onActionError={report} />
}
```

Controlled isPressed follows the parent. In a ToggleButtonGroup, value binds
membership instead: the group owns selection and ignores member save actions.
Button props such as loading, icon-only names, node icons, press metadata and
identifiers pass through the same AppKit Button path.

```tsx
import { ToggleButton, ToggleButtonGroup } from '@octane-xplat/ui'

export function ViewMode({ value, onChange }: { value: string | null; onChange(value: string | null): void }) {
	return <ToggleButtonGroup label="View mode" value={value} onChange={onChange}>
		<ToggleButton value="list" label="List" />
		<ToggleButton value="grid" label="Grid" />
	</ToggleButtonGroup>
}
```

AppKit exposes a pressed button through its checked-control accessibility role
and numeric off/on value. Actual VoiceOver, physical key/click delivery, busy
geometry and packaging remain unqualified. Native toolbar/group roving keys,
reserved semibold label width and tooltip presentation remain separate gaps.
The maintained [AppKit toggle fixture](https://github.com/octane-xplat/octane-xplat/blob/main/examples/probes/toggle-button.macos.tsrx)
is authored but unrun; its scripted path dispatches actions directly.
