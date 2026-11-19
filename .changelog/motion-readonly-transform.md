### Update the source of a derived Motion value

**Breaking change**

`useTransform` now returns a read-only value. Call `set`, `jump`, or `animate` on its source. The derived value follows automatically.

```tsx
import { motion, useMotionValue, useTransform } from '@octane-xplat/motion'
import { Button } from '@octane-xplat/ui'

export function FadeIn() {
  const progress = useMotionValue(0)
  const opacity = useTransform(progress, [0, 1], [0.2, 1])
  return <motion.View style={{ opacity }}>
    <Button label="Show" onPress={() => progress.set(1)} />
  </motion.View>
}
```

[Bind Motion values](https://octane-xplat.goddardai.org/animation-gestures#bind-values-and-gestures)
