# Enter and submit text

> Add a text field, keep what someone types, and choose how they submit it.

Start with [a working app](toolchain.md#create-and-run) and the
[component example](primitives.md#a-practical-example) if you're new to
state and callbacks.

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
`SearchInput` can also keep its own value when you supply `defaultValue`
instead of controlling `value`.

```tsx
import { SearchInput } from '@octane-xplat/ui'

export function Example() {
	return <SearchInput label="Search items" defaultValue="coat" />
}
```

`TextInput`, `TextArea`, and `SearchInput` accept the shared field props:
`label`, `description`, `isLabelHidden`, `isDisabled`, `isReadOnly`,
`isRequired`, `isOptional`, `size`, `status`, and `isLoading`. Labels are
optional for composition inside `Field`; the wrapper renders the visible label,
description, and status text, and connects them to the child control. A
standalone control's `label` supplies its accessible name. `hasClear` is opt-in on `TextInput` and defaults
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
				bind={(handle) => {
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

`KeyboardAvoiding` adds keyboard space on iOS and requests Android window
resize. Bottom-anchored native shared sheets also account for the keyboard;
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
		<KeyboardAvoiding>
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
`web={{ 'aria-label': 'Edit name' }}` and provide a visible close action.
The separate `@octane-xplat/sheet` leaf's `BottomSheet` still needs its own
keyboard-focus qualification; shared BottomSheet results do not cover it.

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

The maintained [Chromium fixture](../apps/web/test/input-readiness.web.tsrx)
and [runner](../apps/web/scripts/input-readiness.mjs) exercise real browser
keyboard typing, selection replacement, controlled callback counts, modal
focus, accessibility-tree exclusion, and exiting Presence input/reversal.
Run `pnpm --filter @xplat/web exec node scripts/input-readiness.mjs`.
It uses an OS-assigned port and captures no images.

Native object-driver tests cover controlled echoes, blur handles, disabled
state mappings, and keyboard-inset units. They do not exercise the OS IME,
touch hit-testing, VoiceOver, or TalkBack. Check those on a simulator/device
with the target lock held, without resetting another session. Current
runtime evidence and exact remaining cases belong in
[input readiness notes](input-readiness-notes.md).
