### Preserve AppKit composition during controlled updates

AppKit TextInput, TextArea and SearchInput now defer a different controlled
value while the native editor has marked text. A newer matching echo cancels
the older pending value, and removal cancels its observer and scheduled work.
Single-line and multiline submit paths leave marked-text confirmation to the
input context.

```tsx
import { useState } from 'octane'
import { TextInput } from '@octane-xplat/ui'

export function Name() {
	const [value, setValue] = useState('')
	return <TextInput label="Name" value={value} onChange={setValue} />
}
```

Real IME, field-editor/selection timing and packaging remain unqualified. See
[text and keyboard actions](https://octane-xplat.goddardai.org/app/primitives#text-and-keyboard-actions).
