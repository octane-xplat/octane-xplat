### Keep supplied slider values during rejected drags

Shared native and web sliders now keep the supplied value when a controlled
parent rejects a drag, matching their keyboard editing behavior.

```tsx
import { useState } from 'octane'
import { Slider } from '@octane-xplat/ui'

export function LimitedVolume() {
  const [value, setValue] = useState(25)
  return <Slider value={value} onValueChange={(next) => {
    if (typeof next === 'number' && next <= 50) setValue(next)
  }} />
}
```

[Controlled sliders](https://octane-xplat.goddardai.org/linux-gtk#sliders)
