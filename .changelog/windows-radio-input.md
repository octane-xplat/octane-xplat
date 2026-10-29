### Choose exclusive settings on native Windows

The experimental Windows RadioList now uses native radio input with the shared
row design. Options and child items support caller-owned selection, disabled
choices and read-only groups.

```tsx
import { RadioList } from '@octane-xplat/ui'

export function DeliveryMethod() {
  return <RadioList ariaLabel="Delivery" defaultValue="email"
    options={[{ value: 'email', label: 'Email' }, { value: 'sms', label: 'Text message' }]} />
}
```

See the [Windows radio qualification boundary](https://github.com/octane-xplat/octane-xplat/blob/main/docs/platform/windows-setup.md#radio-choices).
