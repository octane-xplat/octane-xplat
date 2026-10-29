### Choose one option with GTK radio fields

RadioList and RadioListItem are available from the GTK UI root. They support
field defaults, local or controlled selection, pointer focus, grouped keyboard
navigation and read-only or disabled state.

```tsx
import { RadioList } from '@octane-xplat/ui'

export function Delivery() {
  return <RadioList label="Delivery" defaultValue="standard"
    options={[
      { value: 'standard', label: 'Standard' },
      { value: 'express', label: 'Express' },
    ]} />
}
```

[Linux GTK single-choice fields](https://octane-xplat.goddardai.org/linux-gtk#single-choice-fields)
