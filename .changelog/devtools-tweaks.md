---
hype: 80
---

### Edit running-app values and styles from devtools

Mark a literal editable with `useTweak` from `octane-xplat/tweaks`, run the app under `xplat dev`, and change it live from the new native devtools window. On macOS, `xplat devtools` finds running dev servers and opens your app automatically. Separate Tweaks and Styles tabs edit values and style objects; each saves and reverts only its own changes, including edits to components no longer on screen. Styles includes element picking and property filtering. Production bundles keep only the source literal.

```tsx
import { View } from '@octane-xplat/ui'
import { useTweak } from 'octane-xplat/tweaks'

export function Card() {
  const radius = useTweak(8, { input: { type: 'number', min: 0, max: 40 } })

  return <View style={{ borderRadius: radius }} />
}
```

Packages can add their own devtools tabs with the new panel plugin API: define a panel with `defineDevtoolsPanel` and point `octaneXplat.devtoolsPanel` at its exported module, or list several modules to add several tabs:

```json
{
  "octaneXplat": {
    "devtoolsPanel": ["./devtools", "./devtools/styles"]
  }
}
```

See [tweaks](https://octane-xplat.goddardai.org/package-tweaks) and [devtools](https://octane-xplat.goddardai.org/package-devtools).
