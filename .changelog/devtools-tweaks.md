---
hype: 80
---

### Edit running-app values and styles from devtools

Mark a literal editable with `useTweak` from `octane-xplat/tweaks`, run the app
under `xplat dev`, and change it live from the new native devtools window —
`xplat devtools` on macOS finds running dev servers and opens your app
automatically. Save writes values and style drafts back to source literals;
production bundles keep only the literal.

```tsx
import { View } from '@octane-xplat/ui'
import { useTweak } from 'octane-xplat/tweaks'

export function Card() {
  const radius = useTweak(8, { input: { type: 'number', min: 0, max: 40 } })

  return <View style={{ borderRadius: radius }} />
}
```

Packages can add their own devtools tabs with the new panel plugin API:
define a panel with `defineDevtoolsPanel` and point `octaneXplat.devtoolsPanel`
at its module. See [tweaks](https://octane-xplat.goddardai.org/package-tweaks)
and [devtools](https://octane-xplat.goddardai.org/package-devtools).
