### Keep native number fields editable and complete

On iOS, Android and GTK, NumberInput applies its field label, width and state to the editor
and actions together. Typing a decimal preserves the unfinished number until
it is committed, and rejected controlled edits restore the owner.

```tsx
import { NumberInput } from '@octane-xplat/ui'

export function Quantity() {
  return <NumberInput label="Quantity" width={280} defaultValue={2.5}
    min={0} max={10} step={0.5} />
}
```

[Input controls](https://octane-xplat.goddardai.org/components#inputs)
