### Use checkbox and switch fields on GTK

CheckboxInput and Switch are available from the GTK UI root. They support
controlled or local state, field defaults, async actions, label clicks and
keyboard selection. Checkboxes also expose a native mixed state.

```tsx
import { CheckboxInput, Switch, FormLayout } from '@octane-xplat/ui'

export function Preferences() {
  return (
    <FormLayout>
      <CheckboxInput label="Keep receipts" defaultValue="indeterminate" />
      <Switch label="Notifications" defaultValue />
    </FormLayout>
  )
}
```

[Linux GTK toggle fields](https://octane-xplat.goddardai.org/platform/linux-gtk#toggle-fields)
