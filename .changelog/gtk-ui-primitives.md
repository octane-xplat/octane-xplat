### Use shared layout primitives on GTK

The experimental GTK target now exposes shared containers, stacks, grids,
page regions, badges, dividers, color swatches and size context.
AspectRatio derives height from allocated width; useMeasure observes bounds
relative to the app content, including ancestor scrolling.

```tsx
import { AspectRatio, Text, View, useMeasure } from '@octane-xplat/ui'

export function Preview() {
  const { ref, bounds } = useMeasure()
  return (
    <View ref={ref}>
      <AspectRatio ratio={2}><Text>Preview</Text></AspectRatio>
      <Text>{bounds ? `Width: ${bounds.width}` : 'Measuring…'}</Text>
    </View>
  )
}
```

Pressable supports GTK press-in/out, cancellation, pan and swipe callbacks.
Use setTranslate for gesture-driven motion, or useAnimation for timed or spring
playback. Animation runs settle when finished, replaced, stopped or unmounted.

```tsx
import { Pressable, Text, View, setTranslate, useAnimation } from '@octane-xplat/ui'

export function AnimatedTile() {
  const offset = useAnimation(0)
  return (
    <View>
      <View ref={offset.ref} style={{ width: 40, height: 40 }} />
      <Pressable
        onPress={() => { void offset.to(80) }}
        onPan={(event) => setTranslate(event.target, event.x, event.y)}
      ><Text>Move</Text></Pressable>
    </View>
  )
}
```

GTK textfield refs now preserve Unicode cursor/selection ranges during
programmatic text writes and support focus/blur. Read-only fields stay
selectable; disabled fields block interaction.

```tsx
import { useRef } from 'octane'
import type { HostElement } from '@octane-xplat/jsx/intrinsics'
import { Pressable, Text, View } from '@octane-xplat/ui'

export function FocusableField() {
  const field = useRef<HostElement | null>(null)
  return (
    <View>
      <textfield ref={field} text="Copy this text" editable={false} />
      <Pressable onPress={() => { field.current?.focus() }}>
        <Text>Focus the field</Text>
      </Pressable>
      <Pressable onPress={() => { field.current?.blur() }}>
        <Text>Release focus</Text>
      </Pressable>
    </View>
  )
}
```

Layout uses the XplatMason engine; the GTK surface remains a qualified subset
of the full UI. [GTK setup and support limits](https://octane-xplat.goddardai.org/platform/linux-gtk)
