# Enter and submit text

> Add a text field, keep what someone types, and choose how they submit it.

Start with [a working app](../start/toolchain.md#create-and-run) and the
[component example](primitives.md#a-practical-example) if you're new to
state and callbacks.

For a complete labeled form with validation, focus and announcement checks,
follow [Build and test an accessible screen](accessibility.md).

## Control a field

A **controlled field** gets its current text from your app. `value` tells
it what to display; `onChange` gives your app the new text when someone
edits it. Store that text in state and pass it back as `value`.
`TextInput` is for one line, `TextArea` for several lines, and
`SearchInput` for searching.

```tsx
import { TextInput } from '@octane-xplat/ui'
import { useState } from 'octane'

export function Example() {
	const [name, setName] = useState('')

	return <TextInput label="Name" value={name} onChange={setName} />
}
```

In the example, `name` holds the text and `setName` changes it. Clear sets
it to an empty string. Done calls `blur()`, which removes focus from the
field and dismisses a phone's keyboard. A handle lets your code call those
field actions; `useRef` keeps the handle available to the button.

```tsx
import { useRef, useState } from 'octane'
import { Field, KeyboardAvoiding, Pressable, Text, TextInput } from '@octane-xplat/ui'
import type { TextInputHandle } from '@octane-xplat/ui'

export function NameForm() {
	const [name, setName] = useState('')
	const input = useRef<TextInputHandle | null>(null)

	return (
		<KeyboardAvoiding>
			<Field label="Name" isOptional>
				<TextInput value={name} onChange={setName} ref={input} />
			</Field>
			<Pressable onPress={() => setName('')}>
				<Text>Clear</Text>
			</Pressable>
			<Pressable onPress={() => input.current?.blur()}>
				<Text>Done</Text>
			</Pressable>
		</KeyboardAvoiding>
	)
}
```

Type a name, press Clear, and check that the field is empty. On a phone,
press Done and check that the keyboard closes. Programmatically setting
`value` does not call `onChange`; that callback reports user edits.
`TextInput`, `TextArea`, and `SearchInput` can also keep their own text when
you supply `defaultValue` instead of controlling `value`. When both are set,
`value` wins; `onChange` still reports each edit — setting `value` from code
never calls it.

```tsx
import { SearchInput } from '@octane-xplat/ui'

export function Example() {
	return <SearchInput label="Search items" defaultValue="coat" />
}
```

`TextInput`, `TextArea`, and `SearchInput` accept the shared field props:
`label`, `description`, `isLabelHidden`, `isDisabled`, `isReadOnly`,
`isRequired`, `isOptional`, `size`, `status`, and `isLoading`. A standalone
`TextInput` draws its own field: the `label` above the box, the `description`
under the label, and the `status` message attached below the box. Tapping the
label focuses the input. Inside `Field`, the wrapper draws those parts instead
and the control renders only the box, so you never get two labels. `hasClear` is opt-in on `TextInput` and defaults
to the existing clear behavior on `SearchInput`. `isLoading` announces busy
work and does not disable editing. Avoid replacing the native view through the
handle: use `value` to change its text.

```tsx
import { Field, TextInput } from '@octane-xplat/ui'
import { useState } from 'octane'

export function Example() {
	const [name, setName] = useState('')

	return (
		<Field
			label="Name"
			description="Shown on your profile"
			isRequired
			status={{ type: 'warning', message: 'Check the spelling' }}
		>
			<TextInput value={name} onChange={setName} hasClear isLoading size="sm" />
		</Field>
	)
}
```

## Preserve editing and submit deliberately

An **IME** is a keyboard input method that can compose a character over
several keystrokes, such as for Japanese text. Let the user finish that
composition before formatting or replacing the field's text.

Matching controlled values skip native text writes. Android selection is
restored and clamped when a changed value must be written. This regression
coverage does not prove marked-text composition: avoid rewriting or formatting
the value during composition, and validate with the actual keyboards your
users need.

`TextInput` and `SearchInput` submit on Enter. `TextArea` keeps ordinary
Return as a newline: web submits with Cmd/Ctrl+Enter, and native submits only
with `returnKeyType="done"` or `"send"`. Web Enter that confirms a composition
does not submit. Verify one callback per edit and no callback for a controlled
reset; type in the middle of a selection as well as at the end of a field.

```tsx
import { TextInput, SearchInput, TextArea } from '@octane-xplat/ui'
import { useState } from 'octane'

export function Example() {
	const [name, setName] = useState('')

	return (
		<>
			<TextInput
				label="Name"
				value={name}
				onChange={setName}
				onSubmit={() => console.log('Submitted')}
			/>
			<SearchInput label="Search" onSubmit={() => console.log('Submitted')} />
			<TextArea
				label="Message"
				value={name}
				onChange={setName}
				returnKeyType="send"
				onSubmit={() => console.log('Submitted')}
			/>
		</>
	)
}
```

## Release and restore focus

Keep the `ref` handle for `focus()` and `blur()`. `blur()` dismisses the
native keyboard; on Android it also clears EditText focus. After closing a
native overlay, explicitly focus the field or action that should resume
editing. Automatic native overlay focus restoration and isolation remain
unverified.

```tsx
import { TextInput, Pressable, Text } from '@octane-xplat/ui'
import { useState, useRef } from 'octane'

export function Example() {
	const [name, setName] = useState('')
	const input = useRef<import('@octane-xplat/ui').TextInputHandle | null>(null)

	return (
		<>
			<TextInput
				label="Name"
				value={name}
				onChange={setName}
				ref={(handle) => {
					input.current = handle
				}}
			/>
			<Pressable onPress={() => input.current?.focus()}>
				<Text>Edit</Text>
			</Pressable>
			<Pressable onPress={() => input.current?.blur()}>
				<Text>Done</Text>
			</Pressable>
		</>
	)
}
```

`KeyboardAvoiding` adds only the keyboard space its own host still needs.
It requests Android window resize and measures the remaining overlap, so
a resized host receives no duplicate keyboard padding.
`keyboardVerticalOffset` holds contents extra dips above the
keyboard's top edge — the height of a composer bar that sits inside the
wrapper, for example — and `enabled={false}` keeps the layout wrapper with
no avoidance subscription or resize lease. When the wrapper sits inside a
`SafeArea`, the bottom space that wrapper already applied counts toward
avoidance. Nested avoidance wrappers in the same native window also share
that space. Floating keyboards do not add full-width bottom padding. Bottom-anchored
native shared sheets also account for the keyboard;
the Android inset fallback converts physical pixels into layout dips. Check
the last field with the software keyboard open, including a sheet opened
while the keyboard is already visible. Observer/property tests alone do not
verify viewport behavior on a device.

```tsx
import { KeyboardAvoiding, TextInput } from '@octane-xplat/ui'
import { useState } from 'octane'

export function Example() {
	const [note, setNote] = useState('')

	return (
		<KeyboardAvoiding keyboardVerticalOffset={8}>
			<TextInput label="Note" value={note} onChange={setNote} />
		</KeyboardAvoiding>
	)
}
```

On web, shared `BottomSheet` with its default shade, and
`Overlay` with `shadeCover`, move focus into the panel, cycle Tab inside it,
dismiss on Escape, and restore a connected trigger when closed. Nested modals
isolate the top panel. Background portals become inert too. A nonmodal surface
without a shade does not take over focus. Give a BottomSheet a name through
`label="Edit name"` and provide a visible close action. Pass
`finalFocusRef={triggerRef}` when pointer input may open the sheet and the
browser does not focus the trigger automatically.

The separate `@octane-xplat/sheet/web` leaf has its own Playwright keyboard,
focus-return, dismissal, and drag check across Chromium, Firefox, and WebKit;
the shared BottomSheet results do not cover that implementation. Neither check
qualifies actual screen-reader speech or iOS Safari.

```tsx
import { Screen, BottomSheet, Pressable, Text } from '@octane-xplat/ui'
import { useState } from 'octane'

export function Example() {
	const [open, setOpen] = useState(false)

	return (
		<Screen>
			<Pressable onPress={() => setOpen(true)}>
				<Text>Edit name</Text>
			</Pressable>
			<BottomSheet
				label="Edit name"
				isOpen={open}
				onOpenChange={setOpen}
				web={{ 'aria-label': 'Edit name' }}
			>
				<Pressable onPress={() => setOpen(false)}>
					<Text>Close</Text>
				</Pressable>
			</BottomSheet>
		</Screen>
	)
}
```

## Verification boundaries

The maintained [Chromium fixture](../../apps/web/test/input-readiness.web.tsrx)
and [runner](../../apps/web/scripts/input-readiness.ts) exercise real browser
keyboard typing, selection replacement, controlled callback counts, modal
focus, accessibility-tree exclusion, and exiting Presence input/reversal.
Framework contributors can run it from the Octane Xplat repository root
with dependencies and the Playwright Chromium browser installed:

```sh
pnpm exec turbo run input:readiness --filter=@xplat/web
```

This is a repository harness check, not a command included in a created app.
It uses an OS-assigned port and captures no images.

Native object-driver tests cover controlled echoes, blur handles, disabled
state mappings, and keyboard-inset units. They do not exercise the OS IME,
touch hit-testing, VoiceOver, or TalkBack. Check those on a simulator/device
with the target lock held, without resetting another session. Current
runtime evidence and exact remaining cases belong in
[input readiness notes](../../.agents/docs/notes/input-readiness-notes.md).

## Read software keyboard space

Use `useKeyboardInset()` when a composer needs a numeric keyboard height,
for example to choose a sheet's height. The value is in device-independent
pixels (points on iOS). On iOS, a reader can measure an already-open keyboard
through the public keyboard guide when available. Older hosts without that
guide need a reader mounted before the keyboard opens.
Web and desktop return zero; this hook does not measure a browser viewport.

```tsx
import { Text, View, useKeyboardInset } from '@octane-xplat/ui'

export function KeyboardSpace() {
	const inset = useKeyboardInset()

	return (
		<View>
			<Text>Keyboard space: {inset}</Text>
		</View>
	)
}
```

On Android the hook requests window resizing while at least one reader is
mounted. The returned number excludes system bars and is zero until window
insets are available. Without AndroidX inset support, resizing still runs
but the number stays zero. A resized window already
avoids the keyboard: do not add this number again as bottom padding. Readers
share ownership, and the last reader restores the prior `softInputMode` only
if another owner has not changed it. If Android resumes a different Activity
(a native screen with its own window), the reader rebinds automatically.

```tsx
import { KeyboardAvoiding, TextInput } from '@octane-xplat/ui'

export function MessageForm() {
	return (
		<KeyboardAvoiding>
			<TextInput placeholder="Message" />
		</KeyboardAvoiding>
	)
}
```

For native motion tracking, use the optional package in
[Follow the phone keyboard](./software-keyboard.md).

The maintained [keyboard-space example](../../packages/ui/examples/KeyboardSpaceDemo.tsrx)
includes a tracking toggle. Subscription tests cover window changes and cleanup;
actual Activity replacement still needs separate device qualification.

`KeyboardAvoiding` uses the same native subscription — pass
`enabled={false}` there or `useKeyboardInset({ enabled: false })` here to
leave it inactive. It adds space below its contents only for remaining host
overlap, after native resizing and ancestor avoidance. iOS readers and bound
bottom overlays share the latest frame while at least one stays mounted.
After all detach, the observer and cached frame are released. Floating or
narrow iOS keyboards report a zero bottom inset; keeping a specific field clear
of a floating keyboard needs a rectangle-based visibility check.

```tsx
import { KeyboardAvoiding, Text, TextInput, useKeyboardInset } from '@octane-xplat/ui'

export function Composer() {
	const inset = useKeyboardInset()

	return (
		<KeyboardAvoiding>
			<Text>Keyboard space: {inset}</Text>
			<TextInput placeholder="Write a message" />
		</KeyboardAvoiding>
	)
}
```

The maintained subscription tests cover frame changes, hide, multiple readers,
cleanup, unit conversion, and resize ownership using host doubles. Packed
consumer checks cover imports and the numeric type. These do not establish
OS keyboard delivery, floating-keyboard behavior, or dock positioning on a
real iOS or Android host.

## Keep AppKit text actions owned by the current field

Experimental AppKit TextInput, TextArea and SearchInput now check current
editable state and callbacks before accepting an edit. Disabled/read-only fields,
removed fields and nested edits from an active callback cannot change local text.
Composition continues to report draft edits; submit and clear wait until marked
text is committed. TextArea still submits only for `done` or `send` return keys.

```tsx
import { TextInput, TextArea } from '@octane-xplat/ui'
export function DraftForm() {
	return <>
		<TextInput label="Name" defaultValue="Ada" hasClear
			onChange={(text) => console.log('Draft:', text)}
			onClear={() => console.log('Cleared')}
			onSubmit={() => console.log('Submit name')} />
		<TextArea label="Message" returnKeyType="send"
			onSubmit={() => console.log('Send message')} />
	</>
}
```

An accepted clear calls its original `onChange('')`, then `onClear`, even if the
first callback replaces props or removes the field. A controlled parent still
owns the displayed text. Refocus afterward requires the same attached input,
window, responder and editable state, so moving focus in a callback takes
precedence. Public handles follow the current native host and become inert
after removal; read-only fields can request focus, while disabled fields cannot.

```tsx
import { useRef, useState } from 'octane'
import { TextInput } from '@octane-xplat/ui'
import type { TextInputHandle } from '@octane-xplat/ui'
export function ClearAndMove() {
	const [query, setQuery] = useState('recent')
	const next = useRef<TextInputHandle | null>(null)
	return <>
		<TextInput label="Query" value={query} onChange={setQuery} hasClear
			onClear={() => next.current?.focus()} />
		<TextInput label="Next field" ref={next} />
	</>
}
```

Ten [object-driver cases](../../packages/ui/src/components/forms/text-entry-ownership.macos.mobile.test.tsrx)
and a [manual fixture](../../examples/probes/text-entry-ownership.macos.tsrx) are
authored, all unrun. These source guards do not prove actual native editing,
IME, caret/selection, Return/clear hit-testing, focus/notification ordering,
accessibility or packaged behavior. Existing `isLoading` behavior remains busy
announcement without disabling editing. TextInput/TextArea have no public
`hasAutoFocus` prop; this change adds none.

## Keep pending AppKit values with their field

In the experimental AppKit source path, a controlled value waits while the
native editor has marked text. A newer value, matching edit echo, removed value
or removed field supersedes that pending work. Observer/timer cleanup now
retires the old work before releasing it, so cleanup cannot overwrite a newer
value or erase its owner. Keep the app value in state as usual:

```tsx
import { useState } from 'octane'
import { TextInput } from '@octane-xplat/ui'

export function NameField() {
  const [name, setName] = useState('Ada')
  return <TextInput label="Name" value={name} onChange={setName} />
}
```

Failed deferred writes keep the pending value for a later prop update or commit
notification to retry. They use fixed diagnostics without including the native
error payload or entered text. Immediate native read/setter failures still
propagate to the caller. This shared path covers TextInput, TextArea and
SearchInput; real IME candidate timing, caret/selection, window moves, undo/redo,
VoiceOver and installed apps remain unqualified. Fourteen writer/adapter source
cases and the extended manual fixture are authored but unrun.

```tsx
import { useState } from 'octane'
import { SearchInput } from '@octane-xplat/ui'

export function QueryField() {
  const [query, setQuery] = useState('recent')
  return <SearchInput label="Search" value={query} onChange={setQuery} />
}
```
