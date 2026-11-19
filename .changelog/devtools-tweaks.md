---
hype: 80
---

### Edit running-app values with Tweaks

Use `useTweak` to make a number, color, label, or other literal editable while the app is running. Preview edits in the Tweaks tab and save them back to source when you’re happy with the result. Production builds use the source value.

```tsx
import { Text } from '@octane-xplat/ui'
import { useTweak } from 'octane-xplat/tweaks'

export function Greeting() {
  const title = useTweak('Welcome')
  return <Text>{title}</Text>
}
```

[Tweaks setup](https://octane-xplat.goddardai.org/package-tweaks)
