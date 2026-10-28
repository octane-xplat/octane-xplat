### Use shared layout primitives on GTK

The experimental GTK target now exposes shared containers, stacks, grids,
page regions, badges, dividers, color swatches and size context. Pressable
supports press-in/out, cancellation, pan and swipe callbacks. Layout uses the
XplatMason engine; the GTK surface remains a qualified subset of the full UI.

```tsx
import { Stack, Text, Badge } from '@octane-xplat/ui'

export function BuildStatus() {
  return <Stack direction="horizontal" gap={2}><Text>Linux build</Text><Badge label="Ready" /></Stack>
}
```

[GTK setup and support limits](https://octane-xplat.goddardai.org/platform/linux-gtk)
