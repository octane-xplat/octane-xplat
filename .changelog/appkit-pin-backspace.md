### Move backward through an AppKit PIN

Pressing plain Backspace in an empty editable AppKit PIN cell now requests focus
on the preceding cell. It leaves the code unchanged; filled-cell deletion and
IME or modified shortcuts keep native editor behavior.

```tsx
import { PinInput } from '@octane-xplat/ui'

export function Code() {
	return <PinInput label="Verification code" length={4} />
}
```

Actual native key delivery, focus and VoiceOver remain unqualified. See
[AppKit PIN fields](https://octane-xplat.goddardai.org/app/primitives#pin-fields-on-appkit).
