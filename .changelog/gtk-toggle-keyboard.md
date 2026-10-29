### Use the keyboard with custom GTK toggles

Custom GTK controls with checkbox or switch roles now accept Tab focus and
activate on Space release. Keep the checked metadata in sync with your state.

```tsx
/** @jsxImportSource @octane-xplat/jsx */
import { CheckboxIndicator } from '@octane-xplat/ui'

export function Selection(props: { selected: boolean; toggle: () => void }) {
  return (
    <masonview accessibilityRole="checkbox" accessibilityLabel="Keep receipts"
      accessibilityState={{ checked: props.selected }} onTap={props.toggle}
      style={{ display: 'flex', width: 24, height: 24 }}>
      <CheckboxIndicator state={props.selected ? 'checked' : 'unchecked'} />
    </masonview>
  )
}
```

The shared CheckboxInput and Switch components remain outside the curated GTK
root while their remaining contracts are qualified.
[GTK keyboard actions](https://octane-xplat.goddardai.org/linux-gtk#keyboard-press-actions)
