### Return overlapping gestures to the current base

Motion press and focus feedback now compose per property. Press takes priority on shared properties; releasing either gesture keeps the other active. Releasing both returns to the latest base target, and changing one gesture no longer stops unrelated properties. Gesture-enabled hosts use per-frame JavaScript playback on web and native.

```tsx
import { motion } from '@octane-xplat/motion'

<motion.Pressable animate={{ scale: 1 }} whileFocus={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} />
```

See [animation and gestures](https://octane-xplat.goddardai.org/app/animation-gestures#combine-press-and-focus-feedback).
