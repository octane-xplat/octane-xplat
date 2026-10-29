### Edit numeric fields on GTK

NumberInput is available from the GTK UI root, with numeric or empty values,
field labels and state, fractional steppers, units, formatted readouts and an
optional clear action.

```tsx
import { NumberInput } from '@octane-xplat/ui'

export function Quantity() {
  return <NumberInput label="Quantity" defaultValue={2.5}
    min={0} max={10} step={0.5} units="kg" hasClear />
}
```

[Linux GTK numeric fields](https://octane-xplat.goddardai.org/linux-gtk#numeric-fields)
