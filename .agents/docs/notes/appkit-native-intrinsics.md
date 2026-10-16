# AppKit native intrinsic implementation ledger

This contributor note tracks runtime work toward the shared native JSX release.
A declaration or a platform component that attaches a host through a ref does
not implement the corresponding raw intrinsic tag.

The [original plan](goddard://task/d95bf9e4-08ae-4198-9c1a-024f8baaf7a7)
requires the complete native contract before release: no reduced macOS subset,
legacy source aliases, or compatibility period. This ledger does not change
those gates. Stage 3 source/default migration and full platform qualification
remain separate work.

## Current inventory

The authority is `NativeElements` in `packages/jsx/src/shared.d.ts`: 39 core
intrinsics, nine maintained extensions, and compiler-produced `#text`.
All conditioned native declarations derive from that same map.

| Family            | Existing AppKit factories                                                                                                                     | Missing raw AppKit hosts                                                                                                               |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Layout            | `absolutelayout`, `flexboxlayout`, `gridlayout`, `stacklayout`, `contentview`, `docklayout`, `wraplayout`, `proxyviewcontainer`, `rootlayout` | —                                                                                                                                      |
| Text              | `label`, `span`, `formattedstring`, `htmlview`                                                                                                | —                                                                                                                                      |
| Text input        | `textfield`, `textview`, `searchbar`                                                                                                          | —                                                                                                                                      |
| Controls          | `button`, `switch`, `slider`, `activityindicator`, `datepicker`, `listpicker`, `progress`, `segmentedbar`, `segmentedbaritem`, `timepicker`   | —                                                                                                                                      |
| Collections       | `listview`, `tabview`, `tabviewitem`                                                                                                          | —                                                                                                                                      |
| Navigation        | —                                                                                                                                             | `actionbar`, `actionitem`, `frame`, `navigationbutton`, `page`                                                                         |
| Other             | `image`, `scrollview`, `webview`                                                                                                              | `liquidglass`, `placeholder`                                                                                                           |
| Shared extensions | —                                                                                                                                             | `animatedimage`, `applesigninbutton`, `cachedimage`, `googlesigninbutton`, `nscanvas`, `pager`, `svgview`, `xplatlottie`, `xplatvideo` |

There are now 32 core factories and 7 missing core hosts. `span` and
`formattedstring` are viewless; their composition checks are described below. The renderer
also handles `#text` and its historical AppKit-only `stack` name. Neither adds
a shared core element. Existing factory presence is source evidence, not a
claim that all shared props, events, styles, or lifecycle behavior are qualified.

[Palmer's retained attempt](goddard://task/5a8593b0-4b58-41b8-b194-acb1b4b4c13a)
failed during implementation, without a retained commit or submission result.
The current inventory therefore supersedes the assessment that the whole
runtime-parity assignment had finished.

## StackLayout host

The new host uses AppKit's NSStackView. Its default direction is vertical and
its default gap is zero. Updating or removing `orientation` reuses the same
native view; removing it restores vertical layout. Padding and child cross-axis
alignment use Auto Layout constraints. A fixed-size child with stretch
alignment centers on the cross axis, matching NativeScript's layout helper.

```tsx
/** @jsxImportSource @octane-xplat/jsx */
export default function Example() {
	return (
		<stacklayout orientation="horizontal" style={{ width: 240, height: 80, padding: 8 }}>
			<label text="First" verticalAlignment="middle" style={{ width: 40, height: 16 }} />
			<label text="Second" verticalAlignment="top" style={{ width: 40, height: 16 }} />
		</stacklayout>
	)
}
```

The maintained consumer fixture exercises default/reactive direction, padding,
fixed dimensions, different child alignment, keyed moves, child removal, host
identity, callback/object refs and cleanup, and reactive shared tap payloads.
Its production bundle and retained-root HMR run outside the repository from
packed JSX, renderer, and CLI packages. Viewless text children and invalid
orientation are rejected before a batch mutates the tree.

```sh
pnpm --filter @octane-xplat/macos-renderer test
pnpm --filter @octane-xplat/macos-renderer test:packed
pnpm --filter @octane-xplat/jsx typecheck
pnpm --filter @octane-xplat/jsx test:packed
```

CodeBlock, TimeWheelPanel, DateRangeInput and DateTimeInput already emit this
intrinsic in their macOS implementations. Their former unsupported-tag failure
is removed. The packed fixture establishes the raw host behavior; it does not
qualify every surrounding component interaction.

## Remaining release gates

The 7 missing core hosts and nine missing raw extension hosts remain required.
Existing hosts still need the full common contract audit, including lifecycle
notifications, gesture coverage, visibility/collapse, style coverage, and
payload normalization. StackLayout's inherited common-contract gaps are part
of that audit; this change does not qualify all common events or OS input.
No new iOS/Android execution or visual parity evidence is supplied by this unit.

This host fix does not change the recommended UI Stack API or the requirements
of the shared-layout recipe. Public source migration, release documentation,
package defaults, and the full native/web acceptance matrix must still land
and pass together. ContentView follows below; the independent layout units follow below.

## ContentView host

ContentView owns one native child slot. A new insertion replaces the current
native child; removing an older renderer child leaves its replacement intact.
Removing the current child empties the slot without restoring an older child.
Use one child in authored JSX. Wrap several children in a layout first.

```tsx
/** @jsxImportSource @octane-xplat/jsx */
import { useSignal$ } from 'octane/signals/client'

export default function ContentExample() {
	const visible$ = useSignal$(true)
	return (
		<stacklayout>
			<contentview style={{ width: 200, height: 80 }}>
				{visible$.get() ? (
					<label
						text="Content"
						horizontalAlignment="center"
						verticalAlignment="middle"
						style={{ width: 60, height: 20 }}
					/>
				) : null}
			</contentview>
			<flexboxlayout onTap={() => visible$.set(!visible$.get())}>
				<label text="Toggle" />
			</flexboxlayout>
		</stacklayout>
	)
}
```

The maintained packed AppKit fixture checks mount, reactive child and host
updates, replacement, emptying, reinsertion, fixed and natural sizing, alignment,
callback/object/array refs, descendant detachment and teardown. Retained-root
HMR checks ContentView and child identity, edited text and disposal. Unit checks
also cover superseded-child removal, percentages and margins. The same shared
public declarations remain in use; fresh packed type lanes include ContentView.
These checks qualify its single-child lifecycle, not every inherited common
prop, event or style. No fresh mobile execution, OS input, visual analysis or
full native parity is claimed.

## DockLayout host

DockLayout places children in their JSX order. Each child consumes a strip at
its `dock` edge; the default edge is left. The final child receives the remaining
rectangle by default. Set `stretchLastChild={false}` to dock it normally.
Removing that prop restores stretching. Fixed child dimensions and alignment
still apply inside each strip, including the final rectangle. Padding and
margins reduce the space available to children.

```tsx
/** @jsxImportSource @octane-xplat/jsx */
export default function DockExample() {
	return (
		<docklayout style={{ width: 300, height: 160, padding: 10 }}>
			<label dock="top" text="Header" style={{ height: 20 }} />
			<label dock="right" text="Side" style={{ width: 40 }} />
			<contentview>
				<label text="Remaining space" />
			</contentview>
		</docklayout>
	)
}
```

Its maintained unit and packed AppKit fixtures check all four edges, ordering,
remaining-space geometry, fixed and natural sizing, padding, margins, resizing,
prop removal, moves, replacement, refs and cleanup. Retained-root HMR checks
host and child identity, edited text, signal state and teardown. This unit
keeps the canonical shared types; it does not qualify the inherited common
contract gaps or full native parity. No mobile, visual or OS-input evidence is
provided.

## WrapLayout host

WrapLayout places items left to right and starts a new row when the next item
exceeds the available width. Set `orientation="vertical"` to fill columns from
top to bottom instead. Positive item dimensions define equal slots; nonpositive or
removed dimensions use each child's measured size. Removing orientation
restores horizontal layout. Padding, margins, fixed child sizes and alignment
apply within those slots.

```tsx
/** @jsxImportSource @octane-xplat/jsx */
export default function WrapExample() {
	return (
		<wraplayout
			orientation="vertical"
			itemWidth={80}
			itemHeight={40}
			style={{ width: 200, height: 100, padding: 10 }}
		>
			<label text="First" style={{ width: 40, height: 20 }} />
			<label text="Second" />
			<contentview>
				<label text="Third" />
			</contentview>
		</wraplayout>
	)
}
```

The maintained unit and packed AppKit fixtures check horizontal and vertical
wrapping, item-size updates and defaults, fixed and natural sizing, padding,
margins, resizing, ordering, moves, parent changes, replacement, refs and
cleanup. Retained-root HMR checks host/child identity, edited text, signal
state and teardown. These checks qualify this core host, not the inherited
common-contract gaps or full native parity. Mobile execution, visual parity
and OS input remain unqualified.

## ProxyViewContainer logical host

ProxyViewContainer groups children without adding a native view. Its children
participate directly in the nearest parent layout, in JSX order. Attached
layout properties such as `row`, `col`, `dock`, `left` and `top` reach those
children; a child's explicit value takes precedence. Removing a forwarded
property restores the child's own value or the layout default. ContentView
still accepts only one projected layout child; group multiple children in a
layout before putting them in ContentView.

```tsx
/** @jsxImportSource @octane-xplat/jsx */
export default function ProxyExample() {
	return (
		<gridlayout rows="40,40" columns="100,100" style={{ width: 200, height: 80 }}>
			<proxyviewcontainer row={1} col={1}>
				<label text="Projected into the second cell" />
			</proxyviewcontainer>
		</gridlayout>
	)
}
```

On macOS, a viewless intrinsic's ref receives a logical element instance,
including when it has no children. The exported conditioned `LogicalElement`
type exposes its identity (`id`, `type`) and `view: null`. View-backed tags
continue to receive AppKit views. Callback, object and nested-array refs use
the universal runtime's assignment and cleanup rules.

```ts
import type { JSX, LogicalElement, Ref } from '@octane-xplat/jsx/jsx-runtime'

const current = { current: null as LogicalElement | null }
const refs: Ref<LogicalElement> = [
	current,
	(element) => {
		if (element) console.log(element.id, element.type)
		return () => {}
	},
]
const attributes: JSX.IntrinsicElements['proxyviewcontainer'] = { ref: refs }
void attributes
```

The maintained tests and packed AppKit consumer exercise logical identity,
empty refs, nested projection, ordered moves, prop updates and default
restoration, parent changes, replacement, removal, disposal and retained-root
HMR. Fresh packed declaration lanes check the viewless ref contract. This unit
does not qualify the inherited common event/style contract or complete native
parity. No mobile execution, visual analysis or OS-input evidence is supplied.

## RootLayout host

RootLayout overlays its children in one cell. Later JSX children appear above
earlier children. Unconstrained children stretch; fixed sizes center by default.
Padding, margins and child alignment apply within the cell. Removing those
values restores their defaults. The shared contract exposes common attributes,
without track configuration or imperative popup props.

```tsx
/** @jsxImportSource @octane-xplat/jsx */
export default function RootExample() {
	return (
		<rootlayout style={{ width: 200, height: 80, padding: 10 }}>
			<label text="Background" />
			<contentview
				horizontalAlignment="right"
				verticalAlignment="bottom"
				style={{ width: 40, height: 20 }}
			>
				<label text="Above" />
			</contentview>
		</rootlayout>
	)
}
```

The maintained unit and packed AppKit fixtures check overlap, default
restoration, sizing, padding, margins, projection, keyed ordering, nested roots,
parent changes, replacement, removal, retained refs and disposal. Retained-root
HMR checks host and child identity, edited text, retained state and teardown.
Window-owned presentation remains independent of the raw host's child tree;
the fixture checks its ownership and explicit cleanup. These checks do not
qualify NativeScript's imperative popup methods, OS input, mobile overlays,
visual parity or the inherited common event/style contract. All remaining
native hosts and release gates still apply.

## SearchBar host

SearchBar uses NSSearchField. Text and hint default to empty strings; removing
these props restores the defaults without replacing the field. Text changes
carry `eventName`, `object`, `value` and `oldValue`; unchanged strings emit no
change event. Return emits `submit` with the host object. Clearing the field
changes text without submitting. Put SearchBar inside a layout; child views belong alongside it.

```tsx
/** @jsxImportSource @octane-xplat/jsx */
import { useSignal$ } from 'octane/signals/client'

export default function SearchExample() {
	const query$ = useSignal$('')
	return (
		<stacklayout>
			<searchbar
				text={query$.get()}
				hint="Find items"
				onTextChange={(event) => query$.set(event.value)}
				onSubmit={() => console.log(query$.get())}
				style={{ width: 240, height: 28 }}
			/>
		</stacklayout>
	)
}
```

Maintained unit and packed AppKit checks cover text/hint updates and defaults,
change/submit payloads, unchanged-value suppression, handler removal, layout,
keyed ordering, parent changes, replacement, refs and disposal. Retained-root
HMR checks the field identity, revised text, retained signal state and teardown.
Delegate dispatch is runtime evidence for the event bridge, not OS keyboard or
hit-testing evidence. Inherited common gesture, lifecycle, visibility and style
coverage still needs the common-contract audit. No mobile execution, visual
parity or full native release acceptance is claimed.

## FormattedString logical host

FormattedString adds styled text to a Label, Button, TextField, TextView or
SearchBar without adding a native view. Its ordered Span children inherit font
and color values; nested spans override only the values they supply. Removing
an override restores the ancestor value. An empty container clears composed
text; removing the container restores its parent's plain `text` value. Both
FormattedString and Span refs receive the macOS `LogicalElement` instance.

```tsx
/** @jsxImportSource @octane-xplat/jsx */
export default function FormattedExample() {
	return (
		<label text="Plain fallback">
			<formattedstring fontFamily="system-ui" fontSize={20} color="#222222">
				<span text="Hello " fontWeight="bold">
					<span text="world" color="#2563eb" />
				</span>
			</formattedstring>
		</label>
	)
}
```

Maintained tests and the independent packed AppKit consumer cover inheritance,
local styling, reactive updates, default restoration, nested text, keyed order,
emptying, replacement, parent changes, refs, cleanup and retained-root HMR.
Parent changes through authored JSX dispose and recreate logical nodes; they
do not promise identity across renderer parents. The inherited common
lifecycle/gesture/class styling audit, broader color formats, host-object policy,
mobile execution, OS input, visual parity and the complete release gates remain
open. This unit changes no recipe workflow and makes no full parity claim.

## HtmlView host

HtmlView displays attributed HTML in a noneditable, selectable AppKit text field.
The HTML importer handles inline markup, entities and links. Updating `html`
keeps the same native ref; removing it clears the content. Font and color
styles apply to the HTML body, and removing them restores the host defaults.
Supply content through `html`, with no JSX children.

```tsx
/** @jsxImportSource @octane-xplat/jsx */
export default function HtmlExample() {
	return (
		<stacklayout>
			<htmlview
				html="<b>Hello</b> &amp; welcome"
				style={{ fontSize: 20, color: '#2563eb', width: 240, height: 40 }}
			/>
		</stacklayout>
	)
}
```

Maintained unit and independent packed AppKit checks cover parsing, UTF8 text,
HTML font traits and links, body styling, updates, clearing, style defaults,
layout, keyed order, parent changes, replacement/removal, refs, cleanup and
retained-root HMR. Authored JSX parent changes create a new host and clean the
old ref; retained identity is checked within one parent. Shared declarations
remain unchanged. The inherited common gesture/lifecycle/style audit, mobile
execution, OS input, visual parity and complete release gates remain open.
No recipe workflow changes in this core-host unit.

## ActivityIndicator host

ActivityIndicator uses AppKit's indeterminate NSProgressIndicator spinner.
`busy` defaults to false: the stopped spinner is invisible but keeps its layout
slot. Setting `busy` starts or stops native animation; removing it restores the
stopped default. Updates and keyed moves keep the same native ref. Supply no
JSX children. The raw host uses AppKit's regular spinner appearance; the shared
UI ActivityIndicator remains a separate normalized component.

```tsx
/** @jsxImportSource @octane-xplat/jsx */
import { useSignal$ } from 'octane/signals/client'

export default function ActivityExample() {
	const busy$ = useSignal$(true)
	return (
		<stacklayout>
			<activityindicator busy={busy$.get()} style={{ width: 24, height: 24 }} />
			<button text="Stop" onTap={() => busy$.set(false)} />
		</stacklayout>
	)
}
```

Maintained unit and packed AppKit checks cover spinner defaults, busy updates,
dropped busy/style restoration, intrinsic and explicit sizing, nesting, keyed
order, parent changes, replacement/removal, refs and teardown. Retained-root
HMR preserves host identity and signal state while updating busy behavior.
Authored JSX parent changes recreate hosts and clean the previous refs; the
production-driver unit test also checks physical reparenting. Animation start
and stop calls are checked in units; packed checks inspect native visibility
and ownership, without visual frame analysis. Shared types and host-ref policy
are unchanged. Inherited common gesture/lifecycle/class/style/accessibility
coverage, mobile execution, OS input, visual parity and the full release gates
remain open. This unit changes no recipe workflow.

## DatePicker host

DatePicker uses NSDatePicker's date field and stepper. `date`, `minDate` and
`maxDate` are calendar dates: the boundary strips time-of-day to local midnight.
The `dateChange` event also carries a local-midnight Date. Use `timepicker` for
time-of-day. Month is one-based; day/month/year setters update calendar components.
Removing a date or component prop restores its creation-day default; removing
bounds clears them. Put the picker alongside other children in a layout.

```tsx
/** @jsxImportSource @octane-xplat/jsx */
import { useSignal$ } from 'octane/signals/client'

export default function DateExample() {
	const date$ = useSignal$(new Date(2026, 4, 10))
	return (
		<stacklayout>
			<datepicker
				date={date$.get()}
				minDate={new Date(2026, 4, 1)}
				maxDate={new Date(2026, 4, 31)}
				onDateChange={(event) => date$.set(event.value)}
			/>
		</stacklayout>
	)
}
```

Maintained unit and packed consumer fixtures cover date/bounds/components,
normalization, reactive updates, defaults, unchanged-event suppression, native
action payloads, intrinsic and explicit layout, ordering, parent changes,
replacement/removal, refs and teardown. Retained-root HMR keeps the host and
signal state while an edited date changes. Authored parent changes recreate
hosts and clean old refs; units also cover physical reparenting. Dispatch is
event-bridge evidence, not OS input. No visual or mobile execution is claimed.
The shared date-only contract still needs mobile boundary normalization and
hardware qualification, particularly iOS's inherited time-preserving setters.
Inherited common lifecycle/gesture/style/accessibility coverage and full release
gates remain open. This raw-host unit changes no recipe workflow.

## ListPicker host

ListPicker uses a noneditable AppKit popup button. Items keep their array order,
including duplicate and empty labels; null items display their index. An empty
list has index -1. Populated lists clamp the requested index to their range,
selecting the first item by default. Updating or removing items and selection
keeps the host; removed items clear the list. Selection changes from props or
native actions emit `selectedIndexChange` with the numeric `value` and host
`object`. Put the picker alongside other children in a layout.

```tsx
/** @jsxImportSource @octane-xplat/jsx */
import { useSignal$ } from 'octane/signals/client'

export default function ListExample() {
	const selected$ = useSignal$(0)
	return (
		<stacklayout>
			<listpicker
				items={['Small', 'Medium', 'Large']}
				selectedIndex={selected$.get()}
				onSelectedIndexChange={(event) => selected$.set(event.value)}
			/>
		</stacklayout>
	)
}
```

Maintained unit and packed public consumer checks cover item/index updates,
empty lists, duplicate labels, bounds coercion, event payloads and suppression,
style restoration, layout, keyed order, parent changes, replacement/removal,
refs and teardown. Retained-root HMR checks identity, revised items and retained
signal selection. Authored parent changes recreate hosts and clean old refs;
units also check physical reparenting. Action dispatch establishes the event
bridge, not OS input. Shared declarations and host-ref policy remain unchanged.
The inherited common lifecycle/gesture/style/accessibility audit, mobile hardware,
visual parity and complete native release gates remain open. This core host
changes no recipe workflow.

## Progress host

Progress uses AppKit's regular determinate NSProgressIndicator bar. Value defaults
to 0 and maximum to 100. Value clamps to the range from 0 through the maximum;
a nonpositive maximum displays 0%, without division by zero. Removing either
prop restores its default; updates and keyed moves retain the native ref.
Supply no JSX children and put the bar alongside other children in a layout.

```tsx
/** @jsxImportSource @octane-xplat/jsx */
import { useSignal$ } from 'octane/signals/client'

export default function ProgressExample() {
	const value$ = useSignal$(25)
	return (
		<stacklayout>
			<progress value={value$.get()} maxValue={100} style={{ width: 240, height: 16 }} />
			<button text="Complete" onTap={() => value$.set(100)} />
		</stacklayout>
	)
}
```

Maintained unit and packed public consumer checks cover ranges, fractions,
clamping, nonpositive maxima, updates, dropped props/style defaults, intrinsic
and explicit sizing, nesting, keyed order, parent changes, replacement/removal,
refs and teardown. Retained-root HMR checks host identity, revised progress and
retained signal state. Authored parent changes recreate hosts and clean the old
refs; units also exercise physical reparenting. AppKit uses a safe positive
native range for the shared 0% case. Nonnumeric and nonfinite inputs fail
explicitly before allocation. No AppKit-only props enter the shared declarations.

The shared range normalization is required on mobile too. Pinned NativeScript
9.1.2 currently diverges for degenerate maxima; its boundary normalization and
hardware qualification remain release gates. Inherited common lifecycle,
gesture, visibility/collapse, complete class/style/accessibility behavior,
mobile execution, OS input, visual parity and the full native release gates
remain open. This raw-host unit changes no recipe workflow.

## SegmentedBar host

SegmentedBar uses NSSegmentedControl with a single selection. Supply ordered
item objects with `title` values; missing titles are empty strings. Duplicate
and empty titles keep their slots. Empty items select -1; populated items clamp
selection to the available indices and default to the first item. Removing
items clears the control; removing selection restores the default. Selection
changes emit `selectedIndexChange` with `value`, `oldIndex`, `newIndex` and the
host `object`. Put the control alongside other views in a layout.

```tsx
/** @jsxImportSource @octane-xplat/jsx */
import { useSignal$ } from 'octane/signals/client'

export default function SegmentExample() {
	const selected$ = useSignal$(0)
	return (
		<stacklayout>
			<segmentedbar
				items={[{ title: 'Day' }, { title: 'Week' }]}
				selectedIndex={selected$.get()}
				style={{ selectedBackgroundColor: '#2563eb', width: 240, height: 32 }}
				onSelectedIndexChange={(event) => selected$.set(event.value)}
			/>
		</stacklayout>
	)
}
```

The selected background is a style property. Removing it restores NativeScript's
blue default. The existing renderer color parser supports hex and rgb/rgba
strings and rejects other formats explicitly. Item arrays use the canonical
HostObject projection; structural title objects are accepted. The separate `segmentedbaritem` logical host is qualified below. The shared declarations and ref policy are unchanged.

Maintained unit and packed public consumer checks cover ordered item updates,
selection bounds, native action payloads and unchanged-event suppression,
tint/default restoration, sizing, nesting, keyed moves, parent changes,
replacement/removal, refs and teardown. Retained-root HMR checks host identity,
edited titles and retained selection. Authored parent changes recreate the host
and clean old refs; units also check physical reparenting. Native action dispatch
is event-bridge evidence, not OS input. Inherited common lifecycle, gesture,
class/style/accessibility and host-object policy gaps, mobile hardware, visual
parity and full release acceptance remain open. This raw host changes no recipe
workflow; the normalized UI SegmentedControl remains separate.

## SegmentedBarItem logical host

Put SegmentedBarItem children inside SegmentedBar to supply titles in JSX order.
Each item owns one segment, including duplicate or empty titles. Updating `title`
keeps the logical item and native parent; removing `title` restores an empty
string. Items allocate no NSView and use the macOS `LogicalElement` ref policy.
Supply title content through the prop, with no JSX children. Per-item `enabled`
is outside the canonical contract.

```tsx
/** @jsxImportSource @octane-xplat/jsx */
import { useSignal$ } from 'octane/signals/client'

export default function SegmentItemExample() {
	const title$ = useSignal$('Day')
	return (
		<stacklayout>
			<segmentedbar selectedIndex={0} style={{ width: 240, height: 32 }}>
				<segmentedbaritem title={title$.get()} />
				<segmentedbaritem title="Week" />
			</segmentedbar>
			<button text="Rename" onTap={() => title$.set('Today')} />
		</stacklayout>
	)
}
```

Maintained units and the independent packed AppKit consumer check title updates
and default restoration, ordered insertion and keyed moves, duplicate/empty
slots, valid parent layout, replacement, removal, authored parent changes,
logical identity, object/callback/nested-array refs, cleanup and root teardown.
Retained-root HMR checks logical item and native parent identity, edited title,
retained signal selection and disposal. Authored parent changes recreate the
logical item; units additionally exercise physical reparenting. Conditioned
packed declarations check logical refs without widening the shared props.
The inherited common lifecycle/gesture/class/style/accessibility and host-object
policy audit, mobile hardware, visual parity, OS input and full release gates
remain open. This core unit changes no recipe workflow; the normalized UI
SegmentedControl remains separate.

## TimePicker host

TimePicker uses NSDatePicker's hour/minute field and stepper. Times normalize to
`new Date(0, 0, 0, hour, minute)`; calendar dates, seconds and milliseconds are
discarded. Strings accept 24-hour `HH:mm` or `HH:mm:ss`; invalid inputs throw
TypeError. The default is the creation-time hour/minute. Removing time or
component props restores those creation-time values. Put the picker alongside
other views in a layout, without JSX children.

```tsx
/** @jsxImportSource @octane-xplat/jsx */
import { useSignal$ } from 'octane/signals/client'

export default function TimeExample() {
	const time$ = useSignal$(new Date(0, 0, 0, 10, 30))
	return (
		<stacklayout>
			<timepicker
				time={time$.get()}
				minHour={9}
				minMinute={15}
				maxHour={17}
				maxMinute={45}
				onTimeChange={(event) => time$.set(event.value)}
			/>
		</stacklayout>
	)
}
```

The four bound props compose one inclusive range, defaulting to 00:00–23:59.
An inverted proposal keeps both previous effective endpoints. A changed range
clamps selection to its nearest endpoint. Changes emit minute-precision Dates
with the host object and old value; unchanged hour/minute pairs emit nothing.
Components apply in prop order, as with DatePicker.

```tsx
/** @jsxImportSource @octane-xplat/jsx */
export default function BoundedTimeExample() {
	return (
		<timepicker
			time="08:00:59"
			minHour={9}
			minMinute={15}
			maxHour={17}
			maxMinute={45}
			onTimeChange={(event) => console.log(event.value.getHours(), event.value.getMinutes())}
		/>
	)
}
```

Maintained units and the packed public consumer check normalization, bounds,
updates, default restoration, events, sizing, keyed order, parent changes,
replacement/removal, retained refs, teardown and retained-root HMR. Authored
parent changes recreate hosts and clean old refs; units also check physical
reparenting. Action dispatch establishes the event bridge, not OS input.
Pinned NativeScript common callbacks reject out-of-range selections and iOS
bound setters combine fields with the current selection; mobile normalization
must adopt the resolved shared range contract before release. No mobile,
visual, hardware or full parity qualification is claimed. The inherited common
lifecycle/gesture/class/style/accessibility audit and full release gates remain
open. This raw-host unit changes no recipe workflow.

## ListView host

ListView uses a scrolling AppKit table. `renderItem` is the primary template
path: each recycled cell owns an Octane root, and rebinding diffs that root in
place. Items accept arrays or an ItemsSource with `length` and `getItem(index)`;
observable sources with `on`/`off` refresh on `change`. Removing items empties
the table. Item-loading and tap payloads contain the list host, row index and
read-only cell view; `onItemLoading` observes cells without replacing them.
Load-more fires when AppKit presents the last row. Removing `separatorColor`
restores AppKit's default separator color.

```tsx
/** @jsxImportSource @octane-xplat/jsx */
export default function ListExample() {
	return (
		<listview
			items={['First', 'Second']}
			renderItem={(item, index) => <label text={index + ': ' + String(item)} />}
			separatorColor="#cccccc"
			onItemLoading={(event) => console.log(event.index, event.view)}
			onItemTap={(event) => console.log('Tapped', event.index)}
			onLoadMoreItems={() => console.log('Last row presented')}
			style={{ width: 240, height: 160 }}
		/>
	)
}
```

String `itemTemplate` uses NativeScript Builder XML over the shared intrinsic
vocabulary. Nested tags, declared attributes, item paths, `$value` and
expressions evaluate at bind and rebind. Malformed XML, unknown tags and
undeclared props throw TypeError before host allocation. Callable templates
win over strings, and `renderItem` wins over both. A callable `itemTemplate`
or a `createView()` entry in `itemTemplates` returns a host whose owning root
is unmounted on rebind or release. Only the `default` key is reachable without
an `itemTemplateSelector`; other keys throw TypeError.

```ts
import type { ListViewProps, HostObject } from '@octane-xplat/jsx/jsx-runtime'

declare function createCellHost(): HostObject
const xml: ListViewProps<HostObject> = {
	items: [{ person: { name: 'Ada' }, count: 2 }],
	itemTemplate:
		'<StackLayout><Label text="{{ person.name }}"/><Label text="{{ count + 1 }}"/></StackLayout>',
}
const factory: ListViewProps<HostObject> = {
	items: ['Ada'],
	itemTemplates: [{ key: 'default', createView: createCellHost }],
}
void xml
void factory
```

Pinned binding-option and expression helpers come from NativeScript core
9.1.3, with MIT attribution under the renderer's `src/vendor/listview`.
Expression pipes retain NativeScript converter semantics; bindings match the
whole attribute (no interpolation inside literal text). XML text nodes are
ignored as in Builder; use `text` attributes. Style strings become style bags.
Host creation and nesting use the existing AppKit registry. Tags awaiting
AppKit implementation still fail explicitly. Live observable property
bindings, two-way writeback and page-resource/visual-parent binding sources
remain qualification gaps; item-source change notifications and explicit
rebind evaluation are covered. Common inherited behavior, mobile execution,
OS input, visual parity and full-target acceptance remain open.

```ts
import type { ListViewProps, HostObject } from '@octane-xplat/jsx/jsx-runtime'
const options: ListViewProps<HostObject> = {
	items: [{ count: 2, format: (value: number) => '#' + value }],
	itemTemplate: '<Label text="{{ count | format }}"/>',
}
void options
```

## TabView host and minimal logical items

TabView uses NSTabView with the shared `selectedIndex` and both selection
callbacks. Empty tabs select -1; populated tabs clamp the requested index to
their bounds, with the first item selected by default. Removing the index
restores that default. Item children define each tab's content; the macOS
compiler adapter gives each item a portal from the declaring tree. Its content
mounts on assignment, updates in place, and unmounts on unassignment or teardown. Keep the standard
`xplatMacOS` compiler setup when authoring raw tabs.

```tsx
/** @jsxImportSource @octane-xplat/jsx */
export default function TabsExample() {
	return (
		<tabview
			selectedIndex={1}
			style={{ width: 320, height: 180 }}
			onSelectedIndexChange={(event) => console.log(event.value)}
			onSelectedIndexChanged={(event) => console.log(event.oldIndex, event.newIndex)}
		>
			<tabviewitem title="Home">
				<label text="Home content" />
			</tabviewitem>
			<tabviewitem title="Settings">
				<label text="Settings content" />
			</tabviewitem>
		</tabview>
	)
}
```

Resolved contract (2026-10-14): items are logical tabviewitem handles, never
HostObject/NSView values on macOS. Their title/iconSource props describe the
item; JSX children describe its content. The imperative items array accepts
live handles obtained from refs and rejects other values with TypeError.
Retained handles keep identity across array updates, and incoming handles
transfer prior-parent ownership. Reassigning an assigned content root is
rejected; content changes use the item element's children diff. The array is
the imperative alternative to JSX child order. This unit supplies the minimal
logical-item hosting TabView requires; the standalone tabviewitem unit remains
a separate qualification boundary.

```ts
import type { JSX, TabViewItemHandle } from '@octane-xplat/jsx/jsx-runtime'
const retained = { current: null as TabViewItemHandle | null }
const itemAttributes: JSX.IntrinsicElements['tabviewitem'] = {
	title: 'Home',
	iconSource: 'res://Home',
	ref: retained,
}
const attributes = (): JSX.IntrinsicElements['tabview'] => ({
	items: retained.current ? [retained.current] : [],
	selectedIndex: 0,
})
void itemAttributes
void attributes
```

The maintained fixtures cover the host and logical-item boundary. The full
native release, inherited common-contract audit, OS input, mobile execution
and visual parity remain separate gates. No recipe workflow changes here;
the shared JSX source and existing layout recipes retain their release gates.
