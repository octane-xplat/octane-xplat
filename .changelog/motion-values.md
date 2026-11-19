### Animate sizes and clipping with Motion

On web, iOS, and Android, Motion can animate supported sizes, spacing, borders, shadows, and clip paths. Use fixed lengths or supported relative units such as percentages. Shapes and paths need compatible endpoints.

```tsx
import { motion } from '@octane-xplat/motion'

export const Reveal = () => (
  <motion.View
    style={{ width: 240, height: 160 }}
    initial={{ clipPath: 'inset(20% round 16px)' }}
    animate={{ clipPath: 'inset(0% round 0px)' }}
  />
)
```

[Animate sizes, units, and clipping](https://octane-xplat.goddardai.org/animation-values)
