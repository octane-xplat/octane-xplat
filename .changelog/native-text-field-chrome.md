### Build GTK forms with TextInput

The experimental GTK renderer now exposes TextInput from @octane-xplat/ui.
It supports controlled or default text, field labels and status, keyboard
clear/help actions, native focus/blur handles and validation tooltips.
Editor text, selection and focus stay attached when field chrome or leading
content changes. Controlled fields restore values rejected by their parent.

```tsx
/** @jsxImportSource @octane-xplat/jsx */
import { useState } from 'octane'
import { TextInput } from '@octane-xplat/ui'

export function ReferenceField() {
  const [value, setValue] = useState('')
  return (
    <TextInput
      label="Reference"
      value={value}
      onChange={(next) => { if (/^\d*$/.test(next)) setValue(next) }}
      keyboardType="number"
      width="75%"
      hasClear
      status={value ? undefined : { type: 'error', message: 'Enter digits' }}
      statusVariant="tooltip"
    />
  )
}
```

GTK keeps normal Return submission; its Entry API does not provide per-field
Return-key captions. The renderer reports that boundary once when a caption
hint is supplied.

[GTK text entry](https://octane-xplat.goddardai.org/platform/linux-gtk#text-entry).
