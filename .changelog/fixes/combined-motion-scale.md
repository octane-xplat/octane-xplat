### Keep the current size when a combined scale animation stops

A Motion animation that combines `scale` with `scaleX` or `scaleY` now keeps its current size when stopped or replaced.

```tsx
import { motion } from '@octane-xplat/motion'

<motion.View animate={{ scale: 2, scaleX: 2 }} transition={{ duration: 1 }} />
```

See [animation and gestures](https://octane-xplat.goddardai.org/animation-gestures).
