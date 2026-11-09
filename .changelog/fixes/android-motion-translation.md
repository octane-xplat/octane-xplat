### Keep Android motion in the right place

Android Motion tweens now travel the requested distance on high-density screens and keep their current position when stopped or replaced. Translation samples and velocities use logical DIPs, including when a tween hands off to a spring. Pass the same values on every screen density:

```tsx
import { motion } from '@octane-xplat/motion'

<motion.View animate={{ x: 100 }} transition={{ duration: 0.3 }} />
```

See [animation and gestures](https://octane-xplat.goddardai.org/app/animation-gestures).
