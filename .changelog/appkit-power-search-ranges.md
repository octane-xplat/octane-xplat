### Edit date-range filters on native macOS

AppKit PowerSearch now has a built-in range form for Now, UTC date/time and
relative endpoints, plus named interval presets. Invalid or reversed ranges do
not save. Timezone display and expression-string presets still need a custom
editor; native input and accessibility qualification remains pending.

```ts
import { createPowerSearchConfig } from '@octane-xplat/ui'
const { config } = createPowerSearchConfig([{ key: 'created', type: 'date', label: 'Created' }] as const)
// Use config with PowerSearch and choose the date field's between operator.
```

See [native AppKit range editing](https://github.com/octane-xplat/octane-xplat/blob/main/docs/app/power-search.md#edit-native-appkit-date-ranges).
