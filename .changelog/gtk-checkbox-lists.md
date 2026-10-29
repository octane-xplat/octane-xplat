### Select several options on GTK

CheckboxList and CheckboxListItem are available from the GTK UI root. They
support local or controlled checked sets, shared field labels and state,
compact indicators, dividers and standalone partially selected items.

```tsx
import { CheckboxList } from '@octane-xplat/ui'

export function Features() {
  return <CheckboxList label="Features" defaultValue={['calendar']}
    options={[
      { value: 'calendar', label: 'Calendar' },
      { value: 'backup', label: 'Backup' },
    ]} />
}
```

[Linux GTK multiple-choice fields](https://octane-xplat.goddardai.org/linux-gtk#multiple-choice-fields)
