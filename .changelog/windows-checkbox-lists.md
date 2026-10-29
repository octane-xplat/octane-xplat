### Use checkbox lists with a Windows keyboard

The experimental native Windows `CheckboxList` and `CheckboxListItem` now
support keyboard and toggle automation input while keeping shared checkbox
appearance. Controlled selection, select-all and keyed option reorder use the
same public API:

```tsx
import { CheckboxList, CheckboxListItem } from '@octane-xplat/ui'

export function Channels() {
  return <CheckboxList ariaLabel="Channels" defaultValue={['email']}>
    <CheckboxListItem value="email" label="Email" />
    <CheckboxListItem value="sms" label="Text message" />
  </CheckboxList>
}
```

Packaged x64 checks cover common input and selection flows. Full field behavior,
screen-reader and visual parity remain open. See the [Windows list qualification boundary](https://github.com/octane-xplat/octane-xplat/blob/main/docs/platform/windows-setup.md#checkbox-lists).
