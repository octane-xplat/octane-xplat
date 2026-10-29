### Size a complete native checkbox field

On iOS, Android and GTK, CheckboxList lays out its label, options and status
together. Previously, the native list ignored width.

```tsx
import { CheckboxList } from '@octane-xplat/ui'

export function Features() {
  return <CheckboxList label="Features" width={280}
    options={[{ value: 'calendar', label: 'Calendar' }]} />
}
```

[Input controls](https://octane-xplat.goddardai.org/components#inputs)
