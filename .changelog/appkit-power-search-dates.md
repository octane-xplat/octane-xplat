### Keep timestamps when editing native macOS filters

AppKit PowerSearch now preserves an unchanged absolute timestamp's time and
precision and rejects invalid UTC calendar input. Date-only operators deliberately
save midnight UTC. Calendar widgets and timezone-specific display still need a
custom editor; native input and accessibility qualification is pending.

```ts
import type { DateAbsoluteOperatorValue } from '@octane-xplat/ui'
const timestamp: DateAbsoluteOperatorValue = { type: 'date_absolute' }
const day: DateAbsoluteOperatorValue = { type: 'date_absolute', isDateOnly: true }
```

See [AppKit absolute dates](https://github.com/octane-xplat/octane-xplat/blob/main/docs/app/power-search.md#edit-native-appkit-absolute-dates).
