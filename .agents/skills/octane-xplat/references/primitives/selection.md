# Finite choices and menus

Use for switches, checkboxes, radio groups, sliders, finite selection, menus, and anchored popovers. AppKit behavior depends on the [native interaction prerequisites](accessibility.md). [Search and structured input](search.md) owns remote suggestions and filters.

## AppKit sliders

Use scalar or pair values with explicit bounds; controlled sliders need
onValueChange feedback. The AppKit leaf implements steps, noncrossing range
thumbs, marks, text/hover readouts and inherited Field blocking. Dragging stays
delta-based; it does not jump on track taps. Retained thumb key/adjustable
handlers read current values, bounds, steps and callbacks, reject current
blocking/detachment, and claim adjustments before app callback reentry. Consumer
errors propagate after releasing the claim. Preview ownership follows the active
drag: matching normalized starting/latest-requested values are feedback; other
parent values, mode/limits/shape changes or blocking retire it. Keys/adjustable
actions end the preview. An equal normalized prop write cannot signal reset.
Native keyboard, accessibility,
hover timing and layout require separate target qualification. See [AppKit Slider](../../../../../docs/app/components.md#slider-on-appkit).

```tsx
import { Slider } from '@octane-xplat/ui'

export function Budget() {
	return <Slider label="Budget" defaultValue={[20, 80]} min={0} max={100}
		step={5} valueDisplay="text" />
}
```

## AppKit switch saves

Switch now invokes changeAction after onChange, exposes pending through busy,
blocks overlapping saves, and reports the previous value on failure. Completion
after unmount is ignored. Ownership starts before onChange; cached handlers use
current props, so reentry or newly blocked state cannot duplicate an action. A
save requested by a valid event still runs if onChange detaches the UI, but cannot
publish pending/rollback afterward. Forward callback errors release ownership and
propagate; rollback callback faults are logged and release busy. Controlled
parents must apply both forward and rollback callbacks. Four added cases require separate verification; native activation/loading presentation require separate target qualification. See
[switch saves](../../../../../docs/app/components.md#save-a-switch-setting-on-appkit).

```tsx
import { Switch } from '@octane-xplat/ui'

export function Preference({ save }: { save(next: boolean): Promise<void> }) {
	return <Switch accessibilityLabel="Preference" defaultValue changeAction={save} />
}
```


AppKit Switch retains a separate latest uncontrolled intent before forward
state/callback writes, and restores it before rollback callbacks. Held no-save
requests before render use that intent; controlled requests use the parent's
current value and never replace the original local seed. Forward callback throw
retains its already-applied intent while releasing the claim. Pending claims,
current blocking/callbacks, event save ownership and detach guards remain in force.
Five new object-driver cases and extended human-operated fixture controls are
UNRUN. The fixture's run hook still covers only original metadata/direct button
dispatch, not the new local/save/controlled flows or physical input.

```tsx
import { Switch } from '@octane-xplat/ui'
export function ArchiveFlag({ change }: { change(enabled: boolean): void }) {
	return <Switch label="Include archived" defaultValue={false} onChange={change} />
}
```

## AppKit switch metadata

Standalone Switch renders its label, description and detached status; parent
Field keeps ownership when present. labelPosition/labelSpacing and sm/md classes
use the shared geometry; metadata changes retain the toggle's state/host. Hidden
labels keep the accessible name. Label presses now share the toggle/save owner,
focus the control and lease Tab exclusion for the label target. Without the
renderer suppression capability only track activation is enabled. Native hit
testing, tooltip arbitration, Tab/focus/layout/VoiceOver are unqualified. See
[switch settings](../../../../../docs/app/components.md#save-a-switch-setting-on-appkit).

```tsx
import { Switch } from '@octane-xplat/ui'

export function Alerts() {
	return <Switch label="Alerts" description="Daily summary" defaultValue
		labelPosition="start" labelSpacing="spread" width={280} />
}
```

## AppKit checkbox metadata

Checkbox renders standalone label/description/status, reuses enclosing Field
ownership, and hides text without dropping the accessible name. labelTooltip now
forwards to the standalone FormField info affordance; an enclosing Field keeps
that chrome. Metadata changes retain the host/state. Native tooltip activation,
input/layout/accessibility require separate target qualification;
changeAction is still ignored on AppKit, with mixed rollback contract work open.
Use controlled state and onChange for saves; see
[checkbox metadata](../../../../../docs/app/components.md#checkbox-metadata-on-appkit).

```tsx
import { Checkbox } from '@octane-xplat/ui'

export function IncludeArchived() {
	return <Checkbox label="Include archived" labelTooltip="Include archived records" description="Search older records" defaultValue />
}
```


AppKit Checkbox now owns current props, latest uncontrolled intent and a
per-callback claim. Held callbacks recheck current inherited blocking/attachment;
local requests before render use the previous accepted intent, while controlled
requests continue from the parent's value. Suppress callback reentry, retire on
host detach and release claims on consumer throw without undoing local state.
Do not infer async save support: the boolean callback/mixed rollback conflict
remains open. Six new object-driver cases and human-operated controls in the
existing checkbox-list fixture are UNRUN; its run hook still dispatches only the
original list-child selection. Native events/refs/focus/AX/layout/installed
qualification remains separate.

```tsx
import { useState } from 'octane'
import { CheckboxInput } from '@octane-xplat/ui'
export function ArchiveFilter() {
	const [include, setInclude] = useState(false)
	return <CheckboxInput label="Include archived" value={include} onChange={setInclude} />
}
```

## AppKit radio composition

RadioList options and RadioListItem children now share the group context and
controlled/uncontrolled selection. Native rows expose radio/checked/name
semantics and render descriptions/endContent. Standalone Field metadata is
stable; an enclosing Field retains ownership. The macOS root explicitly selects
the new child leaf. Held item/key handlers now read current group/row state;
mounted registration and reentry guards reject retired/nested selection.
Uncontrolled local values suppress immediate duplicates before render; controlled
parents retain feedback authority. Ordinary form groups now request selection after Arrow/
Home/End focus, with RTL horizontal keys and owned roving Tab exclusions when
the native bridges are available. Disabled/read-only groups do not install keys;
interactive trailing children keep their own keys. Native input/Tab/reveal,
VoiceOver and layout require separate target qualification; toolbar-specific navigation is still
unsupported. See
[radio choices](../../../../../docs/app/components.md#radio-choices-on-appkit). Eight
ownership cases are authored, alongside the existing composition/focus
cases. The fixture adds current blocking/value/acceptance/focus controls; its run
hook still checks direct selection only.

```tsx
import { RadioList, RadioListItem } from '@octane-xplat/ui'

export function Plan() {
	return <RadioList label="Plan" defaultValue="free">
		<RadioListItem value="free" label="Free" description="Personal use" />
		<RadioListItem value="team" label="Team" />
	</RadioList>
}
```

## AppKit checkbox-list composition

CheckboxList options and CheckboxListItem children now share selection and Field
ownership. Standalone/value-less items use controlled isChecked/onCheck, with
native mixed-state semantics. Group writes are idempotent and uncontrolled
batched requests preserve the latest set. Description/endContent, indicator
registry and class/style/divider hooks are forwarded. Native clicks/Tab, nested
controls, mixed VoiceOver and layout require separate target qualification; see
[checkbox lists](../../../../../docs/app/components.md#checkbox-lists-on-appkit).

```tsx
import { CheckboxList, CheckboxListItem } from '@octane-xplat/ui'

export function Features() {
	return <CheckboxList label="Features" defaultValue={['email']}>
		<CheckboxListItem value="email" label="Email" description="Daily summary" />
		<CheckboxListItem value="alerts" label="Alerts" />
	</CheckboxList>
}
```

## AppKit finite-option selection

Selector now passes selectionMode=multiple to the target view; MultiSelector
uses that same target container. Checkbox/select-all presentation, mixed bulk
state and native inert guards now follow the existing shared state owner.
Custom renderOption and single renderValue are used through TextSlot; unresolved
selected keys retain the summary fallback. Default option icons are rendered.

```tsx
import { MultiSelector } from '@octane-xplat/ui'

export function Channels() {
	return <MultiSelector options={[{ value: 'email', label: 'Email' }, { value: 'push', label: 'Push' }]}
		defaultValue={['email']} hasSelectAll />
}
```

Source cases mock the popup inline and require separate verification. The keyboard source path
now covers manual option focus, opening/commit, prefix/search keys and close/Tab
return intent through existing layer ownership. Actual popup/key/IME/focus and
VoiceOver behavior require separate target qualification. Alternate presentation and live announcements remain open;
ghost class forwarding is now present, with native paint unqualified. See the [AppKit selection subset](../../../../../docs/app/search-selection.md#appkit-finite-option-selection).

AppKit Selector uses native choice ordering with a Select-specific key policy:
arrows/Home/End/Page keys move focus without selection; Enter/Space commits;
Escape closes. Typing searches/cycles labels or enters the local search editor.
Editor caret/space/IME keys and modified shortcuts keep native ownership, except
nonediting multi-picker Command/Control+A bulk selection. Tab close passes the
anchor's same-window next/previous valid key view to the existing layer owner.
The key bridge is required; explicitly unavailable dispatch restores ordinary
option Tab stops. Cases/fixture require separate verification, so no native input,
focus/return, containment, scrolling or AX qualification is implied.

```tsx
import { Selector } from '@octane-xplat/ui'

export function Fruit() {
	return <Selector options={[{ value: 'apple', label: 'Apple' }, { value: 'cherry', label: 'Cherry' }]}
		searchable defaultValue="apple" />
}
```


Standalone AppKit Selector now uses FormField for metadata, while an enclosing
Field owns its text once. Stable generated/explicit control IDs, testID, hidden
names and inherited disablement/read-only state reach the retained trigger.
Ghost forwards its shared chrome class. Native geometry, label/tooltip behavior,
AX relationships and identifier replay require separate target qualification; source cases require separate verification.

```tsx
import { Selector } from '@octane-xplat/ui'

export function Region() {
	return <Selector label="Region" description="Choose a region" testID="profile.region"
		options={[{ value: 'west', label: 'West' }]} isRequired />
}
```

AppKit primary clicks now have a renderer source gate for nested controls: the
actual native hit ancestry rejects ancestor click recognition at a registered
native control, semantic widget (even disabled) or live action host. Decorative
labels/images/groups remain clickable content. Use semantic controls for nested
actions; do not attach no-op actions to layout hosts. This does not qualify
physical pointer delivery, foreign engine views or long-press arbitration.

```tsx
import { Button, ClickableCard } from '@octane-xplat/ui'

export function Entry({ open, remove }: { open(): void; remove(): void }) {
	return <ClickableCard onPress={open}><Button clickAction={remove}>Remove</Button></ClickableCard>
}
```


AppKit MultiSelector now renders triggerDisplay="badges" as keyed removable
values. Known enabled options remove through the existing state/save owner;
unlisted/disabled options retain inert controls. Removal checks current props,
selection and attachment, so cached handlers cannot edit after blocking or detach.
Native click isolation depends on the matching renderer gate and requires separate target qualification.

```tsx
import { MultiSelector } from '@octane-xplat/ui'

export function Channels() {
	return <MultiSelector triggerDisplay="badges" defaultValue={['email']}
		options={[{ value: 'email', label: 'Email' }, { value: 'push', label: 'Push' }]} />
}
```


AppKit TextInput, TextArea and SearchInput now forward testID to the editable
field. Updating/removing it keeps that field and its local text; shells, Field
labels and clear actions do not inherit it. Renderer accessibilityIdentifier
mapping is source-present; native discovery/replay requires separate target qualification.

```tsx
import { TextInput } from '@octane-xplat/ui'

export function Name() {
	return <TextInput label="Name" testID="profile.name" defaultValue="Ada" />
}
```


AppKit menus now align disabled row hosts with their metadata: actions, checkbox/
radio choices and submenus lose native activation while disabled; group radio
state applies to rows. DropdownMenu forwards button.ref and uses button.id unless
its own id is supplied. Destructive tone classes forward across row kinds.
Disabled dropdown/context/submenu surfaces are suppressed even when controlled
isOpen remains true and request onOpenChange(false); Dropdown also observes
button/ButtonGroup disablement. Dropdown trigger/arrow/dismiss requests read
current props and local open intent through one claim. Controlled parents retain
visibility and the original local seed survives mode changes. Current trigger
loading blocks opening unless interruptible; it does not dismiss existing menus.
Nested/detached requests are ignored; button-ref replacement preserves the active
claim. Errors release it without local rollback; existing Button/dismiss error
paths remain. Use the current button prop, not the old trigger spelling. See the [AppKit menu contract](../../../../../docs/app/menus.md#appkit-menu-host-state).

```tsx
import { DropdownMenu, DropdownMenuItem } from '@octane-xplat/ui'

export function Actions({ disabled }: { disabled: boolean }) {
	return <DropdownMenu isDisabled={disabled} button={{ label: 'Actions' }}>
		<DropdownMenuItem label="Remove" variant="destructive" isDisabled={disabled} />
	</DropdownMenu>
}
```

The subsequent menu-surface source path covers arrows/typeahead/submenu intent;
originless/unowned Tab return and
full menu AX roles/checked announcements remain implementation gaps; native popup/ref/focus/
input/VoiceOver behavior is unqualified. Authored inline-popup cases require separate verification.

AppKit MenuSurface now creates a target-private current-row registry in each
popup root. Manual arrows/edges/typeahead use native child order and skip blocked
rows; Enter/Space and submenu direction intents call existing row owners. Row
callbacks read current props and reject detached/disabled hosts. Initial focus
waits for the surface window, and existing choice-helper Tab-stop claims/window
observers are released on detach. Nested endContent editors keep their keys.
Use string labels for typeahead; the private registry is not a public API.

```tsx
import { DropdownMenu, DropdownMenuItem } from '@octane-xplat/ui'

export function Actions() {
	return <DropdownMenu button={{ label: 'Actions' }}><DropdownMenuItem label="Archive" /></DropdownMenu>
}
```

Escape remains owned by layer dismissal; unowned surfaces preserve native Tab. Dropdown/submenu anchor return refs do not prove cross-window
return. Closed-trigger arrow intent is now supplied by the target view-key
attachment described below; owned-dropdown Tab intent is now described below; native return requires separate target qualification.
Seven authored policy/fake-window cases require separate verification; actual keyboard/IME/focus,
popup timing/RTL provider inheritance, AX and packaging require separate target qualification. See
[AppKit menu surfaces](../../../../../docs/app/menus.md#navigate-appkit-menu-surfaces).

AppKit DropdownMenu now attaches private view-key subscriptions to its actual
Button host. Plain Down/Up on a closed enabled trigger requests first/last-row
opening, preserving the hint until controlled acceptance. Pointer/ordinary button
opening resets first-row intent. Current disabled/open state, composition,
modified/prevented events and nested endContent controls reject the arrow path.
Matching renderer observeViewKeys support is required; the helper is not a public
useKeyboard or Button API and adds no layout wrapper.

```tsx
import { DropdownMenu, DropdownMenuItem } from '@octane-xplat/ui'

export function Actions() {
	return <DropdownMenu button={{ label: 'Actions' }}><DropdownMenuItem label="Archive" /></DropdownMenu>
}
```

The dispatcher shares its existing native monitor with prop handlers and owned
subscriptions, enters renderer discrete scope, preserves same-view/ancestor
propagation semantics and releases leases on ref/node teardown. Nine authored
cases require separate verification; physical/native monitor/ref/popup/IME/focus/AX/packaging evidence
is still missing. See [trigger arrows](../../../../../docs/app/menus.md#open-an-appkit-dropdown-with-arrows).

Owned AppKit DropdownMenu/submenu Tab now resolves the outer trigger's current
same-window next/previous valid key view, records return intent and consumes the
key while requesting closure. Private return owners follow accepted ancestor
visibility: a child whose parent stays open returns to that parent's row; after
the chain closes its ref delegates to the root neighbor. No eager makeFirstResponder
is added to the menu handler. ContextMenu now supplies return intent for valid invokers; originless/unowned
surfaces keep native Tab fallback, as described below.

```tsx
import { useState } from 'octane'
import { DropdownMenu, DropdownMenuItem } from '@octane-xplat/ui'

export function Actions() {
	const [open, setOpen] = useState(false)
	return <DropdownMenu isOpen={open} onOpenChange={setOpen} button={{ label: 'Actions' }}>
		<DropdownMenuItem label="Archive" />
	</DropdownMenu>
}
```

The target layer focus adapter restores an explicit live native target in its own
window; fallback ownership cannot follow a moved view. Shared field editors map
back to controls. Native-backed handles receive attachment checks; explicit opaque focus delegates
keep caller-owned behavior whose attachment cannot be inspected.  Actual layer cleanup/window timing, native traversal/focus, modal/
FocusScope and AX behavior require separate target qualification; see [owned Tab return](../../../../../docs/app/menus.md#leave-an-owned-appkit-dropdown-with-tab).

AppKit ContextMenu now handles Shift+F10 or plain Context Menu key intent from a
still-owned focused descendant.
It stores the concrete invoker and reuses the menu return owner for ordinary and
Tab/Shift-Tab intent. Visible triggers supply a fallback invoker and now wrap
primitive content through TextSlot. Label fallback and expanded/disabled wrapper
metadata are forwarded. Origin checks reject detached, moved, hidden or blocked
hosts while preserving explicitly focusable disabled-card claims.

```tsx
import { Button, ContextMenu, DropdownMenuItem } from '@octane-xplat/ui'

export function Document() {
	return <ContextMenu label="Document actions" trigger="Actions" menu={<DropdownMenuItem label="Archive" />}>
		<Button label="report.txt" clickAction={() => console.log('select')} />
	</ContextMenu>
}
```

Use trigger content for ContextMenu; only DropdownMenu accepts button. Long-press-
only menus without a live invoker keep native Tab fallback. Six authored cases
require separate verification; native key/gesture/ref/IME/focus/AX/packaging behavior is unqualified.
Dedicated Context Menu key normalization now has a source path; actual hardware
delivery requires separate target qualification. See [context keyboard intent](../../../../../docs/app/menus.md#open-appkit-context-actions-from-the-keyboard).

AppKit ContextMenu also owns secondary-click and plain Control-primary-click
through a private renderer lease. Require the matching renderer; older bridges
retain keyboard, visible-trigger and long-press paths. Nearest live context scope
wins; disabled/stale scopes decline and ordinary or additionally modified primary
clicks keep their existing path. Pointer modality is observed before consumption.

```tsx
import { Button, ContextMenu, DropdownMenuItem } from '@octane-xplat/ui'

export function Document() {
	return <ContextMenu trigger="Actions" menu={<DropdownMenuItem label="Archive" />}>
		<Button label="report.txt" clickAction={() => console.log('select')} />
	</ContextMenu>
}
```

Decorative hits choose an eligible focusable ancestor for return, then the visible
trigger; originless surfaces keep native Tab fallback.  Physical clicks, primary-action suppression, monitor/ref/focus timing, AX,
IME and packaging require separate target qualification. See [pointer context intent](../../../../../docs/app/menus.md#open-appkit-context-actions-with-the-pointer).

The AppKit renderer maps HIToolbox's Context Menu virtual key and AppKit's menu
function character to the existing NativeKeyboardEvent key="ContextMenu". No
physical code is invented when only the function character identifies the key.
ContextMenu uses the same owned invoker path as Shift+F10, without accepting Shift,
Control, Option or Command combinations on the dedicated key.

```tsx
import { Button, ContextMenu, DropdownMenuItem } from '@octane-xplat/ui'

export function Document() {
	return <ContextMenu trigger="Actions" menu={<DropdownMenuItem label="Archive" />}>
		<Button label="report.txt" clickAction={() => console.log('select')} />
	</ContextMenu>
}
```

 SDK
source evidence is not physical keyboard, native focus/IME/AX or packaging proof.
See [dedicated Context Menu key](../../../../../docs/app/menus.md#use-a-dedicated-context-menu-key-on-appkit).

AppKit menu roles now map to AXMenu/AXMenuItem. Menu row labels also provide native
titles, including current link labels. Selected/expanded query state uses the
native isAccessibilitySelected/isAccessibilityExpanded getters and follows parent
feedback. Plain action dispatch does not change those values.

```tsx
import { DropdownMenu, DropdownMenuItem, DropdownMenuSubMenu } from '@octane-xplat/ui'

export function Actions() {
	return <DropdownMenu button={{ label: 'Actions' }}>
		<DropdownMenuItem label="Archive" />
		<DropdownMenuSubMenu label="More"><DropdownMenuItem label="Export" /></DropdownMenuSubMenu>
	</DropdownMenu>
}
```

Do not treat the role mapping as checked-menu or VoiceOver support. Menu mark
attributes, expanded-state notifications and complete shown-menu/selected-child
relationships remain gaps; checked state is separate from selected state.  Native bridge/query/tree,
VoiceOver, focus and packaging qualification remains open. See [menu metadata](../../../../../docs/app/menus.md#appkit-menu-accessibility-metadata).

## AppKit dynamic-menu focus repair

MenuSurface now owns previous eligible-row order and captured row/window intent.
Registered row detach notifies before removal; disabled-row and surface commits
coalesce refresh after native updates. Removed/disabled/hidden focused rows
request the row now at the prior index (clamped to the last), or the retained
container when empty. Focus changes alone never select. Captured same-window
container/window/null fallback is allowed; unrelated/nested-editor responders
cancel repair. Scope changes, hidden/detached roots and missing bridges release
stale intent/claims. Ref teardown and recursive native updates cannot resurrect
an old focus request.

```tsx
<DropdownMenu button={{ label: 'Actions' }}>
	{show && <DropdownMenuItem label="Remove action" hasCloseOnSelect={false} onSelect={() => setShow(false)} />}
	<DropdownMenuItem label="Continue" hasCloseOnSelect={false} />
</DropdownMenu>
```

 Source ownership is not native ref/responder/fallback/
notification/IME/layer/scroll/AX/package qualification. See [dynamic menu focus](../../../../../docs/app/menus.md#keep-focus-owned-when-appkit-menu-rows-change).

## Native AppKit context-menu ownership

Use AppKitContextMenu from @octane-xplat/context-menu/macos in macOS files for
the platform's serialized flat menu. It reuses the renderer-installed NSMenu
attachment; exact native action metadata was repaired in the renderer first.
Primitive item snapshots detect changes even if an item object is mutated.
Equal-content arrays and current callback changes preserve tracking; item/scope/
view changes and unmount retire old callbacks before cleanup. Give reused rows a
record-specific id or remount for a different record. IDs must be unique strings;
titles must be strings. Empty lists remove this custom menu, invalid/unavailable attachment
shows a generic message. Ignore disabled/removed/unknown/stale/reentrant actions.

```tsx
// NoteActions.macos.tsx
import { AppKitContextMenu } from '@octane-xplat/context-menu/macos'
import { Text } from '@octane-xplat/ui'
export function NoteActions({ noteID }: { noteID: string }) {
	return <AppKitContextMenu id={`actions-${noteID}`} items={[{ id: 'rename', title: 'Rename' }]}
		trigger={() => <Text>Right-click this note</Text>} onItemSelected={(id) => console.log(noteID, id)} />
}
```

Attach only at the wrapper. AppKit documents unhandled right-click propagation;
inference: native descendants that forward unhandled events can use ancestor menus
without a one-time subtree overwrite. Preserve child editing/nested menus and
foreign slots; cancel owned tracking and restore prior active menus, skipping
retired attachments. Partial failures deregister actions; native enablement and
window/menu ownership guard dispatch. No public gesture/preview/submenu API or
destructive-row styling is added.  Native pointer/Control-click, keyboard/AX menu
actions, custom responder routing, timer progress while tracking, cancellation,
native BOOL, actual hook/ref/effect timing and installed consumers remain
unqualified. No dependency/public prop/React Aria presence change. See
[native menu workflow](../../../../../docs/platform/context-menu.md#native-macos-menus).

## Native AppKit ID picker

For a native noneditable pop-up button, use `AppKitPicker` from
`@octane-xplat/picker/macos` in a macOS leaf. The renderer-installed bridge
reuses the raw list-picker's NSPopUpButton allocation; it does not import mobile
adapters. Supply unique string option IDs and string titles; repeated/empty
titles and an empty ID are valid. Controlled `selection` must match a nonempty
list; callbacks report enabled user choices and a rejected value is restored.
Missing controlled IDs/invalid choices show a generic message, repaired through
props. Empty/all-disabled lists are nonselectable. Disabled saved values can
still display. Classes/styles apply to the outer labeled field.

```tsx
// BagPicker.macos.tsx
import { useState } from 'octane'
import { AppKitPicker } from '@octane-xplat/picker/macos'
export function BagPicker() {
	const [selection, setSelection] = useState('carry')
	return <AppKitPicker label="Bag" selection={selection} onSelectionChange={setSelection}
		options={[{ id: 'carry', title: 'Carry-on' }, { id: 'checked', title: 'Checked bag' }]} />
}
```

Uncontrolled `defaultSelection` seeds once per record id, including across an
initially empty list. Later defaults do not reset selection; reorder/rename/view
replacement preserves IDs. A missing/removed uncontrolled ID silently falls back
to the first enabled choice. Change `id` when a retained field changes records
to retire callbacks and reseed. Primitive snapshots catch in-place mutations;
equal options preserve the native menu, while changes/teardown cancel owned
tracking and retire old epochs/actions. Programmatic, stale, disabled, duplicate
and reentrant events do not emit. Source implementation only: eight owner/seven
actual renderer-branch cases, idle probe, packed-consumer lane and native demo
require separate verification. Keyboard/pointer, menu-loop timers, BOOL, focus/Tab, AX, layout,
native lifecycle and installed consumers require separate target qualification. See
[native selection](../../../../../docs/platform/native-picker.md#native-macos-selection).

```tsx
// RecordPicker.macos.tsx
import { AppKitPicker } from '@octane-xplat/picker/macos'
export function RecordPicker({ recordID }: { recordID: string }) {
	return <AppKitPicker id={`bag-${recordID}`} label="Bag" defaultSelection="carry"
		options={[{ id: 'carry', title: 'Carry-on' }, { id: 'checked', title: 'Checked bag' }]} />
}
```

## AppKit source-owned public Popover

The macOS root Popover, ComplexSelector and Tokenizer's outer unfocusedLayer
editor now select the canonical Popover leaf. It portals from the declaring
tree into the existing staged same-window layer, preserving providers and their
updates; no standalone content root or inline fallback is used. Keep a stable
native anchor ref. Physical placement/alignment and numeric/px offset use the
shared position helper. Controlled outside/Escape dismissal requests do not close
until accepted; defaultOpen owns uncontrolled dismissal. Hidden/detached/window-
retired anchors cancel the current presentation; close/open rearms it.

```tsx
<Popover anchor={anchor} open={open} onDismiss={() => setOpen(false)}
	placement="bottom" alignment="center" offset={12}>
	<Text>Current provider-backed details</Text>
</Popover>
```

Require the source-outlet/staged showLayer bridge; missing capability fails
explicitly. Scope and observer acquisition are captured, retirement precedes
cleanup, and stale/late commits/handles cannot reopen a replacement. Eight owner
and three source-portal cases are authored. General useLayer/hover roots,
direct Tooltip NSPopovers and Overlay remain separate contracts. No focus trap
or automatic editor focus is added. Actual native ref/portal/context/commit,
geometry/RTL/scroll, nested blur/dismissal, OS input/IME/Tab/focus, VoiceOver and
installed consumers require separate target qualification; see [native custom popovers](../../../../../docs/app/search-selection.md#anchor-appkit-custom-popovers).
