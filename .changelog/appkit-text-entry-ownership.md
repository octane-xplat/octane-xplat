### Owned AppKit text entry state

Experimental AppKit text fields now use current editable state and callbacks
for edits, submit and clear. Clear preserves callback-chosen focus; retained
handles and handlers become inert after removal. Composing drafts still report
edits, while submit and clear wait for committed text.

```tsx
import { TextInput } from '@octane-xplat/ui'
export function Name() {
	return <TextInput label="Name" defaultValue="Ada" hasClear
		onChange={(text) => console.log(text)} onSubmit={() => console.log('Submit')} />
}
```

Native editing, IME, caret, clear/focus and packaging remain unqualified. See
[AppKit text action ownership](https://octane-xplat.goddardai.org/app/text-entry#keep-appkit-text-actions-owned-by-the-current-field).
