### Adapt photo controls and reveal row actions

Web apps can sample image luminance with `useImageMode` and reveal secondary
row controls with `useContainerReveal`. Image sampling uses your fallback while
loading or on failure; native hosts return that fallback without sampling.

```tsx
import { Text, useImageMode } from '@octane-xplat/ui'

export function PhotoMode(props: { src: string }) {
  const mode = useImageMode(props.src, { fallback: 'dark' })
  return <Text>{mode}</Text>
}
```

[Media contrast and row actions](https://octane-xplat.goddardai.org/app/components#media-contrast-and-row-actions)
