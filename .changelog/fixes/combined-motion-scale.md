### Keep combined scales steady when interrupted

Stopping or replacing a Motion tween that combines uniform and per-axis scale now keeps its current size. These tweens use JavaScript updates on web and native so their separate factors remain available; ordinary eligible tweens still use the platform animator.

```tsx
import { motion } from '@octane-xplat/motion'

<motion.View animate={{ scale: 2, scaleX: 2 }} transition={{ duration: 1 }} />
```

See [animation and gestures](https://octane-xplat.goddardai.org/app/animation-gestures).
