# Package a Linux GTK4/GJS app

> Package your screens as an experimental Linux app that draws real GTK4
> widgets — no WebView.

This is an advanced setup guide for an existing Octane app.
Start with [the browser app](../start/toolchain.md#create-and-run) first.
The **GTK runtime** is the second value of `xplat.targets.linux.runtime`:
where `"webkitgtk"` shows your web UI inside a system WebView, `"gtk"`
renders the same components with native GTK4 widgets through the GJS
JavaScript engine.

The runtime is experimental and early. Install the experimental renderer package alongside the CLI. A counter and retained route panes have run in a real GJS/GTK session
with programmatic event dispatch. Packaging remains build evidence; OS input,
visual parity and the complete shared UI are not qualified by those checks. For the qualified webview
target, see [Package a Linux WebKitGTK app](linux-package.md).

## Install the renderer

Run these commands in your app directory after the first stable automated GTK release
has published. Keep Xplat packages on the same release; the one-time `0.0.1`
registry stub has no supported API.

```sh
bun add @octane-xplat/linux-gtk @octane-xplat/ui octane
bun add -D @octane-xplat/cli @octanejs/vite-plugin vite
```

The npm package includes JavaScript and declarations. GJS and GTK4 come from
your Linux distribution. The default `Gtk.Box` layout needs no native build;
it approximates flex layout and does not implement grid, reverse directions,
or full alignment. For optional Mason layout, see the
[renderer setup](../../packages/linux-gtk-renderer/README.md#optional-native-layout).

## Configure the app

Add the Linux target to `package.json` with the `gtk` runtime:

```json
{
	"version": "1.0.0",
	"scripts": { "build": "xplat build --targets linux" },
	"xplat": {
		"targets": {
			"linux": {
				"runtime": "gtk",
				"package": {
					"applicationId": "com.example.MyApp",
					"productName": "My App",
					"executableName": "my-app",
					"viteConfig": "vite.gtk.config.ts"
				}
			}
		}
	}
}
```

`applicationId`, `productName`, `executableName`, and `version` follow the
same rules as the WebKitGTK target; see [its configuration
reference](linux-package.md#configure-the-app). `viteConfig` defaults to
`vite.gtk.config.ts`. `host.scheme` is not needed — the GTK host has no
incoming-link handling yet.

Create `vite.gtk.config.ts` using the CLI's GTK preset:

```ts
import { xplatLinuxGtk } from '@octane-xplat/cli/linux-gtk/vite'

export default async (env: { mode: string }) => xplatLinuxGtk(env)
```

The preset registers the `gtk` renderer, resolves `.gtk` files before
shared ones, keeps `gi://` imports external (the system GTK libraries
provide them at load time), and emits one ESM file, because `gjs -m`
executes a single file — code splitting would produce an unloadable
import. GTK screens use the shared JSX contract; put platform-specific
variants in `.gtk.tsrx`/`.gtk.tsx` files.

`@octane-xplat/ui` resolves a curated `gtk` export condition. It includes
`Text`, `Pressable`, the `View`/`Stack` family, `Grid`/`GridSpan`, `Center`,
`Section`, `Layout` regions, `Absolute`, `Spacer`, `Badge`, `Divider`,
`ColorSwatch`, the shared size context, `AspectRatio`, `useMeasure`, `setTranslate`, `useAnimation`, `ScrollableArea`, `Spinner`, `useScrollableArea`, `Icon`, icon registries, `Tooltip`, `TextInput`, `TextArea`, `SearchInput`, `Field`, `FormLayout`, `InputGroup`, `InputGroupText`, `FieldGroup`, `useFieldControl`, the selection indicators, indicator registries, CheckboxInput, Switch, RadioList, RadioListItem, NumberInput, CheckboxList, CheckboxListItem, SegmentedControl, SegmentedControlItem, PinInput, Slider, InputRating, SelectorOption, Popover, Selector and MultiSelector. Pure-utility exports — pixel/percent/proportional,
table helpers (generateColumns, resolveColumnWidths, defaultCellRenderer,
capitalize, paginateData, sortTableData, toSearchFilters), ThumbHash
encoders (rgbaToThumbHash/rgbaToThumbHashUri), the theme registry
(defineTheme/registerTheme/resolveThemeToken(s)/defaultThemeTokens/
generateThemeCss and friends), mergeProps/refList/mergedRef/useObjectRef,
isNative, createStaticSource, calendar core helpers (isSameDay/
isDateInRange/getWeekNumber), i18n (InternationalizationProvider,
useLocale/useDirection/useTranslator, getLocaleDirection, frFR), link
context (LinkProvider, useLinkComponent, LinkContext) and
power-search config (createPowerSearchConfig, resolveOperatorLabel),
buttons and display primitives (Button, IconButton, ToggleButton(Group),
ButtonGroup, ClickableCard, Card, Link, styled, Kbd, Heading, Code,
CodeBlock, ProgressBar, StatusDot, Citation, Outline, Blockquote,
Timestamp, Timer, Skeleton, VisuallyHidden, Chip, Alert, Banner,
EmptyState, Meter, ProgressGroup, MetadataList(+Item), Timeline, Item,
List, ListItem, Toolbar, Step, Stepper, Pagination, FieldLabel,
FieldStatus, images (Image, Thumbnail, thumbHashUri) and the Avatar family
(Avatar, AvatarStatusDot, AvatarGroup, AvatarGroupOverflow, User), menus
(DropdownMenu, ContextMenu, MoreMenu, DropdownMenuContext,
useDropdownMenuContext), anchored layers (Breadcrumbs, BreadcrumbItem,
HoverCard, useHoverCard, usePopover, useLayer), and in-window overlays
(Overlay, Dialog, DialogHeader, AlertDialog, useImperativeDialog,
useImperativeAlertDialog, FocusScope, getFocusScopeCapabilities,
LayerProvider, LayerContext, useLayerContext), toasts
(Toast, ToastViewport, showToast, useToast), the Lightbox media viewer
(Lightbox, useLightbox), the CommandPalette command surface, the
edge-docked Drawer, and bottom sheets (BottomSheet, BottomSheetSwitcher,
openBottomSheet, closeBottomSheet, useImperativeBottomSheet) —
behave identically to native; slot-bearing hooks (useCalendarDays,
useTableSortableState, usePowerSearchConfig, styled) and thumbHashUri
are not yet exposed.
For example, place a label and
status badge in a horizontal row:

```tsx
import { Stack, Text, Badge } from '@octane-xplat/ui'

export function BuildStatus() {
  return (
    <Stack direction="horizontal" gap={2}>
      <Text>Linux build</Text>
      <Badge label="Ready" />
    </Stack>
  )
}
```

Use `Icon` for the framework's built-in glyphs, or pass a registry created with
`createIconRegistry` for your own set. Give meaningful standalone icons an
`accessibilityLabel`; icons without one are decorative.

```tsx
import { Icon, createIconRegistry } from '@octane-xplat/ui'

const icons = createIconRegistry()
icons.registerIcon('favorite', { svg: 'M12 2 15 8 22 9 17 14 18 22 12 18 6 22 7 14 2 9 9 8z' })
export function FavoriteIcon() {
  return <Icon name="favorite" registry={icons} size={24} accessibilityLabel="Favorite" />
}
```

Custom icon files can use a path beside the emitted bundle (`~/brand.svg`),
a registered GResource (`res://icons/brand.svg`), or an HTTP(S) URL.
Linux hosts need the GdkPixbuf SVG loader for SVG icons and Soup 3 introspection
for HTTP sources; on Ubuntu these are `librsvg2-common` and `gir1.2-soup-3.0`.

```tsx
icons.registerIcon('brand', { src: '~/brand.svg' })
icons.registerIcon('remote-brand', { src: 'https://example.com/brand.svg' })
```

`TextInput` labels focus their associated editor when clicked. Use `id` for the
control's identity; `testID` names are for automation and do not replace it.

```tsx
/** @jsxImportSource @octane-xplat/jsx */
import { TextInput } from '@octane-xplat/ui'
export function Account() {
	return <TextInput id="account" testID="account-editor" label="Account" />
}
```

For a low-level textfield, GTK refs support focus and blur. Setting editable
to false keeps the text selectable; isEnabled=false disables interaction.

```tsx
import { useRef } from 'octane'
import type { HostElement } from '@octane-xplat/jsx/intrinsics'
import { Pressable, Text, View } from '@octane-xplat/ui'

export function FocusableField() {
	const field = useRef<HostElement | null>(null)
	return (
		<View>
			<textfield ref={field} text="Copy this text" editable={false} />
			<Pressable
				onPress={() => {
					field.current?.focus()
				}}
			>
				<Text>Focus the field</Text>
			</Pressable>
			<Pressable
				onPress={() => {
					field.current?.blur()
				}}
			>
				<Text>Release focus</Text>
			</Pressable>
		</View>
	)
}
```

## Lay out boxes with margins

A box's width includes its padding and border. Margins add space outside that
width. This box is 160px wide, with 8px of extra space on each side; the text
starts after the border and padding.

```tsx
import { View, Text } from '@octane-xplat/ui'

export function InsetMessage() {
  return (
    <View style={{ width: 160, padding: 12, borderWidth: 2, margin: 8 }}>
      <Text>Ready to travel</Text>
    </View>
  )
}
```

Set direction on a containing View to reverse its descendants' layout.
Removing the value restores the application's default direction.

```tsx
import { useState } from 'octane'
import { View, Text, Pressable } from '@octane-xplat/ui'

export function DirectionExample() {
  const [rtl, setRtl] = useState(false)
  return (
    <View style={{ direction: rtl ? 'rtl' : undefined }}>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Text>First</Text>
        <Text>Second</Text>
      </View>
      <Pressable onPress={() => setRtl(value => !value)}>
        <Text>Change direction</Text>
      </Pressable>
    </View>
  )
}
```

## Present option content

SelectorOption arranges a decorative icon beside a label and description.
It presents content; the containing control owns selection and activation.
Its isDisabled prop supplies the same modifier class as web for custom styling.

```tsx
import { SelectorOption, Text } from '@octane-xplat/ui'

export function RoomOption(props: { disabled?: boolean }) {
  return (
    <SelectorOption
      label="Small"
      description="Fits a day bag"
      icon={<Text>+</Text>}
      isDisabled={props.disabled}
      style={{ width: 240, margin: 8 }}
    />
  )
}
```

Selector and MultiSelector expose the shared finite-list picker on GTK —
see [choose one or many options](#choose-one-or-many-options).

## Show and hide retained content

Set a View's display to 'none' to hide its subtree and remove its layout
space. Returning to 'flex' shows the same native controls with their local
text retained. A hidden editor releases keyboard focus; showing it does not
restore focus automatically.

```tsx
import { View, Text } from '@octane-xplat/ui'

export function Details({ isOpen }: { isOpen: boolean }) {
  return (
    <View style={{ display: isOpen ? 'flex' : 'none' }}>
      <Text>Build details</Text>
    </View>
  )
}
```

## Toggle fields

Use CheckboxInput for a choice that can also be partially selected, and Switch
for an on/off setting. With defaultValue, each control keeps its own state.
Click the row or its inline label to change it, or use Tab and Space.

```tsx
import '@octane-xplat/ui/theme/tokens.css'
import '@octane-xplat/ui/theme/chrome.css'
import { CheckboxInput, Switch, FormLayout } from '@octane-xplat/ui'

export function Preferences() {
  return (
    <FormLayout>
      <CheckboxInput label="Keep receipts" defaultValue="indeterminate" width={280} />
      <Switch label="Notifications" defaultValue width={280} labelSpacing="spread" />
    </FormLayout>
  )
}
```

Use value and onChange when your component owns the setting. Put asynchronous
work in changeAction: label and control clicks share the action, and a
rejection reports the previous value through onChange. The native control
exposes its busy state while the action runs.

```tsx
import { useState } from 'octane'
import { Switch } from '@octane-xplat/ui'

export function NotificationSetting(props: { save: (enabled: boolean) => Promise<void> }) {
  const [enabled, setEnabled] = useState(false)
  return (
    <Switch label="Notifications" value={enabled}
      onChange={setEnabled} changeAction={props.save} />
  )
}
```

## Single-choice fields

Use RadioList when exactly one option can be selected. Supply options for a
simple list, and use defaultValue to let the control keep its own selection.
Click a label or use Tab, arrow keys and Space; disabled options are skipped.

```tsx
import { RadioList } from '@octane-xplat/ui'

export function Delivery() {
  return (
    <RadioList label="Delivery" width={280} defaultValue="standard"
      options={[
        { value: 'standard', label: 'Standard', description: 'Arrives this week' },
        { value: 'express', label: 'Express' },
      ]} />
  )
}
```

Use RadioListItem children when each option needs its own markup. A surrounding
Field can own the label and shared field state. Set isGroupLabel because the
label names a group; each option keeps its own name. Outside RadioList, the
child part is a presentation row.

```tsx
import { Field, RadioList, RadioListItem, Text } from '@octane-xplat/ui'

export function Payment() {
  return (
    <Field label="Payment" isGroupLabel width={280}>
      <RadioList defaultValue="card">
        <RadioListItem value="card" label="Card" endContent={<Text>No fee</Text>} />
        <RadioListItem value="cash" label="Cash" isDisabled />
      </RadioList>
    </Field>
  )
}
```

## Segmented choices

Use SegmentedControl for one compact choice, such as Grid or List. defaultValue
lets the control keep its selection. layout="fill" shares the available width
equally; omit layout for a track that hugs its content.

```tsx
import { SegmentedControl } from '@octane-xplat/ui'

export function ViewChoice() {
  return <SegmentedControl label="View" width={280} layout="fill"
    defaultValue="grid" options={[
      { value: 'grid', label: 'Grid' },
      { value: 'list', label: 'List' },
    ]} />
}
```

Use SegmentedControlItem children for icons or an icon-only segment. Keep
label set when isLabelHidden hides its visible text. Pair value with
onValueChange to own the selection; Tab, arrow keys, Space and clicks use the
same single-choice group.

```tsx
import { useState } from 'octane'
import { SegmentedControl, SegmentedControlItem, Text, View } from '@octane-xplat/ui'

export function ViewPicker() {
  const [mode, setMode] = useState('grid')
  return (
    <View>
      <SegmentedControl label="View" width={280} layout="fill"
        value={mode} onValueChange={setMode}>
        <SegmentedControlItem value="grid" label="Grid" isLabelHidden icon={<Text>G</Text>} />
        <SegmentedControlItem value="list" label="List" icon={<Text>L</Text>} />
        <SegmentedControlItem value="print" label="Print" isDisabled />
      </SegmentedControl>
      <Text>Selected: {mode}</Text>
    </View>
  )
}
```

## Multiple-choice fields

Use CheckboxList when several options can be checked. Its value is an array
of option values; defaultValue seeds a local selection. Click a label or use
Tab and Space. Set density="compact" for smaller indicators and hasDividers
for lines between rows.

```tsx
import { CheckboxList } from '@octane-xplat/ui'

export function Features() {
  return <CheckboxList label="Features" width={280} density="compact" hasDividers
    defaultValue={['calendar']} options={[
      { value: 'calendar', label: 'Calendar', description: 'Plan upcoming work' },
      { value: 'backup', label: 'Backup', isDisabled: true },
    ]} />
}
```

CheckboxListItem children read their checked state from the list. Outside a
list, use isChecked and onCheck to own the item state; indeterminate shows a
partially selected checkbox. This lets one separate row select the whole set.

```tsx
import { useState } from 'octane'
import { CheckboxList, CheckboxListItem, Text, View } from '@octane-xplat/ui'

export function FeaturePicker() {
  const [selected, setSelected] = useState<string[]>([])
  const all = ['calendar', 'backup']
  const checked = selected.length === 0 ? false
    : selected.length === all.length ? true : 'indeterminate'
  return (
    <View>
      <CheckboxListItem label="Select all" isChecked={checked}
        onCheck={on => setSelected(on ? all : [])} />
      <CheckboxList label="Features" width={280} value={selected} onValueChange={setSelected}>
        <CheckboxListItem value="calendar" label="Calendar" endContent={<Text>Included</Text>} />
        <CheckboxListItem value="backup" label="Backup" />
      </CheckboxList>
    </View>
  )
}
```

## Numeric fields

Use NumberInput for a number with optional increment and decrement buttons.
Set min, max and step to bound changes, and units to show a suffix. A formatted
value appears after leaving the editor; editing uses the raw number.

```tsx
import { NumberInput } from '@octane-xplat/ui'

export function Weight() {
  return <NumberInput label="Weight" width={280} defaultValue={2.5}
    min={0} max={10} step={0.5} units="kg" hasClear
    formatValue={value => value.toFixed(2)} />
}
```

An empty number is null. Omit value and use defaultValue for local state, or
pair value with onValueChange to keep state in the parent. The clear action
reports null before calling onClear; hasNumberSteppers={false} hides the buttons.

```tsx
import { useState } from 'octane'
import { Field, NumberInput } from '@octane-xplat/ui'

export function Quantity() {
  const [quantity, setQuantity] = useState<number | null>(null)
  return (
    <Field label="Quantity" width={280}>
      <NumberInput value={quantity} onValueChange={setQuantity}
        hasNumberSteppers={false} hasClear onClear={() => console.log('Cleared')} />
    </Field>
  )
}
```

## Ratings

Use InputRating for one score from 1 to max. It starts unrated when no value
is supplied; defaultValue seeds a local score once. The filled glyphs show the
score, while only the chosen score is marked checked. Tab enters the group,
arrow keys move between scores, and Space selects the focused score.

```tsx
import { InputRating } from '@octane-xplat/ui'

export function TripRating() {
  return <InputRating label="Trip rating" width={280} max={5} defaultValue={3} />
}
```

Use value with onValueChange for a controlled score. Keeping value unchanged
rejects a selection. icon accepts one text character or a registered icon name;
registered names take priority over text fallback.

```tsx
import { useState } from 'octane'
import { InputRating } from '@octane-xplat/ui'

export function ControlledRating() {
  const [score, setScore] = useState(0)
  return <InputRating label="Trip rating" width={280} max={5} icon="☆"
    value={score} onValueChange={setScore} />
}
```

## Sliders

Use Slider to adjust a number by dragging or with the arrow keys. defaultValue
seeds a local value once; step sets the increment, while Home and End reach
the bounds. valueDisplay="text" shows the current number.

```tsx
import { Slider } from '@octane-xplat/ui'

export function Volume() {
  return <Slider label="Volume" width={280} min={0} max={100}
    defaultValue={25} step={5} valueDisplay="text" />
}
```

Use a pair of numbers for a range. Dragging adjusts the nearest thumb; keyboard
input adjusts the upper endpoint. marks label stops, formatValue formats the
readout, and valueDisplay="tooltip" shows it at the upper thumb on hover or
focus with GTK 4.14 or newer. A controlled parent can reject changes by keeping value unchanged.

```tsx
import { useState } from 'octane'
import { Slider } from '@octane-xplat/ui'

export function ComfortRange() {
  const [range, setRange] = useState<[number, number]>([20, 80])
  return <Slider label="Comfort" width={280} min={0} max={100} step={5}
    value={range}
    onValueChange={(next) => { if (Array.isArray(next)) setRange(next) }}
    marks={[{ value: 0, label: 'Low' }, { value: 100, label: 'High' }]}
    valueDisplay="tooltip" formatValue={(value) => value + '%'} />
}
```

## PIN entry

Use PinInput for a short code. It starts empty when value is omitted, advances
to the next cell as you enter characters, and calls onComplete when all cells
are filled. Clearing a cell also clears the cells after it. secure masks the
characters; the numeric keyboard hint does not validate them.

```tsx
import { PinInput } from '@octane-xplat/ui'

export function VerificationCode() {
  return <PinInput label="Code" width={280} length={4} secure
    onComplete={(code) => console.log('Code entered', code.length)} />
}
```

For controlled input, keep value in state and accept changes through
onValueChange. Keeping value unchanged rejects an edit. The group shares one
field label, while each editor has a numbered accessible name.

```tsx
import { useState } from 'octane'
import { PinInput } from '@octane-xplat/ui'

export function ControlledCode() {
  const [code, setCode] = useState('')
  return <PinInput label="Code" width={280} length={4} value={code}
    onValueChange={(next) => { if (/^\d*$/.test(next)) setCode(next) }} />
}
```

## Text entry

TextInput is available from the GTK UI root. Use value with onChange to keep
the text in your component's state, or defaultValue for an input that manages
its own text. Pressing Return calls onSubmit; hasClear adds a keyboard-accessible
clear action.

```tsx
/** @jsxImportSource @octane-xplat/jsx */
import { useState } from 'octane'
import { TextInput, Text, View } from '@octane-xplat/ui'

export function AccountEntry() {
  const [value, setValue] = useState('')
  const [submitted, setSubmitted] = useState(false)
  return (
    <View>
      <TextInput
        label="Account"
        placeholder="Work account"
        value={value}
        onChange={setValue}
        hasClear
        onSubmit={() => setSubmitted(true)}
      />
      <Text>{submitted ? 'Return received' : ''}</Text>
    </View>
  )
}
```

keyboardType is a hint for the input method, not validation. A controlled
parent can reject an edit by keeping its value unchanged. This example accepts
digits and shows a validation tooltip while empty. Status messages, labels
and leading content can change without replacing the editor.

```tsx
/** @jsxImportSource @octane-xplat/jsx */
import { useState } from 'octane'
import { TextInput } from '@octane-xplat/ui'

export function ReferenceEntry() {
  const [value, setValue] = useState('')
  return (
    <TextInput
      label="Reference"
      value={value}
      onChange={(next) => { if (/^\d*$/.test(next)) setValue(next) }}
      keyboardType="number"
      isRequired
      status={value ? undefined : { type: 'error', message: 'Enter digits' }}
      statusVariant="tooltip"
    />
  )
}
```

GTK Entry has no per-field Return-key caption selector in the inspected API.
returnKeyType therefore keeps Return submission working and emits one diagnostic
that its caption hint is unavailable. It does not move focus for next.
IME, assistive-technology clients, Wayland and visual parity remain
outside this qualification.

```tsx
/** @jsxImportSource @octane-xplat/jsx */
import { TextInput } from '@octane-xplat/ui'

export function SearchEntry(props: { search: () => void }) {
  return <TextInput placeholder="Search" returnKeyType="search" onSubmit={props.search} />
}
```

Use `AspectRatio` to derive a container's height from its allocated width.
`useMeasure` reports a widget's position and size relative to the app content
surface, including movement when an ancestor scrolls. Set `observe: false`
when you only need a snapshot. Same-root portal content in native GTK popups
keeps these app-relative coordinates, including nested popup surfaces. An
unrelated top-level window has no bounds in this coordinate space.

```tsx
import { AspectRatio, Text, View, useMeasure } from '@octane-xplat/ui'

export function Preview() {
	const { ref, bounds } = useMeasure()
	return (
		<View ref={ref}>
			<AspectRatio ratio={16 / 9}>
				<Text>Preview</Text>
			</AspectRatio>
			<Text>{bounds ? `Width: ${bounds.width}` : 'Measuring…'}</Text>
		</View>
	)
}
```

Use `useAnimation` for numeric transforms, opacity, or layout dimensions.
Attach its `ref` to a view, then call `to` or `spring` from an event handler.
Each run returns a result; replacement, stopping, ref detachment and unmount
cancel pending playback. GTK rejects unsupported properties and nonfinite
values rather than storing an inert widget property.

```tsx
import { Pressable, Text, View, useAnimation } from '@octane-xplat/ui'

export function SlidePreview() {
	const offset = useAnimation(0, 'translateX')
	return (
		<View>
			<View ref={offset.ref} style={{ width: 40, height: 40, backgroundColor: 'royalblue' }} />
			<Pressable
				onPress={() => {
					void offset.to(100, { duration: 300 })
				}}
			>
				<Text>Slide</Text>
			</Pressable>
		</View>
	)
}
```

Use `ScrollableArea` for a viewport with a portable scroll handle and optional
pull-to-refresh on its block (vertical) axis. Give it a height so taller content
can scroll. Your app owns the `refreshing` flag while work runs; `Spinner`
shows that state and disappears when `busy` is false. The handle can animate
back to the start.

```tsx
import { useRef } from 'octane'
import { Pressable, ScrollableArea, Spinner, Text, View } from '@octane-xplat/ui'
import type { ScrollableAreaHandle } from '@octane-xplat/ui'

export function Feed(props: { refreshing: boolean; refresh: () => void }) {
	const area = useRef<ScrollableAreaHandle | null>(null)
	return (
		<View>
			<ScrollableArea
				ref={area}
				width={240}
				height={160}
				refreshing={props.refreshing}
				onRefresh={props.refresh}
			>
				<View style={{ height: 600 }}>
					<Text>Feed content</Text>
				</View>
			</ScrollableArea>
			<Pressable onPress={() => area.current?.scrollToOffset({ block: 0 }, { animated: true })}>
				<Text>Back to top</Text>
			</Pressable>
			<Spinner busy={props.refreshing} size="sm" label="Refreshing" />
		</View>
	)
}
```

Use `useScrollableArea` to observe scroll edges in a custom GTK viewport.
A `scrollview` supplies scrolling; its one `masonview` child holds the content.
Attach the hook's viewport and content props as shown below. Its state updates
when content resizes as well as when the user scrolls. The hook does not make
an ordinary `View` scrollable. `HostElement` describes the GTK widget type so
the attached refs typecheck.

```tsx
import { Text, useScrollableArea } from '@octane-xplat/ui'
import type { HostElement } from '@octane-xplat/jsx/intrinsics'

export function FeedViewport() {
	const area = useScrollableArea<HostElement>({ axis: 'block' })
	return (
		<scrollview
			{...area.getViewportProps()}
			orientation="vertical"
			style={{ width: 200, height: 100 }}
		>
			<masonview {...area.getContentProps()} style={{ height: 600 }}>
				<Text>{area.state.block.atEnd ? 'End of feed' : 'Scroll for more'}</Text>
			</masonview>
		</scrollview>
	)
}
```

Layout needs the repository-only [XplatMason binding](https://github.com/octane-xplat/octane-xplat/tree/main/packages/linux-gtk-renderer/native/xplatmason);
the Gtk.Box fallback cannot provide Grid or full flex layout. Maintained GJS checks cover
mounting, direction/spacing updates, size inheritance, gesture callbacks and
cleanup. This subset does not qualify the complete UI, accessibility or visual
parity. Other root UI imports remain unavailable until their GTK implementation
is qualified. The primitive fixture has passed 42 assertions with the real
Mason engine on Ubuntu 24.04 / GTK 4.14.5; a separate X11 pointer check exercises
real clicks and drags. These checks do not qualify Wayland, assistive technology
or visual parity.

The binding consumes a prebuilt MasonCore archive. The published Mason fork
currently has no desktop archive producer, so a fresh packaged consumer setup
is still unqualified. The repository's [build record](https://github.com/octane-xplat/octane-xplat/blob/main/.agents/docs/notes/linux-gtk-ui-parity.md#mason-test-artifact-prerequisite)
describes the pinned, locally prepared artifact used by these tests.

The entry point mounts the app through the renderer's host helper. Import
your stylesheets from the same module — the preset compiles and injects
them into the bundle:

```ts
// src/main.ts
import '@octane-xplat/ui/theme/tokens.css'
import '@octane-xplat/ui/theme/chrome.css'
import './app.css'
import { runGtkApp } from '@octane-xplat/linux-gtk/host'
import { App } from './App.gtk'

export function main(): number {
	return runGtkApp({ applicationId: 'com.example.MyApp', title: 'My App' }, ({ root }) => {
		root.render(App, {})
	})
}

main()
```

Class, id, and element selectors work through the same NativeScript engine
the AppKit renderer uses. State selectors such as `:hover`, `:active`, and
`:focus` follow the widget's GTK state, media queries re-check when the
window resizes, and `@keyframes` animations play. The renderer's
[Apply stylesheets](../../packages/linux-gtk-renderer/README.md#apply-stylesheets)
section lists the supported properties and limits. GTK's theme still
styles native widget chrome underneath your CSS.

```css
/* src/app.css */
.save:hover {
  background-color: #2563eb;
}

@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

.toast {
	animation: fade-in 200ms ease-out forwards;
}
```

\n

## Search fields

SearchInput includes a registered search icon and a clear action. Labels,
descriptions, validation and width use the shared field contract. Return
submits the search; clearing reports onChange('') before onClear and returns
focus to the editor.

```tsx
/** @jsxImportSource @octane-xplat/jsx */
import { useState } from 'octane'
import { SearchInput } from '@octane-xplat/ui'

export function FindFiles(props: { search: (query: string) => void }) {
  const [query, setQuery] = useState('')
  return (
    <SearchInput label="Find files" description="All folders" width="100%"
      placeholder="Search files" value={query} onChange={setQuery}
      onSubmit={() => props.search(query)} onClear={() => console.log('Cleared')} />
  )
}
```

The maintained Linux check uses actual keyboard and pointer input. OS keyboard
captions, composition, assistive-technology clients and visual parity remain
unqualified.

## Multiline fields

Import TextArea from the GTK root for a labeled multiline field. It supports
controlled or local text, row sizing, capped growth, placeholders, length limits
and leading icons. Registered icon names use the native icon registry.

```tsx
/** @jsxImportSource @octane-xplat/jsx */
import { useState } from 'octane'
import { TextArea } from '@octane-xplat/ui'

export function Notes() {
  const [notes, setNotes] = useState('')
  return (
    <TextArea label="Notes" value={notes} onChange={setNotes}
      placeholder="Write a note" rows={3} autoGrow maxRows={6}
      maxLength={200} startIcon="xplat-check" />
  )
}
```

GTK has no built-in secure multiline editor. TextArea rejects secure=true;
use TextInput for password entry. IME composition, OS keyboards, screen-reader
clients, full bidirectional editing and pixel parity remain unqualified.

```tsx
/** @jsxImportSource @octane-xplat/jsx */
import { TextInput } from '@octane-xplat/ui'
export function Password() {
  return <TextInput label="Password" secure />
}
```

## Low-level multiline editor

The GTK textview intrinsic supports multiline text, Unicode selection,
focus and change events. Replacing selected text reports one completed
change. An empty editor shows hint text, styled with
placeholderColor; the hint is separate from its accessible label.
Long text scrolls within its assigned height;
read-only editors remain scrollable. Return inserts a newline;
done or send with an onReturnPress handler submits instead. Shift+Return
keeps a newline. Tab moves focus to the next control.

```tsx
/** @jsxImportSource @octane-xplat/jsx */
export function NotesEditor(props: { readOnly?: boolean }) {
  return (
    <textview
      text={'A line\n'.repeat(20)}
      editable={!props.readOnly}
      hint="Write a note"
      maxLength={200}
      accessibilityLabel="Notes"
      returnKeyType="done"
      onTextChange={(event) => console.log(event.value)}
      onReturnPress={() => console.log('Submitted')}
      style={{ width: 260, height: 120, placeholderColor: '#777' }}
    />
  )
}
```

maxLength caps new input in UTF-16 units, matching JavaScript String.length.
A paste keeps the prefix that fits. For example, 😀 consumes two units and
is kept whole. App-authored text can exceed the cap, and clearing maxLength removes
it.

```tsx
/** @jsxImportSource @octane-xplat/jsx */
export function ShortNote() {
	return (
		<textview
			text=""
			hint="Short note"
			maxLength={200}
			onTextChange={(event) => console.log(event.value)}
		/>
	)
}
```

The maintained TextArea fixture imports the component through the GTK root.
Source-harness row, growth and X11 keyboard/wheel checks are recorded in the
[renderer note](../../.agents/docs/notes/linux-gtk-renderer.md#textarea-row-sizing-on-gtk). GTK TextView has no per-field Return-caption property;
the renderer reports that limit once when returnKeyType is supplied.

## Add retained route panes

Use an explicit programmatic catalog and pane host for native GTK routing.
The pane keeps each screen's widgets and local state while it is in history.
This example opens an item without creating a NativeScript Frame or changing a
browser URL. Put it in `src/App.gtk.tsx`; the host entry shown above mounts `App`.

```tsx
/** @jsxImportSource @octane-xplat/jsx */
import { useState } from 'octane'
import {
	createPaneRouterHost,
	createRouter,
	defineRoute,
	defineRoutes,
	RouterPane,
	type RouteScreenProps,
} from '@octane-xplat/ui/routing'

const detail = defineRoute({
	path: '/probe/:id',
	transition: 'none',
	loader: ({ params }) => ({ id: params.id }),
})

function Detail(props: RouteScreenProps<typeof detail>) {
	const [count, setCount] = useState(0)

	return (
		<masonview style={{ display: 'flex', flexDirection: 'column' }}>
			<label text={`${props.data.id}:${count}`} />
			<button text={`Increment ${props.data.id}`} onTap={() => setCount(count + 1)} />
		</masonview>
	)
}

const host = createPaneRouterHost()
const navigation = createRouter({ host: host.host, catalog: defineRoutes([detail.screen(Detail)]) })
host.attach(navigation)

export function App() {
	return (
		<masonview style={{ display: 'flex', flexDirection: 'column' }}>
			<button
				text="Open coat"
				onTap={() => {
					void navigation.push({ to: '/probe/:id', params: { id: 'coat' } })
				}}
			/>
			<RouterPane host={host} router={navigation} />
		</masonview>
	)
}

export { navigation }
```

This experimental subset has explicit limits: pane modals are rejected,
transitions report skipped, and OS Back and window-close integration belong to
the enclosing host. Generated GTK startup, incoming links, physical input and
native Mason geometry need separate qualification. The maintained check passed
13 assertions in GJS 1.82.3 / GTK 4.18.6 using Gtk.Box emulation; it does not
establish the optional Mason typelib's layout behavior. See
[native GTK routing checks](../../.agents/docs/navigation-checks.md#native-gtk-retained-panes).

## Check the runtime

On Ubuntu 24.04, install GJS and the GTK4 introspection data:

```sh
sudo apt install gjs gir1.2-gtk-4.0
bun run xplat doctor
```

`xplat doctor` validates the target configuration and, on a Linux host,
checks that GJS can load GTK 4.10 or later. A successful build on macOS
does not prove the Linux runtime works — treat every artifact below as
unverified until it runs on a real Linux desktop.

## Develop and build

`xplat dev linux` runs the app's own `dev` script, so point it at whatever
loop you maintain — for example, a Vite build followed by `gjs -m`:

```json
{ "scripts": { "dev": "vite build -c vite.gtk.config.ts && gjs -m dist/app.js" } }
```

Build the distributable app with the CLI:

```sh
bun run xplat build --targets linux
```

For the example above, output is:

```text
dist/linux/my-app/                 relocatable app directory
  app.js                          single-file ESM bundle (gi:// imports stay external)
  app.json                        app identity
  my-app                          executable launcher (gjs -m)
  README.txt                      runtime requirements
dist/linux/my-app-1.0.0.tar.gz     distribution archive
```

GJS produces no compiled binary, so the bundle plus launcher is the honest
minimum: transfer the archive to a Linux machine, extract it, and run the
launcher:

```sh
tar -xzf my-app-1.0.0.tar.gz
./my-app/my-app
```

The launcher checks that `gjs` is installed and execs the bundled app, so
it works from any directory without a source checkout, Node, or pnpm.

## What this target does not have yet

- No desktop entry, per-user installer, or URI scheme handling — those are
  features of the WebKitGTK host, and they land with runtime qualification.
- No device services (clipboard, secure storage, notifications, files) —
  the GTK host mounts widgets only.
- `FocusScope` reports all capabilities `false` via
  `getFocusScopeCapabilities()` — per-scope containment is not qualified yet;
  the overlay host's modal suppression carries the modal-input contract.
- `presentation="bottom-sheet"` opens a real `BottomSheet` in a modal
  overlay layer; `presentation="adaptive"` picks the sheet on touch seats
  and the anchored popover on fine-pointer desktops. The shared
  toast/drawer/lightbox/palette contracts are covered, but the toast edge
  stacks are corner overlay layers rather than per-edge windows, and
  `Lightbox` video falls back to alt text (the video widget lives in
  `@octane-xplat/video`).
- Broad pointer/keyboard coverage, Wayland, assistive technology, visual parity
  and the complete shared UI remain unqualified. Primitive checks establish
  only the named Mason allocations and X11 pointer behavior; counter and
  retained-pane checks establish their named widget/event/history behaviors. See the [renderer status
  note](../../.agents/docs/notes/linux-gtk-renderer.md) for the evidence boundary.

## Portals for GTK host integrations

A portal renders into another layout container while keeping its original Octane
context and component state. Pass a live Gtk.Box, Gtk.Fixed or Gtk.Grid, the
root's layout host, or a layout ref owned by the same root. The caller owns the
target's lifetime; keep it alive until its portal content has been removed.

```tsx
import { Text } from '@octane-xplat/ui'
import { createPortal, type UniversalRenderable } from '@octane-xplat/linux-gtk'

export function PortalContent(props: { target: unknown }) {
	return createPortal(
		(<Text>Content in the target container</Text>) as UniversalRenderable,
		props.target,
	)
}
```

Portals supply host placement; Tooltip below adds its intent and dismissal
behavior. Other UI overlays remain outside the qualified GTK root. External targets preserve caller-owned children.
CSS follows the target's physical layout ancestry; Octane context follows the
component owner. Single-child widgets such as Gtk.Label, Gtk.Button and
Gtk.ScrolledWindow are rejected as targets, as are serialized transport targets.

## Tooltips

On GTK 4.14 or newer, Tooltip shows a native popover after the pointer rests on
its trigger. Focusing a focusable child opens it immediately; leaving, blurring,
pressing Escape or scrolling an ancestor dismisses it. Keep tooltip content
noninteractive. The example uses a native button, which already accepts keyboard
focus.

```tsx
/** @jsxImportSource @octane-xplat/jsx */
import { Tooltip } from '@octane-xplat/ui'

export function DeliveryHelp() {
  return (
    <Tooltip
      trigger={<button text="Delivery details" />}
      content="Orders ship on the next business day."
      placement="right"
      openDelay={300}
    />
  )
}
```

Tooltip content keeps the surrounding Octane context and updates while open.
Use contentClassName/contentStyle for the panel, className/style for its trigger
wrapper, and disabled to cancel pending or visible content. GTK receives a
TOOLTIP role and a DESCRIBED_BY relation; this is not a screen-reader certification.

```tsx
/** @jsxImportSource @octane-xplat/jsx */
import { Tooltip } from '@octane-xplat/ui'

export function SaveHelp(props: { saving: boolean }) {
  return (
    <Tooltip
      trigger={<button text="Save" />}
      content="Saves your current changes."
      disabled={props.saving}
      contentStyle={{ padding: 12 }}
      closeDelay={100}
    />
  )
}
```

## Popovers

On GTK 4.14 or newer, Popover shows interactive content in a native popup
anchored to an element you own. Escape or a click outside asks for dismissal:
a controlled popover stays open until `open` becomes false, while
`defaultOpen` closes itself. Turn each path off with dismissOnEscape or
dismissOnOutsideTap, and use finalFocusRef to choose where focus returns.

```tsx
/** @jsxImportSource @octane-xplat/jsx */
import { useRef, useState } from 'octane'
import type { HostElement } from '@octane-xplat/jsx/intrinsics'
import { Popover, Pressable, Text, TextInput, View } from '@octane-xplat/ui'

export function FilterMenu() {
  const anchor = useRef<HostElement | null>(null)
  const [open, setOpen] = useState(false)
  return (
    <View>
      <View ref={anchor}>
        <Pressable onPress={() => setOpen(true)}><Text>Filters</Text></Pressable>
      </View>
      <Popover anchor={anchor} open={open} onDismiss={() => setOpen(false)} placement="bottom" alignment="start">
        <TextInput defaultValue="Name" />
        <Pressable onPress={() => setOpen(false)}><Text>Apply</Text></Pressable>
      </Popover>
    </View>
  )
}
```

Content keeps its Octane context and updates while open. `placement` picks a
side, `alignment` lines it up, and `offset` takes a number or px string.
GTK flips sides and clamps to the window when the popup would not fit.
Pointer and keyboard dispatch stay with the top layer when popovers nest.

## Dialogs and overlays

`Dialog`, `AlertDialog`, `Overlay` and the imperative hooks render in an
in-window layer above the root content — the GTK equivalent of the native
`RootLayout` host. A modal dialog dims the background, claims outside
presses, captures focus on open and restores it on close, and Escape
closes only the topmost layer. Imperative `useImperativeDialog` /
`useImperativeAlertDialog` mount content without a declaring node; the
shared layer stack keeps dialogs, popovers and menus ordered.

```tsx
/** @jsxImportSource @octane-xplat/jsx */
import { useState } from 'octane'
import { AlertDialog, Button, Dialog, DialogHeader, Text, useImperativeDialog } from '@octane-xplat/ui'

export function Flow() {
  const [open, setOpen] = useState(false)
  const confirm = useImperativeDialog()
  return (
    <>
      <Button label="Edit" clickAction={() => setOpen(true)} />
      <Dialog isOpen={open} onOpenChange={setOpen}>
        <DialogHeader title="Edit profile" />
        <Text>Dialog content portals above the window.</Text>
      </Dialog>
      <Button label="Delete" clickAction={() =>
        confirm.show(<AlertDialog isOpen title="Delete item?" actionLabel="Delete" onAction={() => confirm.hide()} />)} />
      {confirm.element}
    </>
  )
}
```

## Choose one or many options

On GTK 4.14 or newer, `Selector` opens a finite list in a Popover anchored
to its trigger, and `MultiSelector` presets `selectionMode="multiple"`.
Pass `options`, read selection through `value`/`onValueChange` (a string or
null for Selector, a string array for MultiSelector), or use
`defaultValue`/`defaultOpen` for uncontrolled state. `searchable` adds a
focused filter input; `hasSelectAll`, `hasClear`, `placeholder`,
`emptyText` and `triggerDisplay` shape the chrome.

```tsx
import { useState } from 'octane'
import { Selector, MultiSelector } from '@octane-xplat/ui'

const people = [
  { value: 'ada', label: 'Ada' },
  { value: 'sam', label: 'Sam', description: 'On leave' },
  { value: 'jo', label: 'Jo', isDisabled: true },
]

export function Assignee() {
  const [who, setWho] = useState<string | null>(null)
  const [reviewers, setReviewers] = useState<string[]>([])
  return (
    <>
      <Selector
        label="Assignee"
        options={people}
        value={who}
        onValueChange={setWho}
        placeholder="Pick someone"
        searchable
      />
      <MultiSelector
        label="Reviewers"
        options={people}
        value={reviewers}
        onValueChange={setReviewers}
        hasSelectAll
      />
    </>
  )
}
```

Escape and outside taps request dismissal; a single pick closes Selector
while MultiSelector stays open and toggles. Focus returns to the trigger.
Group options with `group`, disable the field with `isDisabled`, and wrap
in `Field` for label, description, required and status chrome. Arrow-key
listbox navigation is web-only today, so on GTK pick options with the
pointer. Placement and dismissal are qualified under X11/Xvfb only.

## Control accessibility state

GTK intrinsics accept an accessibilityState record with independent flags.
For example, a field can report required, loading and invalid state together.
Read-only metadata also follows a textfield's editable property, and disabled
metadata respects native widget sensitivity.

```tsx
/** @jsxImportSource @octane-xplat/jsx */
export function AccountField(props: { required: boolean; loading: boolean; invalid: boolean }) {
  return (
    <textfield
      accessibilityLabel="Account"
      accessibilityState={{ required: props.required, busy: props.loading, invalid: props.invalid }}
      text=""
    />
  )
}
```

These flags describe the widget; they do not disable interaction or change its
value. Use isEnabled, editable, checked and the control's other behavior props
for that. The renderer clears removed flags instead of retaining stale values.
State storage is checked against native GTK; screen-reader behavior has not yet
been qualified with an assistive-technology client.

```tsx
/** @jsxImportSource @octane-xplat/jsx */
export function ReadOnlyField(props: { readOnly: boolean; disabled: boolean }) {
  return <textfield text="Stored account" editable={!props.readOnly} isEnabled={!props.disabled} />
}
```

## Keyboard press actions

A Pressable with accessibilityRole="button" accepts Tab focus and activates on
Return or Space release. With accessibilityRole="link", it activates on Return.
Press-in runs once when the key goes down; press-out runs before activation.
Moving focus, disabling the action or removing it cancels a held key.

```tsx
/** @jsxImportSource @octane-xplat/jsx */
import { Pressable, Text } from '@octane-xplat/ui'

export function SaveAction(props: { disabled: boolean; save: () => void }) {
	return (
		<Pressable
			accessibilityRole="button"
			accessibilityLabel="Save"
			disabled={props.disabled}
			onPress={props.save}
		>
			<Text>Save</Text>
		</Pressable>
	)
}
```

A Pressable without an interactive role keeps its existing pointer behavior
and adds no keyboard stop. Keyboard events from a focused child textfield do
not activate its parent Pressable.

```tsx
/** @jsxImportSource @octane-xplat/jsx */
import { Pressable, Text } from '@octane-xplat/ui'

export function PointerAction(props: { disabled: boolean; save: () => void }) {
  return (
    <Pressable disabled={props.disabled} onPress={props.save}>
      <Text>Save</Text>
    </Pressable>
  )
}
```

Custom Mason controls with checkbox or switch roles accept Tab focus and
activate on Space release. Return does not toggle them. Keep the checked
metadata in sync with the owning state; a mixed checkbox uses checked: 'mixed'.

```tsx
/** @jsxImportSource @octane-xplat/jsx */
import { CheckboxIndicator } from '@octane-xplat/ui'

export function Selection(props: { selected: boolean; toggle: () => void }) {
  return (
    <masonview accessibilityRole="checkbox" accessibilityLabel="Keep receipts"
      accessibilityState={{ checked: props.selected }} onTap={props.toggle}
      style={{ display: 'flex', width: 24, height: 24 }}>
      <CheckboxIndicator state={props.selected ? 'checked' : 'unchecked'} />
    </masonview>
  )
}
```

These keyboard checks use actual X11 input. For an ordinary selection field,
use the curated [CheckboxInput or Switch](#toggle-fields) instead of building
a custom role host.


Multiline text and placeholder hints support textAlign. Use a numeric or pixel
lineHeight for a fixed logical-pixel row spacing; TextArea row fitting also
reads that value from ancestor CSS. Relative line-height units are not yet
qualified for row fitting.

```tsx
/** @jsxImportSource @octane-xplat/jsx */
export function AlignedNotes() {
  return <textview text="Notes" hint="Write a note"
    style={{ width: 280, height: 96, textAlign: 'center', lineHeight: 48 }} />
}
```

## Arrange labeled fields

Use FormLayout to arrange fields vertically, in equal horizontal columns, or
with each label beside its control. Set spacing explicitly. GTK's
horizontal-labels mode sizes each label within its own field; it does not
align every label into a shared column. Changing direction keeps existing
editors, local text and focus.

```tsx
import { Field, FormLayout, TextInput } from '@octane-xplat/ui'

export function Contact() {
  return (
    <FormLayout direction="horizontal" defaultOptionality="required" style={{ gap: 16 }}>
      <Field label="Name"><TextInput /></Field>
      <Field label="Email"><TextInput /></Field>
    </FormLayout>
  )
}
```

Real Linux tests cover native geometry, changing child counts, direction
changes, required/optional defaults and disposal. Existing field tests cover
labels, widths, descriptions, status tooltips and state. These checks do not
qualify screen-reader output, IME, phone runtime or pixel parity.

## Join inputs with a prefix or suffix

InputGroup owns one label, description, status and width for its members.
Use InputGroupText for a prefix such as a currency symbol. Read-only and
loading state reach the editors; disabling the group also disables actions
inside it. Individual editors can override the group's size.

```tsx
import { InputGroup, InputGroupText, TextInput } from '@octane-xplat/ui'

export function Price(props: { locked: boolean; saving: boolean; disabled: boolean }) {
  return (
    <InputGroup label="Amount" description="Before tax" width="100%"
      size="lg" isRequired isDisabled={props.disabled}
      isReadOnly={props.locked} isLoading={props.saving}>
      <InputGroupText>$</InputGroupText>
      <TextInput defaultValue="12" size="sm" />
    </InputGroup>
  )
}
```

The maintained Linux fixture checks native group metadata, member state,
widths, prefixes, updates and cleanup. GTK's group role uses the existing
role adapter; iOS and Android retain NativeScript's narrower role mapping.
This evidence does not establish screen-reader output or pixel parity.

## Group related fields

FieldGroup gives related fields a heading while each editor keeps its own
label. Changing or removing the heading retains the editors, their local text
and focus.

```tsx
import { FieldGroup, TextInput } from '@octane-xplat/ui'

export function Address() {
  return (
    <FieldGroup label="Address">
      <TextInput label="Street" />
      <TextInput label="City" />
    </FieldGroup>
  )
}
```

Custom field parts can read inherited required/optional, size and state defaults
with useFieldControl. This example displays the effective required state inside
Field or FormLayout.

```tsx
import { Text, useFieldControl } from '@octane-xplat/ui'
import type { FieldControlProps } from '@octane-xplat/ui'

export function RequiredHint(props: FieldControlProps) {
  const { props: control } = useFieldControl(props)
  return <Text>{control.isRequired ? 'Required' : 'Optional'}</Text>
}
```

Maintained Linux tests cover native group metadata, editor ownership, inherited
and explicit hook defaults, updates and disposal. They do not establish
screen-reader output or pixel parity.

## Draw selection indicators

CheckboxIndicator, RadioIndicator and CheckIndicator draw a control's selection
mark. The owning control supplies focus, input and accessibility state; these
parts are decorative. CheckboxIndicator also accepts the indeterminate state.

```tsx
import { CheckboxIndicator, RadioIndicator, CheckIndicator } from '@octane-xplat/ui'

export function SelectionMarks() {
  return (
    <>
      <CheckboxIndicator state="indeterminate" size="sm" />
      <RadioIndicator state="checked" />
      <CheckIndicator state="checked" />
    </>
  )
}
```

Use registerIndicator or registerIndicators to replace a named visual.
useIndicator subscribes a component to later replacements; getIndicator reads
the current visual once. Pass defaultIndicators to registerIndicators to
restore the built-in visuals.

```tsx
import { CheckIndicator, defaultIndicators, getIndicator,
  registerIndicator, registerIndicators, useIndicator } from '@octane-xplat/ui'
import type { IndicatorProps } from '@octane-xplat/ui'

function CompactCheck(props: IndicatorProps<'singleSelection'>) {
  return <CheckIndicator {...props} size="sm" />
}

export function SelectedMark() {
  const Mark = useIndicator('check')
  return Mark ? <Mark state="checked" /> : null
}

registerIndicator('check', CompactCheck)
const currentMark = getIndicator('check')
// Restore built-in visuals when your app no longer needs the overrides:
registerIndicators(defaultIndicators)
```

Real Linux checks cover native dimensions, SVG loading, state/size changes,
custom children, forwarded refs, live registry replacements and cleanup.
They do not compare pixels or establish assistive-technology output.
