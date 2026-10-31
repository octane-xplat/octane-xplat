### Keep native text editing predictable

On iOS and Android:

- Controlled TextArea and SearchInput restore the supplied value when the
  parent rejects an edit, matching the other controlled fields. Repeated
  rejected edits restore the last accepted value.
- TextArea forwards `maxLength` to the native editor — the prop was
  previously ignored. Setting it to zero blocks new text and removing it
  lifts the limit.
- TextArea now rejects `secure` before rendering instead of accepting and
  ignoring it. Use a secure TextInput for password entry.

```tsx
import { TextArea } from '@octane-xplat/ui'

export function Bio({ value, onChange }) {
  return <TextArea value={value} onChange={onChange} maxLength={280} />
}
```
