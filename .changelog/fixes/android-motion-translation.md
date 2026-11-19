### Fix Motion distances on high-density Android screens

Movement now covers the requested distance and keeps its current position when stopped or replaced. Positions and velocities use device-independent units, including when handing off to a spring.

```tsx
import { motion } from '@octane-xplat/motion'

<motion.View animate={{ x: 100 }} transition={{ duration: 0.3 }} />
```

See [animation and gestures](https://octane-xplat.goddardai.org/animation-gestures).
