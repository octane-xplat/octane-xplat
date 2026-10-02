# Enter and submit text

> Keep controlled text, focus, keyboard actions, and field names consistent
> while treating real IME and screen-reader checks as separate verification.

## Control a field

Keep the latest edit in state and pass it back as `value`. Updating `value`
from another action must not call `onChange`; the callback reports edits,
not the field's controlled write-back. `TextInput`, `TextArea`, and
`SearchInput` use this contract. `SearchInput` also supports uncontrolled
`defaultValue`.

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
				<TextInput
					value={name}
					onChange={setName}
					bind={(handle) => { input.current = handle }}
				/>
			</Field>
			<Pressable onPress={() => setName('')}><Text>Clear</Text></Pressable>
			<Pressable onPress={() => input.current?.blur()}><Text>Done</Text></Pressable>
		</KeyboardAvoiding>
	)
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

## Preserve editing and submit deliberately

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

## Release and restore focus

Keep the `bind` handle for `focus()` and `blur()`. `blur()` dismisses the
native keyboard; on Android it also clears EditText focus. After closing a
native overlay, explicitly focus the field or action that should resume
editing. Automatic native overlay focus restoration and isolation remain
unverified.

`KeyboardAvoiding` adds keyboard space on iOS and requests Android window
resize. Bottom-anchored native shared sheets also account for the keyboard;
the Android inset fallback converts physical pixels into layout dips. Check
the last field with the software keyboard open, including a sheet opened
while the keyboard is already visible. Observer/property tests alone do not
verify viewport behavior on a device.

On web, shared `BottomSheet` with its default shade, and
`Overlay` with `shadeCover`, move focus into the panel, cycle Tab inside it,
dismiss on Escape, and restore a connected trigger when closed. Nested modals
isolate the top panel. Background portals become inert too. A nonmodal surface
without a shade does not take over focus. Give a BottomSheet a name through
`web={{ 'aria-label': 'Edit name' }}` and provide a visible close action.
The separate `@octane-xplat/sheet` leaf's `BottomSheet` still needs its own
keyboard-focus qualification; shared BottomSheet results do not cover it.

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
