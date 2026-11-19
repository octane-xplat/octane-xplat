### Report element bounds only after a usable layout

`useMeasure$` now reports `null` until the element completes its first layout. A laid-out element can still measure zero. Check both dimensions before starting work that needs space. With `observe: false`, the hook stops listening after the first layout measurement.

```tsx
import 'octane/signals'
import { useEffect } from 'octane'
import { View, useMeasure$ } from '@octane-xplat/ui'

export function AnimatedSurface() {
  const { ref, bounds$ } = useMeasure$({ observe: false })

  useEffect(() => {
    const bounds = bounds$.get()
    if (bounds && bounds.width > 0 && bounds.height > 0) {
      console.log('Ready at', bounds.width, 'x', bounds.height)
    }
  })

  return <View ref={ref} />
}
```

See [measuring elements](https://octane-xplat.goddardai.org/primitives#when-a-screen-needs-more).
