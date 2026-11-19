### Keep Motion press and focus effects working together

Press and focus effects can stay active together. When both change the same property, the press takes priority. Releasing it restores the focus effect, and ending both returns the property to its latest base value.

```tsx
import { motion } from '@octane-xplat/motion'

<motion.Pressable animate={{ scale: 1 }} whileFocus={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} />
```

See [animation and gestures](https://octane-xplat.goddardai.org/animation-gestures#combine-press-and-focus-feedback).
