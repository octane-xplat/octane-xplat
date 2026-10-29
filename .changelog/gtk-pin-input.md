### Enter short codes on GTK

PinInput is available from the GTK UI root, with sequential editing, automatic
focus advancement, controlled values, completion callbacks and secure cells.

```tsx
import { PinInput } from '@octane-xplat/ui'

export function CodeEntry() {
  return <PinInput label="Code" width={280} length={4} secure
    onComplete={(code) => console.log('Code length', code.length)} />
}
```

[Linux GTK PIN entry](https://octane-xplat.goddardai.org/linux-gtk#pin-entry)
