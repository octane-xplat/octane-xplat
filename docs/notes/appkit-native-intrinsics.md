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

| Family            | Existing AppKit factories                                                                                                       | Missing raw AppKit hosts                                                                                                               |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Layout            | `absolutelayout`, `flexboxlayout`, `gridlayout`, `stacklayout`, `contentview`, `docklayout`, `wraplayout`, `proxyviewcontainer`, `rootlayout` | —                                                                                                                           |
| Text              | `label`, `span`, `formattedstring`, `htmlview`                                                                                                                 | —                                                                                                          |
| Text input        | `textfield`, `textview`, `searchbar`                                                                                                         | —                                                                                                                            |
| Controls          | `button`, `switch`, `slider`, `activityindicator`, `datepicker`                                                                                                    | `listpicker`, `progress`, `segmentedbar`, `segmentedbaritem`, `timepicker`                          |
| Collections       | —                                                                                                                               | `listview`, `tabview`, `tabviewitem`                                                                                                   |
| Navigation        | —                                                                                                                               | `actionbar`, `actionitem`, `frame`, `navigationbutton`, `page`                                                                         |
| Other             | `image`, `scrollview`, `webview`                                                                                                | `liquidglass`, `placeholder`                                                                                                           |
| Shared extensions | —                                                                                                                               | `animatedimage`, `applesigninbutton`, `cachedimage`, `googlesigninbutton`, `nscanvas`, `pager`, `svgview`, `xplatlottie`, `xplatvideo` |

There are now 24 core factories and 15 missing core hosts. `span` and
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

The 15 missing core hosts and nine missing raw extension hosts remain required.
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
			<htmlview html="<b>Hello</b> &amp; welcome" style={{ fontSize: 20, color: '#2563eb', width: 240, height: 40 }} />
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
