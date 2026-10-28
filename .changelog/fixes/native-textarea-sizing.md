### Release old height limits when native text areas change

TextArea on iOS and Android now clears previous row limits when you enable
uncapped autoGrow, remove maxRows, or set an explicit height. Authored
minHeight and maxHeight constraints keep their priority.

```tsx
import { TextArea } from '@octane-xplat/ui'

export function Notes(props: { limited: boolean }) {
  return <TextArea rows={2} autoGrow maxRows={props.limited ? 4 : undefined} />
}
```

[Size a multiline field](https://octane-xplat.goddardai.org/app/text-entry#size-a-multiline-field).
