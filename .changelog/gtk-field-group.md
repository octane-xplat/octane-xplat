### Group related fields on GTK

GTK apps can import FieldGroup and useFieldControl from the UI root. Related
editors keep their text and focus when the group heading changes or disappears.
Custom field parts can read the same inherited defaults as the built-in inputs.

```tsx
import { FieldGroup, TextInput } from '@octane-xplat/ui'

export function Address() {
  return (
    <FieldGroup label="Address">
      <TextInput label="Street" />
      <TextInput label="City" />
    </FieldGroup>
  )
}
```

[GTK setup](https://octane-xplat.goddardai.org/linux-gtk)
