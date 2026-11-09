### Compose measurements and responsive layout with signals

**Breaking change:** `useMeasure`, `useMediaQuery`, and `useWindowSize` become `useMeasure$`, `useMediaQuery$`, and `useWindowSize$`. Measurement results expose `bounds$` instead of `bounds`; window size, media queries, and `useBreakpoints$` return read-only signal handles. Read `.get()` for the current value or keep the handle for a derived calculation. The hook's component owns its subscriptions and releases them on unmount.

```tsx
import { derived$ } from 'octane/signals'
import { Text, View, useMeasure$, useMediaQuery$ } from '@octane-xplat/ui'

export function Card() {
  const { ref, bounds$ } = useMeasure$()
  const wide$ = useMediaQuery$('(min-width: 800px)')
  const width$ = derived$(() => bounds$.get()?.width ?? 0)

  return <View ref={ref}><Text>{`${width$.get()}: ${wide$.get() ? 'Wide' : 'Compact'}`}</Text></View>
}
```

Breakpoints now use the same dimensions as `useWindowSize$`, including native host resize events inside desktop webviews. Mobile dimensions remain main-screen measurements, rather than app-window measurements. See [measuring elements](https://octane-xplat.goddardai.org/primitives) and [platform services](https://octane-xplat.goddardai.org/platform-services).
