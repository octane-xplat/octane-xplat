### Read layout measurements and breakpoints as signals

**Breaking change**

Rename `useMeasure`, `useMediaQuery`, and `useWindowSize` to `useMeasure$`, `useMediaQuery$`, and `useWindowSize$`. Read the measurement result with `bounds$.get()`. Read window size, media queries, and `useBreakpoints$` with `.get()` too, or pass their read-only signals into a derived calculation.

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

Breakpoints now use the same dimensions as `useWindowSize$`. On iOS and Android, those dimensions come from the main screen.

[Measuring elements](https://octane-xplat.goddardai.org/primitives#when-a-screen-needs-more) · [Platform services](https://octane-xplat.goddardai.org/platform-services)
