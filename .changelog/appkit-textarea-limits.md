### Length limits for AppKit text areas

AppKit TextArea now implements `maxLength` for committed user edits. It keeps
text outside a paste/replacement and leaves marked input intact until commit.
The cap counts UTF-16 units; initial and external values are not truncated.

```tsx
import { TextArea } from '@octane-xplat/ui'

export function Note() {
	return <TextArea label="Short note" maxLength={80} autoGrow maxRows={4} />
}
```

Real IME, undo/redo, selection and native packaging remain unqualified. See
[multiline fields](https://octane-xplat.goddardai.org/app/primitives#grow-a-multiline-field).
