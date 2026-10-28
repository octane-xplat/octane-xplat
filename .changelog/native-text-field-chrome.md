### Keep native text-field sizing and status together

Native TextInput now forwards standalone width and field-wrapper state, including
read-only, loading, size and status presentation. GTK source fixtures also gain
keyboard-accessible clear/help controls and validation tooltips. TextInput remains
outside the curated GTK root while its remaining input contract is qualified.

```tsx
/** @jsxImportSource @octane-xplat/jsx */
import { TextInput } from '@octane-xplat/ui'

// Shared native UI; the GTK root export is still under qualification.
export function AccountField() {
  return (
    <TextInput
      label="Account"
      width="75%"
      isLoading
      status={{ type: 'error', message: 'Account is required' }}
      statusVariant="tooltip"
    />
  )
}
```

[GTK qualification](https://octane-xplat.goddardai.org/platform/linux-gtk#check-the-runtime).
