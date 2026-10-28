### AppKit PIN field metadata

PinInput now inherits Field state and renders standalone metadata once. Each
cell has its own ID and accessible digit name; blocked groups cancel pending
focus advance, and validation changes preserve entered values.

```tsx
import { PinInput } from '@octane-xplat/ui'

export function Code() {
	return <PinInput label="Account code" description="Enter four characters" length={4} />
}
```

Shared paste/deletion behavior is unchanged. Native focus/IME/secure fields,
VoiceOver and OTP autofill remain unqualified or open. See
[PIN fields](https://octane-xplat.goddardai.org/app/primitives#pin-fields-on-appkit).
