### Keep rejected iOS and Android text edits in sync

Controlled TextArea and SearchInput fields on iOS and Android now restore the supplied value
when your app rejects an edit. Previously, leaving value unchanged could
leave the native editor showing the rejected text. Repeated rejected edits
also restore the last accepted value.

```tsx
import { TextArea } from '@octane-xplat/ui'
import { useState } from 'octane'

export function Note() {
  const [note, setNote] = useState('')
  return <TextArea value={note} onChange={(next) => {
    if (!next.includes('#')) setNote(next)
  }} />
}
```

[Controlled text fields](https://octane-xplat.goddardai.org/app/text-entry#control-a-field)
