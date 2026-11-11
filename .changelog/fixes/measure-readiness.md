### Report element bounds only after a usable layout

`useMeasure$` now keeps `bounds$` at `null` until the attached host completes its first layout, instead of publishing a pre-layout `0×0` — `null` is the "not laid out yet" readiness signal. An element that genuinely measures to zero still reports `0×0` once laid out, so work that needs room should check `bounds.width > 0 && bounds.height > 0`, not just non-null. With `observe: false`, the hook keeps listening until the first usable read lands, then releases its listeners.

```tsx
import 'octane/signals'
import { useEffect } from 'octane'
import { View, useMeasure$ } from '@octane-xplat/ui'

export function AnimatedSurface() {
  const { ref, bounds$ } = useMeasure$()

  useEffect(() => {
    const bounds = bounds$.get()
    if (bounds && bounds.width > 0 && bounds.height > 0) {
      console.log('Ready at', bounds.width, 'x', bounds.height)
    }
  })

  return <View ref={ref} />
}
```

See [measuring elements](https://octane-xplat.goddardai.org/primitives).
