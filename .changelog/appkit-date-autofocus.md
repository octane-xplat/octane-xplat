### Experimental AppKit date and time autofocus

DateInput and TimeInput now wire their existing `hasAutoFocus` flag on macOS.
The queued request waits for attachment and cancels when the user interacts,
focus ownership changes or the field becomes blocked or unmounts. A cancelled
request requires a new false-to-true flag transition; unblocking alone does not
rearm it. The request never activates a window or opens a picker.

```tsx
import { DateInput } from '@octane-xplat/ui'
export function NewBooking() {
	return <DateInput label="Booking date" hasAutoFocus />
}
```

Native focus/caret/IME, notification timing, modal integration, accessibility and
packaging remain unqualified. See [date focus guidance](https://octane-xplat.goddardai.org/platform/date-picker#request-initial-appkit-date-or-time-focus).
