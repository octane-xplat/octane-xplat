### Join inputs with shared field state

InputGroup gives member inputs a shared border and keeps prefixes and suffixes
inside its authored width. GTK apps can now import InputGroup and
InputGroupText from the UI root, with shared labels, help, status and state.

```tsx
import { InputGroup, InputGroupText, TextInput } from '@octane-xplat/ui'

export function Price() {
  return (
    <InputGroup label="Amount" description="Before tax" width="100%">
      <InputGroupText>$</InputGroupText>
      <TextInput defaultValue="12" />
    </InputGroup>
  )
}
```

[GTK setup](https://octane-xplat.goddardai.org/linux-gtk)
