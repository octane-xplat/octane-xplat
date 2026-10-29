### Draw selection indicators on GTK

GTK apps can import the shared checkbox, radio and check indicators, plus
the indicator registry and subscribed useIndicator hook. Replace a selection
mark without changing the owning control's input behavior.

```tsx
import { CheckboxIndicator, CheckIndicator, RadioIndicator } from '@octane-xplat/ui'

export function SelectionMarks() {
  return (
    <>
      <CheckboxIndicator state="indeterminate" size="sm" />
      <RadioIndicator state="checked" />
      <CheckIndicator state="checked" />
    </>
  )
}
```

[GTK indicators](https://octane-xplat.goddardai.org/linux-gtk#draw-selection-indicators)
