### Honor native input-group field state

On iOS and Android, InputGroup now forwards width, read-only, loading and
status presentation to its field and member controls. Anonymous members no
longer inherit one shared control ID. Disabling the group also disables
actions inside its joined surface.

```tsx
import { InputGroup, TextInput } from '@octane-xplat/ui'

export function Amount() {
  return (
    <InputGroup label="Amount" width="100%" isReadOnly isLoading>
      <TextInput defaultValue="12" />
    </InputGroup>
  )
}
```

[Text entry](https://octane-xplat.goddardai.org/app/text-entry)
