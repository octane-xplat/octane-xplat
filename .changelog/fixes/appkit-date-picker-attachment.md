### Restore native macOS date-picker attachment

Native macOS date pickers no longer disappear when the AppKit host exposes native classes as object handles. Date, time and combined pickers can attach and receive selection and range updates through the renderer bridge.

```tsx
// Appointment.macos.tsx
import { AppKitDatePicker } from '@octane-xplat/date-picker/macos'

export function Appointment() {
  return <AppKitDatePicker components="dateAndTime" accessibilityLabel="Appointment" />
}
```

[Native macOS date pickers](https://octane-xplat.goddardai.org/date-picker#native-macos-selection-lifecycle)
