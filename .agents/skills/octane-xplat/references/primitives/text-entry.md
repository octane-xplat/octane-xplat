# Text entry and editing

Use for AppKit editing, submission, composition, multiline sizing, number fields, and PIN ownership. Apply [native interaction prerequisites](accessibility.md); experimental Windows controls have a [separate page](windows.md).

## AppKit multiline submission

Use `returnKeyType="done"` or `"send"` with `TextArea.onSubmit`; other Return
keys keep newline behavior. Disabled/read-only controls suppress edit/submit
callbacks. The multiline native delegate does not consume Return while marked
text is present. This source guard is not real IME or OS-keyboard qualification;
see [text entry](../../../../../docs/app/primitives.md#text-and-keyboard-actions).

```tsx
import { TextArea } from '@octane-xplat/ui'

export function Composer() {
	return <TextArea returnKeyType="send" onSubmit={() => console.log('Send')} />
}
```


AppKit text controls now create a native Field for standalone label/description/
status/width props, and reuse the surrounding Field when present. Keep status
and descriptions on that enclosing Field when it owns the form. Field's default
layout is a column; inline CSS strings remain supported. Native layout, label
interaction and VoiceOver still require qualification.

```tsx
import { Field, TextInput } from '@octane-xplat/ui'

export function AccountName() {
	return <Field label="Name" description="Shown publicly">
		<TextInput />
	</Field>
}
```


AppKit TextInput renders `startIcon` as a registered glyph name or supplied node;
SearchInput uses that path for the default/custom icon and omits it for
`icon={false}`. Its omitted placeholder remains absent. Placeholder text color
is forwarded by TextInput and merged beneath authored TextArea styles. Removing
the TextArea prop releases its default; authored placeholderColor still wins.
Native placeholder color, glyph layout/accessibility require separate target qualification;
see [search fields](../../../../../docs/app/primitives.md#when-a-screen-needs-more).

```tsx
import { SearchInput, TextArea } from '@octane-xplat/ui'

export function Search() {
	return <>
		<SearchInput label="Find" icon={false} placeholder="Search by name" />
		<TextArea label="Note" placeholder="Add a note" placeholderTextColor="#68707e" />
	</>
}
```

## AppKit multiline length limits

`TextArea.maxLength` bounds committed user edits in UTF-16 units, preserving
text outside a paste/replacement and avoiding split surrogate pairs. Marked text
can exceed the limit until commit. Programmatic initial/external values remain
untouched; omit the cap to remove it. This is not a grapheme count. Native IME,
undo/redo, selection and correction-event timing require separate target qualification; see
[growing a multiline field](../../../../../docs/app/primitives.md#grow-a-multiline-field).

```tsx
import { TextArea } from '@octane-xplat/ui'

export function ShortNote() {
	return <TextArea label="Short note" maxLength={80} />
}
```

## AppKit multiline sizing ownership

TextArea rows/autoGrow/maxRows and its scrollable document already have native
source paths; do not infer their absence from prop-loop continue branches.
Own resize observation before cleanup/registration, capture the center/remover/
token and exact editor/viewport/clip/document, and suppress setup/retired callbacks.
Retire before other destroy effects; fitting rechecks scope after native layout/
constraint effects before later editor/frame writes. Preserve current geometry,
text limits, submit/composition and editing behavior. Do not restore shared frame-
notification flags during cleanup. Initial applyProps performs the initial fit.

```tsx
import { TextArea } from '@octane-xplat/ui'
export function NoteEditor(props: { shown: boolean; value: string; change(value: string): void }) {
	return props.shown ? <TextArea label="Note" value={props.value} onChange={props.change}
		autoGrow rows={2} maxRows={4} /> : null
}
```

Eleven new source/VM cases and added width/cap/growth/removal controls in the
existing text-entry ownership fixture are UNRUN. Native add throwing without a
returned handle and failed removal cannot prove resource recovery; automatic
external clip/document migration is unqualified. No native measurement/scroll/
IME/undo/focus/AX/memory/installed or visual claim follows from these guards.
See [growth ownership](../../../../../docs/app/primitives.md#keep-appkit-growth-with-its-editor)
and [renderer contract](../../../../../packages/macos-renderer/README.md#own-multiline-resize-observation).

## Controlled AppKit text during composition

TextInput/TextArea (and delegated SearchInput) keep a differing value pending
while the native editor has marked text. The latest controlled prop applies
after commit unless a newer matching echo cancels it; removing/unsetting the
value cancels pending work. Writes reuse the host and clamp selection when the editor identity survives. Raw `<searchbar text>` shares marked-text deferral but emits property-change
events for changed programmatic writes; dropping `text` requests an empty string,
not an uncontrolled handoff. Actual IME, focus, selection,
window changes and packaging still require qualification; see
[text actions](../../../../../docs/app/primitives.md#text-and-keyboard-actions).

```tsx
import { TextArea } from '@octane-xplat/ui'

export function Draft({ value, onChange }: { value: string; onChange(value: string): void }) {
	return <TextArea label="Draft" value={value} onChange={onChange} />
}
```


```tsx
/** @jsxImportSource @octane-xplat/jsx */
export function RawSearch({ query, onQuery }: { query: string; onQuery(value: string): void }) {
	return <searchbar text={query} onTextChange={(event) => onQuery(event.value)} />
}
```

The writer now owns pending intents, observation/schedule acquisition and registry
initialization/retirement before side effects. Retired/held callbacks cannot
overwrite replacement work; cleanup tombstones both records before attempting
both releases, and late returned handles receive one release attempt. Synchronous read/setter
errors still propagate; deferred faults use fixed diagnostics without error/input
payloads and retain explicit later update/commit retry. Failed task/write attempts
retire window observation to avoid repeated update-driven retries. Missing-window
observation returns no handle, allowing later acquisition. Fourteen source cases
and an extended idle fixture require separate verification. Native observer migration, unreturned
handles on registration throws, actual IME/caret/undo/AX/memory/installed behavior
remain open. See [pending values](../../../../../docs/app/text-entry.md#keep-pending-appkit-values-with-their-field).

```tsx
import { TextInput } from '@octane-xplat/ui'
export function CurrentName(props: { name: string; onChange(value: string): void }) {
  return <TextInput value={props.name} onChange={props.onChange} />
}
```

## AppKit number fields

NumberInput now wires `units`, `formatValue`, `hasNumberSteppers` and `hasClear`
on AppKit. Clear reports null then onClear. Stable Field ownership supplies
metadata and inherited disabled/read-only state, including stepper blocking.
Held edit/step/clear actions read current props; local intent updates before
render, while controlled values require parent feedback. One claim rejects
cross-action reentry and detached/blocked requests. Hidden step/clear affordances
reject held actions. Steps and clear defer during marked editor text; drafts
still report. Clear captures onValueChange(null) then onClear across replacement
or detach; consumer errors propagate after releasing the claim and a throwing
onValueChange skips onClear. No keyboard spinner behavior is added.
Formatting is display-only; the existing parseFloat edit behavior is unchanged.
Native layout, formatted edits, IME, focus and accessibility require separate target qualification.
See [AppKit number fields](../../../../../docs/app/components.md#number-fields-on-appkit).

```tsx
import { NumberInput } from '@octane-xplat/ui'

export function Quantity() {
	return <NumberInput label="Quantity" defaultValue={2} min={0} max={9}
		units="kg" hasClear hasNumberSteppers={false} />
}
```

## AppKit text clear focus

TextInput/SearchInput clear now requests focus on the retained native input after
onChange('') and onClear. Controlled parents still own value feedback. Refocus
requires the same attached input/window/responder and current editable state;
callback-driven focus choices and teardown win. Actual focus/caret/IME and
clear hit testing require separate target qualification. See
[clear and continue](../../../../../docs/app/primitives.md#clear-and-continue-typing-on-appkit).

```tsx
import { SearchInput } from '@octane-xplat/ui'

export function Search() {
	return <SearchInput label="Find records" hasClear defaultValue="recent" />
}
```

## AppKit PIN field ownership

PinInput now resolves inherited Field gates/metadata, gives each cell a unique
ID and digit name, and cancels pending focus when blocked. One stable Field owns
standalone metadata. Shared last-character paste and suffix-truncation editing
remain unchanged. Plain empty-cell Backspace now requests previous-cell focus
without changing the code; filled cells/IME/modified keys keep editor ownership.
OTP autofill and native focus/IME/secure/
VoiceOver qualification remain open. See
[PIN fields](../../../../../docs/app/primitives.md#pin-fields-on-appkit).

```tsx
import { PinInput } from '@octane-xplat/ui'

export function Code() {
	return <PinInput label="Account code" description="Enter four characters" length={4} />
}
```

## AppKit plain text edit ownership

TextInput/TextArea now share a private target-local edit owner, also used by
SearchInput through TextInput. Held handlers read current props/inherited blocking,
callback and return-key policy. Mounted-host/reentry guards prevent retired or
nested edits. Rapid uncontrolled edits update a local text record before render.
Composition still reports draft changes; submit/clear wait for unmarked text,
including the NSTextView itself and the NSTextField's current editor.

```tsx
<TextInput label="Name" defaultValue="Ada" hasClear onChange={saveDraft}
	onClear={recordClear} onSubmit={submitName} />
<TextArea label="Message" defaultValue="Hello" returnKeyType="send" onSubmit={send} />
```

An accepted clear captures its onChange/onClear pair; parent callback replacement
or teardown does not redirect the second callback. UI/focus work afterward needs
current attachment/blocking/responder ownership. One stable live handle supports
ref replacement, guarded native focus and foreign-responder-safe blur. Read-only
fields may request focus; disabled fields do not. isLoading remains descriptive.
Ten object-driver cases and a manual fixture are authored. Native editing,
IME/caret/Return/clear/focus ordering, accessibility and packaging are unqualified.
See [AppKit edit ownership](../../../../../docs/app/text-entry.md#keep-appkit-text-actions-owned-by-the-current-field).
