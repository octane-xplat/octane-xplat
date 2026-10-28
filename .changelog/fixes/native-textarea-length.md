### Apply TextArea length limits on iOS and Android

TextArea now sends maxLength to the native text widget. Previously, the prop
was ignored on iOS and Android. Zero blocks new text; removing the prop
removes the limit. Each platform keeps its existing native insertion behavior.

```tsx
import { TextArea } from '@octane-xplat/ui'

export function ShortNote() {
  return <TextArea label="Note" defaultValue="" maxLength={200} />
}
```

[Multiline length limits](https://octane-xplat.goddardai.org/app/text-entry#limit-a-multiline-field)
