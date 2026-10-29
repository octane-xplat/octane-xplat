### Reject unsupported secure multiline input

On iOS, Android and GTK, TextArea now rejects secure=true before rendering.
Previously, the prop
was accepted and ignored, leaving the text visible. Use a secure TextInput for
password entry.

```tsx
import { TextInput } from '@octane-xplat/ui'

export function Password() {
  return <TextInput label="Password" secure />
}
```

[Text entry](https://octane-xplat.goddardai.org/app/text-entry)
