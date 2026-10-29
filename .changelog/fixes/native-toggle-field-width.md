### Size native toggle fields as one unit

CheckboxInput and Switch now apply width to the complete native field,
including its label and status. Previously, these controls ignored width.

```tsx
import { Switch } from '@octane-xplat/ui'

export function Notifications() {
  return <Switch label="Notifications" width={240} defaultValue />
}
```

[Input controls](https://octane-xplat.goddardai.org/components#inputs)
